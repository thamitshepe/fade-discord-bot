# Booking Flow Redesign & Ticket State System

**Date:** 2026-04-09
**Status:** Approved

## Overview

Redesign the booking flow for the FadeSolutions Discord bot service channel. Replaces the existing simultaneous-dropdown booking flow with a guided multi-step flow. Adds persistent ticket state tracking via SQLite and 48-hour auto-close for unpaid tickets.

Existing support flow and ticket close logic are untouched.

## Services

| Service | Price | Recurring |
|---------|-------|-----------|
| Core Session | €90 | No |
| Ranked Ready | €130 | No |
| Care Plan | €25/month | Yes |

**Core Session:** Full Windows OS optimization + BIOS + Hidden BIOS configuration. For players experiencing lag, stuttering, FPS drops, input delay.

**Ranked Ready:** Everything in Core + RAM timing tuning + 7-day priority support window. For competitive players who want every possible edge extracted from their hardware.

**Care Plan:** Quarterly remote check-up, verification that optimizations are intact, minor re-tuning if needed, priority contact. For clients who want ongoing peace of mind after their session.

## Booking Flow

### Step 1 — Service Channel Panel

A Components V2 panel posted in the service channel on bot startup. Contains:
- Banner image (`optimization.png`) via `MediaGalleryBuilder`
- Heading + short description via `TextDisplayBuilder`
- Separator
- `StringSelectMenuBuilder` with 3 services (name + price)

This replaces the old shared panel for the service channel. The support channel keeps its existing panel via `panelService.js`.

### Step 2 — Service Detail + Decision

After selecting a service, the bot replies with an ephemeral embed showing:
- What is included (brief bullet points)
- Who it is for (pain points)
- Two buttons:
  - "I'm Ready — Book Now" → proceeds to Step 3
  - "I Have a Question" → auto-creates a support ticket in the support channel and sends ephemeral confirmation

### Step 3 — Payment Method Selection

Ephemeral select menu with 5 options:
- PayPal (Friends & Family)
- Crypto
- Credit / Debit Card
- PaySafeCard (+€15 processing fee)
- Gift Card (+€15 processing fee)

If user selects PaySafeCard or Gift Card, the bot acknowledges the fee before continuing.

### Step 4 — Goal Selection

Ephemeral select menu with 4 options:
- Higher FPS
- Less Input Lag
- Stability
- Streaming & Recording

After selection, the modal opens immediately.

### Step 5 — Booking Form (Modal)

Discord modal with 3 text inputs:
1. **PC Specs** — helper text: "Not sure? Press Ctrl + Shift + Esc, click Performance, and tell us what you see. CPU, GPU, and RAM is enough."
2. **Games you play** — helper text: "e.g. Fortnite, Valorant, CS2, FiveM"
3. **Apps / Software running in background** — helper text: "e.g. Discord, Spotify, OBS, Steam overlay"

Goal is already captured from Step 4 (stored in bookingService session).

### Step 6 — Ticket Creation

After modal submission:
1. Creates private thread via `ticketService.createTicket()` (existing logic)
2. Posts booking summary embed with: service, payment method, goal, PC specs, games, apps
3. Posts payment instructions based on selected method:
   - PayPal F&F: payments@fadesolutions.com
   - Crypto: CRYPTO_WALLET placeholder
   - Card: CARD_LINK placeholder
   - PaySafeCard / Gift Card: instructions + fee notice
4. Posts message telling user to send proof of payment
5. Creates ticket record in SQLite with state `OPENED`
6. Deletes in-memory booking session

## "I Have a Question" Flow

When user clicks "I Have a Question" in Step 2:
1. Bot calls `ticketService.createTicket()` with type `support` in the support channel
2. Sends ephemeral message: "A support ticket has been created for you in #support"
3. User is redirected to the support channel — no ticket created in the service channel

## Session State (In-Memory)

The existing `bookingService.js` continues to hold ephemeral booking data during the multi-step flow:
- Service selection
- Payment method
- Goal
- 15-minute TTL

This is temporary state between interactions. Once the modal is submitted and the ticket is created, the data moves to SQLite for persistent tracking.

## Ticket State System (SQLite)

### Database

File: `data/tickets.db` (auto-created on first run via `bun:sqlite`)

### Schema

**`tickets` table:**

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| thread_id | TEXT UNIQUE | Discord thread ID |
| user_id | TEXT | Discord user ID |
| guild_id | TEXT | Discord guild ID |
| type | TEXT | `booking` or `support` |
| state | TEXT | OPENED, PAYMENT_RECEIVED, SESSION_SCHEDULED, SESSION_COMPLETE, CLOSED |
| service | TEXT | Selected service value (nullable for support) |
| payment_method | TEXT | Selected payment method (nullable for support) |
| goal | TEXT | Selected goal (nullable for support) |
| close_reason | TEXT | Reason for close (nullable) |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

**`ticket_events` table:**

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| thread_id | TEXT | Foreign key to tickets |
| event | TEXT | STATE_CHANGE, BOOKING_STEP, AUTO_CLOSE, MESSAGE |
| from_state | TEXT | Previous state (nullable) |
| to_state | TEXT | New state (nullable) |
| metadata | TEXT | JSON blob for extra data |
| created_at | TEXT | ISO timestamp |

### State Transitions

```
OPENED → PAYMENT_RECEIVED → SESSION_SCHEDULED → SESSION_COMPLETE → CLOSED
OPENED → CLOSED (auto-close after 48h or manual close)
Any state → CLOSED (manual close by staff)
```

### stateService.js API

