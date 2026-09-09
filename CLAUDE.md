
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # Install deps (discord.js only — SQLite is built into Bun)
bun start          # Start the bot (src/index.js)
docker build -t fade-discord-bot .   # Build the deployment image
```

No build step, no tests, no linting configured. Runtime is Bun (not Node) — the code uses
`bun:sqlite`, so it cannot run under Node.

## Architecture

Discord.js v14 booking bot for FadeSolutions. Two main flows: **support tickets** and **optimization bookings**. Tickets use **private threads** (not channels).

### Handler Auto-Loading

`src/index.js` auto-loads commands from `src/commands/` and events from `src/events/`. The interaction router (`src/events/interactionCreate.js`) auto-loads component handlers from `src/components/{buttons,selects,modals}/` into Maps keyed by `customId`. Each handler exports `{ customId, execute(interaction) }`.

### Legacy Booking Flow (Old — still exists but not reachable from new panel)

1. **Panel select menu** (`ticketPanelSelect.js`) → user picks "Purchase" → shows 3 ephemeral select menus + Continue button
2. **Continue button** (`continueBooking.js`) → validates session → opens modal
3. **Modal submit** (`bookingForm.js`) → creates thread with booking summary

### New Multi-Step Booking Flow

The service channel has its own Components V2 panel with a service select menu. The guided flow:

1. **Service panel** (`servicePanelService.js`) → Components V2 panel in optimization channel with section buttons (3 services: Core Optimization €90, Signature Optimization €130, Care Plan €25/month)
2. **Service select** (`selectServiceButton.js`) → ephemeral service detail embed (price, duration, features) + "Ready to Buy" / "More Questions" buttons. Care Plan requires Core or Signature Discord role.
3. **Confirm service** (`confirmService.js`) → shows payment method select menu
4. **"More Questions"** (`askQuestion.js`) → auto-creates support ticket in support channel named `support-[service]-[username]`
5. **Payment select** (`selectPayment.js`) → stores payment, acknowledges fee if PaySafeCard/Gift Card (+€15), shows goal select
6. **Goal select** (`selectGoal.js`) → stores goal, opens booking modal
7. **Booking modal** (`bookingModal.js`) → creates private thread with booking summary + payment instructions embeds, records ticket in SQLite

The `confirmService` button uses dynamic customIds (`confirm_service_core_optimization`). The interaction router supports prefix matching for buttons as a fallback.

Ticket naming: booking tickets are named `[service-name]-[username]` (e.g. `signature-optimization-don-arrows`). Support tickets from "More Questions" are named `support-[service-name]-[username]`.

Booking selections held in-memory via `bookingService.js` (15-min TTL). On ticket creation, data persists to SQLite via `stateService`.

### Review & Approve Flow

After booking thread is created, staff uses slash commands to manage:

1. **`/approve`** — staff-only, thread-only. Sends a single message: "Your booking has been approved. A staff member will send you payment instructions shortly."
2. **`/close`** — staff-only, thread-only. Opens close modal with optional reason.

### Close Ticket Flow

Works for both support and booking tickets:

1. **Staff clicks "Close Ticket"** (`closeTicket.js`) → modal asks for optional reason
2. **Confirmation embed** (`closeTicketModal.js`) → "Confirm Close" / "Cancel" buttons
3. **On confirm** (`confirmClose.js`) → thread locked & archived → log embed sent to `LOG_CHANNEL_ID`
4. **On cancel** (`cancelClose.js`) → confirmation message deleted

### Ticket State System (SQLite)

Tickets are tracked in `$DATA_DIR/tickets.db` (`DATA_DIR` defaults to `./data`, set to `/app/data`
in Docker where a volume must be mounted). The DB is auto-created on first run via `bun:sqlite`.
Two tables:
- **tickets** — current state per ticket (OPENED → PAYMENT_RECEIVED → SESSION_SCHEDULED → SESSION_COMPLETE → CLOSED)
- **ticket_events** — append-only log of all state changes for future analytics (drop-off tracking, conversion reports)

The `stateService` wraps all SQLite operations. Ticket records are created when a booking thread is opened.

### Auto-Post Panels

On `ClientReady`, `src/events/ready.js`:
1. Initializes SQLite database
2. Registers the slash commands as guild commands (`guild.commands.set`) — idempotent, so every deploy ships commands matching the running code
3. Posts support panel to support channel via `panelService.postPanel()`
4. Posts service panel to optimization channel via `servicePanelService.postServicePanel()`

Both panel posts go through `panelGuard.panelAlreadyPosted()`, which scans the last 50 messages for
a bot message carrying the panel banner and skips posting if found. Without it every container
restart would post a duplicate panel. Set `REPOST_PANELS=true` to force a fresh post.

### Components V2 Panels

Two separate Components V2 panels:
- **Support panel** (`panelService.js`) — existing, uses `tickets.png` banner, has Purchase/Support select
- **Service panel** (`servicePanelService.js`) — new, uses `optimization.png` banner, has 3-service select menu

Components V2 requires `MessageFlags.IsComponentsV2` flag. Built with `ContainerBuilder`, `MediaGalleryBuilder`, `TextDisplayBuilder`, `SeparatorBuilder`.

### Error Handling

The interaction router silently suppresses error code `10062` (Unknown interaction) — these are stale interactions from before bot restart and are expected.

### Services

- **ticketService** — creates private threads, tracks openers in-memory, handles close (lock + archive)
- **paymentService** — returns payment instructions and fee amounts by method
- **bookingService** — in-memory session state between select menus and modal (15-min TTL)
- **embedService** — builds Components V2 panels, regular embeds for booking/review/close/log, action rows
- **panelService** — posts support panel to support channel on startup using Components V2
- **servicePanelService** — posts service panel to optimization channel on startup using Components V2
- **stateService** — SQLite-backed ticket state tracking (`$DATA_DIR/tickets.db`) via `bun:sqlite`, stores ticket records and events
- **panelGuard** — skips panel posting when a panel is already present in the channel

### Config

- `config/settings.js` — reads `process.env` (token, guild/channel/role IDs, log channel). Includes `coreRoleId` and `signatureRoleId` for Care Plan access control.
- `config/constants.js` — all custom IDs, service/payment/goal option arrays, `serviceDetails` per-service metadata, embed colors
- All interaction custom IDs are centralized in `constants.customIds` — never hardcode them in handlers
- New booking flow customIds: `selectService`, `confirmService`, `askQuestion`, `selectPayment`, `selectGoal`, `bookingModal`
- discord.js v14.26+: use `flags: MessageFlags.Ephemeral` instead of `ephemeral: true`
- Deployment-only env vars: `DATA_DIR` (SQLite location) and `REPOST_PANELS`

## Deployment

The bot ships as a Docker image built by `.github/workflows/docker-publish.yml` on every push to
`main` and pushed to `ghcr.io/<owner>/fade-discord-bot:latest` (plus a `:<sha>` tag). Dokploy pulls
that image.

- `Dockerfile` — two stages on `oven/bun:1.2-alpine`; deps installed with `--frozen-lockfile --production`, runs as the non-root `bun` user
- The container needs a persistent volume mounted at `/app/data` or ticket history is lost on redeploy
- No ports are exposed — the bot is a worker, it needs no domain or healthcheck port
- All config comes from environment variables set in Dokploy (see `.env.example`)

### Assets

Banner images live in `assets/images/`. Embeds reference them via `AttachmentBuilder` + `attachment://filename.png`.

## Repo

GitHub: `eros-co/fade-discord-bot`. Always commit and push after changes. Always update this file when the architecture changes.