- `initDatabase()` — creates tables if not exist
- `createTicket({ threadId, userId, guildId, type, service, paymentMethod, goal })` — inserts ticket + logs OPENED event
- `updateState(threadId, newState, metadata?)` — updates state + logs STATE_CHANGE event
- `getTicket(threadId)` — returns ticket record
- `getOpenTicketsOlderThan(hours)` — returns tickets in OPENED state older than N hours
- `logEvent(threadId, event, metadata?)` — generic event logging
- `closeTicket(threadId, reason)` — sets state to CLOSED + logs event

### Extensibility

The `ticket_events` table supports future features:
- **Drop-off tracking:** Log `BOOKING_STEP` events as users progress through the flow
- **DM reminders:** Query tickets in specific states for follow-up
- **Conversion reports:** Count events per step to calculate conversion rates
- **Time analysis:** Measure duration between state changes

## Auto-Close System

### autoCloseService.js

- `start(client)` — starts a 15-minute interval + runs one immediate check on startup
- `stop()` — clears the interval
- `checkOverdueTickets(client)` — queries for OPENED tickets older than 48 hours

### Auto-close flow

For each overdue ticket:
1. Fetch the thread from Discord
2. Send message: "This ticket has been automatically closed due to inactivity. If you'd like to book a session, feel free to start again — we're here when you're ready."
3. Call `ticketService.closeTicket(thread, { closedBy: client.user.id, reason: 'AUTO_CLOSE_INACTIVITY' })`
4. Call `stateService.closeTicket(threadId, 'AUTO_CLOSE_INACTIVITY')`
5. Log to log channel

### Error handling

If a thread is already archived/deleted (manually closed while bot was offline):
- Catch the Discord API error
- Update SQLite state to CLOSED anyway
- Continue to next ticket

### Startup recovery

On bot startup, `checkOverdueTickets` runs immediately. This catches any tickets that went overdue while the bot was offline — no tickets slip through restarts.

## Service Channel Panel (Components V2)

### servicePanelService.js

Posts a Components V2 message to the service channel with:
- `ContainerBuilder` wrapping all components
- `MediaGalleryBuilder` with `optimization.png` banner
- `TextDisplayBuilder` with heading and short description
- `SeparatorBuilder`
- `ActionRowBuilder` with `StringSelectMenuBuilder` (3 services)
- `MessageFlags.IsComponentsV2` flag

Posted on bot startup via `ready.js`. Separate from the support panel.

## Updated Constants

### Services (replaces existing)

```javascript
services: [
  { label: 'Core Session — €90', value: 'core_session', price: 90, recurring: false },
  { label: 'Ranked Ready — €130', value: 'ranked_ready', price: 130, recurring: false },
  { label: 'Care Plan — €25/month', value: 'care_plan', price: 25, recurring: true },
]
```

### Service Details (new)

```javascript
serviceDetails: {
  core_session: {
    name: 'Core Session',
    description: 'Full Windows OS optimization + BIOS + Hidden BIOS configuration',
    includes: ['Windows OS optimization', 'BIOS configuration', 'Hidden BIOS tuning'],
    audience: 'If you experience stuttering, input lag, or FPS drops, this session is built for you.',
  },
  ranked_ready: {
    name: 'Ranked Ready',
    description: 'Everything in Core + RAM timing tuning + 7-day priority support',
    includes: ['Everything in Core Session', 'RAM timing tuning', '7-day priority support window'],
    audience: 'For competitive players who want every possible edge extracted from their hardware.',
  },
  care_plan: {
    name: 'Care Plan',
    description: 'Quarterly remote check-up with re-tuning and priority contact',
    includes: ['Quarterly remote check-up', 'Verification that optimizations are intact', 'Minor re-tuning if needed', 'Priority contact'],
    audience: 'For clients who want ongoing peace of mind after their session.',
  },
}
```

### Payment Methods (updated fee)

PaySafeCard fee changed from €10 to €15. All others unchanged.

### New Custom IDs

```javascript
selectService, confirmService, askQuestion, selectPayment, selectGoal, bookingModal
```

### Goals (updated labels)

```javascript
goals: [
  { label: 'Higher FPS', value: 'higher_fps' },
  { label: 'Less Input Lag', value: 'less_input_lag' },
  { label: 'Stability', value: 'stability' },
  { label: 'Streaming & Recording', value: 'streaming_recording' },
]
```

## Files

### New Files

| File | Purpose |
|------|---------|
| `src/components/buttons/confirmService.js` | "I'm Ready — Book Now" button handler |
| `src/components/buttons/askQuestion.js` | "I Have a Question" button → creates support ticket |
| `src/components/selects/selectService.js` | Service selection from panel |
| `src/components/selects/selectPayment.js` | Payment method selection |
| `src/components/selects/selectGoal.js` | Goal selection → opens modal |
| `src/components/modals/bookingModal.js` | Booking form modal → creates ticket |
| `src/services/stateService.js` | SQLite wrapper for ticket state |
| `src/services/autoCloseService.js` | 48-hour auto-close timer |
| `src/services/servicePanelService.js` | Components V2 panel for service channel |

### Modified Files

| File | Change |
|------|--------|
| `config/constants.js` | Replace services, add serviceDetails, update PaySafeCard fee, add customIds, update goals |
| `src/services/paymentService.js` | Update PaySafeCard fee to €15 |
| `src/events/ready.js` | Post service panel + start auto-close timer |
| `src/services/embedService.js` | Add service detail embed, service panel Components V2, updated booking summary |

### Untouched Files

All existing support flow, close flow, `ticketService.js`, `bookingService.js`, `panelService.js`, `interactionCreate.js`, `index.js`.

## Language

All bot messages in English, simple and non-technical. Target audience is gamers, not developers.
