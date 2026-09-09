# Booking Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing simultaneous-dropdown booking flow with a guided multi-step flow, add SQLite-backed ticket state tracking, and implement 48-hour auto-close for unpaid tickets.

**Architecture:** New booking flow handlers live alongside existing ones without modifying them. A new `stateService` wraps Bun's built-in SQLite for persistent ticket state. An `autoCloseService` runs a periodic check for overdue tickets. The service channel gets its own Components V2 panel separate from the support panel.

**Tech Stack:** Discord.js v14.26+, Bun runtime, `bun:sqlite` (built-in, zero dependencies)

---

### Task 1: Update constants and payment service

**Files:**
- Modify: `config/constants.js`
- Modify: `src/services/paymentService.js`

- [ ] **Step 1: Update services array in constants.js**

Replace the existing `services` array (lines 10-13) with:

```javascript
services: [
  { label: 'Core Session — €90', value: 'core_session', price: 90, recurring: false },
  { label: 'Ranked Ready — €130', value: 'ranked_ready', price: 130, recurring: false },
  { label: 'Care Plan — €25/month', value: 'care_plan', price: 25, recurring: true },
],
```

- [ ] **Step 2: Add serviceDetails object in constants.js**

Add after the `services` array:

```javascript
serviceDetails: {
  core_session: {
    name: 'Core Session',
    price: '€90',
    description: 'Full Windows OS optimization + BIOS + Hidden BIOS configuration.',
    includes: [
      'Windows OS optimization',
      'BIOS configuration',
      'Hidden BIOS tuning',
    ],
    audience: 'If you experience stuttering, input lag, or FPS drops, this session is built for you.',
  },
  ranked_ready: {
    name: 'Ranked Ready',
    price: '€130',
    description: 'Everything in Core Session + RAM timing tuning + 7-day priority support.',
    includes: [
      'Everything in Core Session',
      'RAM timing tuning',
      '7-day priority support window',
    ],
    audience: 'For competitive players who want every possible edge extracted from their hardware.',
  },
  care_plan: {
    name: 'Care Plan',
    price: '€25/month',
    description: 'Quarterly remote check-up with re-tuning and priority contact.',
    includes: [
      'Quarterly remote check-up',
      'Verification that optimizations are intact',
      'Minor re-tuning if needed',
      'Priority contact',
    ],
    audience: 'For clients who want ongoing peace of mind after their session.',
  },
},
```

- [ ] **Step 3: Update goals array in constants.js**

Replace the existing `goals` array (lines 23-28) with:

```javascript
goals: [
  { label: 'Higher FPS', value: 'higher_fps' },
  { label: 'Less Input Lag', value: 'less_input_lag' },
  { label: 'Stability', value: 'stability' },
  { label: 'Streaming & Recording', value: 'streaming_recording' },
],
```

- [ ] **Step 4: Update PaySafeCard fee label in constants.js**

Change line 19 from:
```javascript
{ label: 'PaySafeCard (+€10 fee)', value: 'paysafecard' },
```
to:
```javascript
{ label: 'PaySafeCard (+€15 fee)', value: 'paysafecard' },
```

- [ ] **Step 5: Add new customIds in constants.js**

Add these to the `customIds` object (after the existing entries, before the closing brace):

```javascript
// New booking flow
selectService: 'select_service',
confirmService: 'confirm_service',
askQuestion: 'ask_question',
selectPayment: 'select_payment',
selectGoal: 'select_goal',
bookingModal: 'booking_modal',
// New modal fields
bookingPcSpecsInput: 'booking_pc_specs_input',
bookingGamesInput: 'booking_games_input',
bookingAppsInput: 'booking_apps_input',
```

- [ ] **Step 6: Update PaySafeCard fee in paymentService.js**

In `src/services/paymentService.js`, change line 5 from:
```javascript
paysafecard: 10,
```
to:
```javascript
paysafecard: 15,
```

Also update the instructions string on line 13 from:
```javascript
paysafecard: '**PaySafeCard (+€10 fee):** Send your PaySafeCard code(s) in this channel.\nStaff will verify and confirm.',
```
to:
```javascript
paysafecard: '**PaySafeCard (+€15 fee):** Send your PaySafeCard code(s) in this channel.\nStaff will verify and confirm.',
```

- [ ] **Step 7: Commit**

```bash
git add config/constants.js src/services/paymentService.js
git commit -m "feat: update services, goals, fees, and add new booking flow customIds"
```

---

### Task 2: Create stateService (SQLite ticket state tracking)

**Files:**
- Create: `src/services/stateService.js`

- [ ] **Step 1: Create the data directory**

```bash
mkdir -p data
```

Add `data/tickets.db` to `.gitignore` (create `.gitignore` if it doesn't exist):

```
data/tickets.db
```

- [ ] **Step 2: Create stateService.js**

Create `src/services/stateService.js`:

```javascript
const { Database } = require('bun:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'tickets.db');

let db;

function initDatabase() {
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.run('PRAGMA journal_mode = WAL');

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      type TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'OPENED',
      service TEXT,
      payment_method TEXT,
      goal TEXT,
      close_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT NOT NULL,
      event TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tickets_thread_id ON tickets(thread_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_ticket_events_thread_id ON ticket_events(thread_id)');

  console.log('Database initialized');
}

function createTicketRecord({ threadId, userId, guildId, type, service, paymentMethod, goal }) {
  const stmt = db.prepare(`
    INSERT INTO tickets (thread_id, user_id, guild_id, type, state, service, payment_method, goal)
    VALUES (?, ?, ?, ?, 'OPENED', ?, ?, ?)
  `);
  stmt.run(threadId, userId, guildId, type, service || null, paymentMethod || null, goal || null);

  logEvent(threadId, 'STATE_CHANGE', { from_state: null, to_state: 'OPENED' });
}

function updateState(threadId, newState, metadata) {
  const ticket = getTicket(threadId);
  if (!ticket) return;

  const fromState = ticket.state;
  db.prepare(`UPDATE tickets SET state = ?, updated_at = datetime('now') WHERE thread_id = ?`)
    .run(newState, threadId);

  logEvent(threadId, 'STATE_CHANGE', { from_state: fromState, to_state: newState, ...metadata });
}

function getTicket(threadId) {
  return db.prepare('SELECT * FROM tickets WHERE thread_id = ?').get(threadId) || null;
}

function getOpenTicketsOlderThan(hours) {
  return db.prepare(`
    SELECT * FROM tickets
    WHERE state = 'OPENED'
    AND created_at <= datetime('now', ? || ' hours')
  `).all(`-${hours}`);
}

function logEvent(threadId, event, metadata) {
  const fromState = metadata?.from_state || null;
  const toState = metadata?.to_state || null;
  const meta = metadata ? JSON.stringify(metadata) : null;

  db.prepare(`
    INSERT INTO ticket_events (thread_id, event, from_state, to_state, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(threadId, event, fromState, toState, meta);
}

function closeTicketRecord(threadId, reason) {
  const ticket = getTicket(threadId);
  if (!ticket) return;

  const fromState = ticket.state;
  db.prepare(`
    UPDATE tickets SET state = 'CLOSED', close_reason = ?, updated_at = datetime('now')
    WHERE thread_id = ?
  `).run(reason || null, threadId);

  logEvent(threadId, 'STATE_CHANGE', { from_state: fromState, to_state: 'CLOSED', reason });
}

module.exports = {
  initDatabase,
  createTicketRecord,
  updateState,
  getTicket,
  getOpenTicketsOlderThan,
  logEvent,
  closeTicketRecord,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/stateService.js .gitignore
git commit -m "feat: add SQLite-backed stateService for ticket state tracking"
```

---

### Task 3: Create autoCloseService

**Files:**
- Create: `src/services/autoCloseService.js`

- [ ] **Step 1: Create autoCloseService.js**

Create `src/services/autoCloseService.js`:

```javascript
const { getOpenTicketsOlderThan, closeTicketRecord } = require('./stateService');
const { closeTicket } = require('./ticketService');
const { ticketLogEmbed } = require('./embedService');
const settings = require('../../config/settings');

const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes
const AUTO_CLOSE_HOURS = 48;

let intervalId = null;

async function checkOverdueTickets(client) {
  const overdueTickets = getOpenTicketsOlderThan(AUTO_CLOSE_HOURS);

  for (const ticket of overdueTickets) {
    try {
      const guild = client.guilds.cache.get(ticket.guild_id);
      if (!guild) continue;

      let thread;
      try {
        thread = await guild.channels.fetch(ticket.thread_id);
      } catch {
        // Thread already deleted or inaccessible — just update DB
        closeTicketRecord(ticket.thread_id, 'AUTO_CLOSE_INACTIVITY');
        continue;
      }

      if (!thread || thread.archived) {
        closeTicketRecord(ticket.thread_id, 'AUTO_CLOSE_INACTIVITY');
        continue;
      }

      // Send inactivity message
      await thread.send(
        'This ticket has been automatically closed due to inactivity. If you\'d like to book a session, feel free to start again — we\'re here when you\'re ready.'
      );

      // Close using existing ticket logic
      const logData = await closeTicket(thread, {
        closedBy: client.user,
        reason: 'AUTO_CLOSE_INACTIVITY',
      });

      // Update SQLite
      closeTicketRecord(ticket.thread_id, 'AUTO_CLOSE_INACTIVITY');

      // Log to log channel
      if (settings.logChannelId) {
        const logChannel = guild.channels.cache.get(settings.logChannelId);
        if (logChannel) {
          await logChannel.send({ embeds: [ticketLogEmbed(logData)] });
        }
      }

      console.log(`Auto-closed ticket: ${ticket.thread_id}`);
    } catch (error) {
      console.error(`Failed to auto-close ticket ${ticket.thread_id}:`, error.message);
      // If anything fails, still mark as closed in DB so we don't retry forever
      closeTicketRecord(ticket.thread_id, 'AUTO_CLOSE_INACTIVITY');
    }
  }
}

function start(client) {
  // Run immediately on startup to catch tickets that went overdue while offline
  checkOverdueTickets(client).catch(err =>
    console.error('Initial auto-close check failed:', err.message)
  );

  // Then check every 15 minutes
  intervalId = setInterval(() => {
    checkOverdueTickets(client).catch(err =>
      console.error('Auto-close check failed:', err.message)
    );
  }, CHECK_INTERVAL);

  console.log('Auto-close service started (checking every 15 minutes)');
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { start, stop, checkOverdueTickets };
```

- [ ] **Step 2: Commit**

```bash
git add src/services/autoCloseService.js
git commit -m "feat: add autoCloseService for 48-hour ticket auto-close"
```

---

### Task 4: Add new embeds to embedService

**Files:**
- Modify: `src/services/embedService.js`

- [ ] **Step 1: Add service detail embed builder**

Add this function to `src/services/embedService.js` (before the `module.exports`):

```javascript
function serviceDetailEmbed(serviceKey) {
  const { serviceDetails } = require('../../config/constants');
  const detail = serviceDetails[serviceKey];
  if (!detail) return null;

  const includesList = detail.includes.map(item => `- ${item}`).join('\n');

  return new EmbedBuilder()
    .setTitle(`${detail.name} — ${detail.price}`)
    .setDescription(detail.description)
    .setColor(colors.primary)
    .addFields(
      { name: 'What\'s Included', value: includesList },
      { name: 'Is This For You?', value: detail.audience },
    );
}
```

- [ ] **Step 2: Add service detail action row builder**

Add this function to `src/services/embedService.js` (before the `module.exports`):

```javascript
function serviceDetailButtons(serviceKey) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${customIds.confirmService}_${serviceKey}`)
      .setLabel('I\'m Ready — Book Now')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(customIds.askQuestion)
      .setLabel('I Have a Question')
      .setStyle(ButtonStyle.Secondary),
  );
}
```

- [ ] **Step 3: Add payment select row builder**

Add this function to `src/services/embedService.js` (before the `module.exports`):

```javascript
function paymentSelectRow() {
  const { paymentMethods } = require('../../config/constants');
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.selectPayment)
      .setPlaceholder('Select a payment method')
      .addOptions(
        paymentMethods.map(p =>
          new StringSelectMenuOptionBuilder().setLabel(p.label).setValue(p.value)
        )
      )
  );
}
```

- [ ] **Step 4: Add goal select row builder**

Add this function to `src/services/embedService.js` (before the `module.exports`):

```javascript
function goalSelectRow() {
  const { goals } = require('../../config/constants');
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.selectGoal)
      .setPlaceholder('What\'s your main goal?')
      .addOptions(
        goals.map(g =>
          new StringSelectMenuOptionBuilder().setLabel(g.label).setValue(g.value)
        )
      )
  );
}
```

- [ ] **Step 5: Add new booking summary embed (for new flow)**

Add this function to `src/services/embedService.js` (before the `module.exports`):

```javascript
function newBookingSummaryEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle('Booking Request')
    .setDescription('A staff member will review your booking shortly.')
    .setColor(colors.embed)
    .addFields(
      { name: 'Service', value: data.service, inline: true },
      { name: 'Payment Method', value: data.payment, inline: true },
      { name: 'Goal', value: data.goal, inline: true },
      { name: 'PC Specs', value: data.pcSpecs || 'Not provided' },
      { name: 'Games', value: data.games || 'Not provided' },
      { name: 'Apps / Software', value: data.apps || 'Not provided' },
    );

  if (data.fee > 0) {
    embed.addFields({ name: 'Processing Fee', value: `+€${data.fee}` });
  }

  return embed;
}
```

- [ ] **Step 6: Add payment instructions embed builder**

Add this function to `src/services/embedService.js` (before the `module.exports`):

```javascript
function paymentInstructionsEmbed(paymentKey) {
  const { getPaymentInfo } = require('./paymentService');
  const { instructions, fee } = getPaymentInfo(paymentKey);

  let description = instructions;
  if (fee > 0) {
    description += `\n\n> A **€${fee} processing fee** applies to this payment method.`;
  }
  description += '\n\nPlease send proof of payment in this thread to proceed.';

  return new EmbedBuilder()
    .setTitle('Payment Instructions')
    .setDescription(description)
    .setColor(colors.warning);
}
```

- [ ] **Step 7: Export new functions**

Update the `module.exports` at the bottom of `src/services/embedService.js` to include the new functions:

```javascript
module.exports = {
  ticketPanelComponents,
  ticketPanelAttachment,
  bookingSummaryEmbed,
  ticketActionRow,
  approvedEmbed,
  closeConfirmEmbed,
  closeConfirmButtons,
  ticketLogEmbed,
  supportCloseRow,
  serviceDetailEmbed,
  serviceDetailButtons,
  paymentSelectRow,
  goalSelectRow,
  newBookingSummaryEmbed,
  paymentInstructionsEmbed,
};
```

- [ ] **Step 8: Commit**

```bash
git add src/services/embedService.js
git commit -m "feat: add embed builders for new booking flow"
```

---

### Task 5: Create servicePanelService (Components V2 panel for service channel)

**Files:**
- Create: `src/services/servicePanelService.js`

- [ ] **Step 1: Create servicePanelService.js**

Create `src/services/servicePanelService.js`:

```javascript
const {
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
} = require('discord.js');
const { services, customIds } = require('../../config/constants');
const path = require('path');

const BANNER_PATH = path.join(__dirname, '..', '..', 'assets', 'images', 'optimization.png');

function servicePanelComponents() {
  const banner = new MediaGalleryBuilder().addItems({
    media: { url: 'attachment://optimization.png' },
  });

  const titleBlock = new TextDisplayBuilder().setContent(
    '# FadeSolutions Optimization\nGet your PC performing at its best. Pick a service below to get started.'
  );

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.selectService)
      .setPlaceholder('Select a service...')
      .addOptions(
        services.map(s =>
          new StringSelectMenuOptionBuilder().setLabel(s.label).setValue(s.value)
        )
      )
  );

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(banner)
    .addTextDisplayComponents(titleBlock)
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(selectRow);

  return [container];
}

function servicePanelAttachment() {
  return new AttachmentBuilder(BANNER_PATH, { name: 'optimization.png' });
}

async function postServicePanel(channel) {
  await channel.send({
    components: servicePanelComponents(),
    files: [servicePanelAttachment()],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`Service panel sent to #${channel.name}`);
}

module.exports = { postServicePanel };
```

- [ ] **Step 2: Commit**

```bash
git add src/services/servicePanelService.js
git commit -m "feat: add Components V2 service panel for optimization channel"
```

---

### Task 6: Create new booking flow handlers — selectService

**Files:**
- Create: `src/components/selects/selectService.js`

- [ ] **Step 1: Create selectService.js**

Create `src/components/selects/selectService.js`:

```javascript
const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const { createSession, updateSession } = require('../../services/bookingService');
const { serviceDetailEmbed, serviceDetailButtons } = require('../../services/embedService');

module.exports = {
  customId: customIds.selectService,

  async execute(interaction) {
    const serviceKey = interaction.values[0];

    // Create a fresh session and store the service choice
    createSession(interaction.user.id);
    updateSession(interaction.user.id, 'service', serviceKey);

    const embed = serviceDetailEmbed(serviceKey);
    if (!embed) {
      await interaction.reply({
        content: 'Something went wrong. Please try again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [embed],
      components: [serviceDetailButtons(serviceKey)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/selects/selectService.js
git commit -m "feat: add selectService handler for new booking flow"
```

---

### Task 7: Create new booking flow handlers — confirmService and askQuestion buttons

**Files:**
- Create: `src/components/buttons/confirmService.js`
- Create: `src/components/buttons/askQuestion.js`

- [ ] **Step 1: Create confirmService.js**

Create `src/components/buttons/confirmService.js`:

```javascript
const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const { getSession } = require('../../services/bookingService');
const { paymentSelectRow } = require('../../services/embedService');

module.exports = {
  customId: customIds.confirmService,

  async execute(interaction) {
    // customId format: confirm_service_core_session — extract service key
    const session = getSession(interaction.user.id);
    if (!session || !session.service) {
      await interaction.reply({
        content: 'Your session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.update({
      content: 'Select your payment method below.',
      embeds: [],
      components: [paymentSelectRow()],
    });
  },
};
```

- [ ] **Step 2: Create askQuestion.js**

Create `src/components/buttons/askQuestion.js`:

```javascript
const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const { createTicket } = require('../../services/ticketService');
const { supportCloseRow } = require('../../services/embedService');
const { deleteSession } = require('../../services/bookingService');
const settings = require('../../../config/settings');

module.exports = {
  customId: customIds.askQuestion,

  async execute(interaction) {
    await interaction.deferUpdate();

    const guild = interaction.guild;
    const supportChannel = guild.channels.cache.get(settings.supportChannelId);

    if (!supportChannel) {
      await interaction.followUp({
        content: 'Support channel not found. Please contact staff directly.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const thread = await createTicket(supportChannel, interaction.user, {
      type: 'support',
      name: interaction.user.username,
    });

    await thread.send({
      content: `Welcome ${interaction.user}! You had a question about our services. Let us know how we can help!`,
      components: [supportCloseRow()],
    });

    // Clean up booking session
    deleteSession(interaction.user.id);

    await interaction.editReply({
      content: `A support ticket has been created for you in <#${settings.supportChannelId}>: ${thread}`,
      embeds: [],
      components: [],
    });
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/buttons/confirmService.js src/components/buttons/askQuestion.js
git commit -m "feat: add confirmService and askQuestion button handlers"
```

---

### Task 8: Create new booking flow handlers — selectPayment and selectGoal

**Files:**
- Create: `src/components/selects/selectPayment.js`
- Create: `src/components/selects/selectGoal.js`

- [ ] **Step 1: Create selectPayment.js**

Create `src/components/selects/selectPayment.js`:

```javascript
const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const { updateSession, getSession } = require('../../services/bookingService');
const { goalSelectRow } = require('../../services/embedService');

module.exports = {
  customId: customIds.selectPayment,

  async execute(interaction) {
    const paymentKey = interaction.values[0];

    const session = getSession(interaction.user.id);
    if (!session) {
      await interaction.reply({
        content: 'Your session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    updateSession(interaction.user.id, 'payment', paymentKey);

    // Acknowledge fee for PaySafeCard or Gift Card
    let feeNotice = '';
    if (paymentKey === 'paysafecard' || paymentKey === 'giftcard') {
      feeNotice = '\n> Note: A **€15 processing fee** applies to this payment method.\n';
    }

    await interaction.update({
      content: `${feeNotice}Almost there! Select your main goal below.`,
      components: [goalSelectRow()],
    });
  },
};
```

- [ ] **Step 2: Create selectGoal.js**

Create `src/components/selects/selectGoal.js`:

```javascript
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { customIds } = require('../../../config/constants');
const { updateSession, getSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.selectGoal,

  async execute(interaction) {
    const goalKey = interaction.values[0];

    const session = getSession(interaction.user.id);
    if (!session) {
      const { MessageFlags } = require('discord.js');
      await interaction.reply({
        content: 'Your session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    updateSession(interaction.user.id, 'goal', goalKey);

    // Open the booking modal
    const modal = new ModalBuilder()
      .setCustomId(customIds.bookingModal)
      .setTitle('Booking Details');

    const pcSpecs = new TextInputBuilder()
      .setCustomId(customIds.bookingPcSpecsInput)
      .setLabel('PC Specs')
      .setPlaceholder('Not sure? Press Ctrl + Shift + Esc, click Performance, and tell us what you see. CPU, GPU, and RAM is enough.')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const games = new TextInputBuilder()
      .setCustomId(customIds.bookingGamesInput)
      .setLabel('Games you play')
      .setPlaceholder('e.g. Fortnite, Valorant, CS2, FiveM')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const apps = new TextInputBuilder()
      .setCustomId(customIds.bookingAppsInput)
      .setLabel('Apps / Software running in background')
      .setPlaceholder('e.g. Discord, Spotify, OBS, Steam overlay')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(pcSpecs),
      new ActionRowBuilder().addComponents(games),
      new ActionRowBuilder().addComponents(apps),
    );

    await interaction.showModal(modal);
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/selects/selectPayment.js src/components/selects/selectGoal.js
git commit -m "feat: add selectPayment and selectGoal handlers"
```

---

### Task 9: Create new booking flow handler — bookingModal

**Files:**
- Create: `src/components/modals/bookingModal.js`

- [ ] **Step 1: Create bookingModal.js**

Create `src/components/modals/bookingModal.js`:

```javascript
const { MessageFlags } = require('discord.js');
const { customIds, services, paymentMethods, goals } = require('../../../config/constants');
const { getSession, deleteSession } = require('../../services/bookingService');
const { createTicket } = require('../../services/ticketService');
const { newBookingSummaryEmbed, ticketActionRow, paymentInstructionsEmbed } = require('../../services/embedService');
const { createTicketRecord } = require('../../services/stateService');
const { getPaymentInfo } = require('../../services/paymentService');

function findLabel(list, value) {
  const item = list.find(i => i.value === value);
  return item ? item.label : value;
}

module.exports = {
  customId: customIds.bookingModal,

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const session = getSession(interaction.user.id);
    if (!session || !session.service || !session.payment || !session.goal) {
      await interaction.editReply({ content: 'Your booking session expired. Please start again from the service menu.' });
      return;
    }

    const pcSpecs = interaction.fields.getTextInputValue(customIds.bookingPcSpecsInput);
    const gamesValue = interaction.fields.getTextInputValue(customIds.bookingGamesInput);
    const apps = interaction.fields.getTextInputValue(customIds.bookingAppsInput);

    const { fee } = getPaymentInfo(session.payment);

    const bookingData = {
      service: findLabel(services, session.service),
      payment: findLabel(paymentMethods, session.payment),
      goal: findLabel(goals, session.goal),
      pcSpecs,
      games: gamesValue,
      apps,
      fee,
    };

    // Create private thread using existing ticket logic
    const thread = await createTicket(interaction.channel, interaction.user, {
      type: 'booking',
      name: interaction.user.username,
    });

    // Post booking summary with action buttons
    await thread.send({
      embeds: [newBookingSummaryEmbed(bookingData)],
      components: [ticketActionRow()],
    });

    // Post payment instructions
    await thread.send({
      embeds: [paymentInstructionsEmbed(session.payment)],
    });

    // Record ticket in SQLite
    createTicketRecord({
      threadId: thread.id,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      type: 'booking',
      service: session.service,
      paymentMethod: session.payment,
      goal: session.goal,
    });

    deleteSession(interaction.user.id);

    await interaction.editReply({ content: `Your booking ticket has been created: ${thread}` });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/bookingModal.js
git commit -m "feat: add bookingModal handler with state tracking"
```

---

### Task 10: Handle confirmService button with dynamic customId

The `confirmService` button uses a dynamic customId format: `confirm_service_core_session`. The interaction router matches by exact customId, so we need to update it to support prefix matching for this button.

**Files:**
- Modify: `src/events/interactionCreate.js`

- [ ] **Step 1: Update interaction router for prefix-matched buttons**

In `src/events/interactionCreate.js`, change the button handling block (line 32-33) from:

```javascript
} else if (interaction.isButton()) {
  const handler = buttons.get(interaction.customId);
  if (handler) await handler.execute(interaction);
```

to:

```javascript
} else if (interaction.isButton()) {
  let handler = buttons.get(interaction.customId);
  // Support prefix-matched buttons (e.g. confirm_service_core_session matches confirm_service)
  if (!handler) {
    for (const [key, h] of buttons) {
      if (interaction.customId.startsWith(key)) {
        handler = h;
        break;
      }
    }
  }
  if (handler) await handler.execute(interaction);
```

- [ ] **Step 2: Commit**

```bash
git add src/events/interactionCreate.js
git commit -m "feat: support prefix-matched button customIds in interaction router"
```

---

### Task 11: Update ready.js to wire everything together

**Files:**
- Modify: `src/events/ready.js`

- [ ] **Step 1: Update ready.js**

Replace the entire contents of `src/events/ready.js` with:

```javascript
const { Events } = require('discord.js');
const settings = require('../../config/settings');
const { postPanel } = require('../services/panelService');
const { postServicePanel } = require('../services/servicePanelService');
const { initDatabase } = require('../services/stateService');
const { start: startAutoClose } = require('../services/autoCloseService');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Bot online as ${client.user.tag}`);

    // Initialize SQLite database
    initDatabase();

    const guild = client.guilds.cache.get(settings.guildId);
    if (!guild) {
      console.error('Guild not found. Check GUILD_ID in .env');
      return;
    }

    // Post support panel (existing)
    if (settings.supportChannelId) {
      const supportChannel = guild.channels.cache.get(settings.supportChannelId);
      if (supportChannel) {
        await postPanel(supportChannel).catch(err =>
          console.error(`Failed to post support panel in #${supportChannel.name}:`, err.message)
        );
      }
    }

    // Post service panel (new)
    if (settings.optimizationChannelId) {
      const serviceChannel = guild.channels.cache.get(settings.optimizationChannelId);
      if (serviceChannel) {
        await postServicePanel(serviceChannel).catch(err =>
          console.error(`Failed to post service panel in #${serviceChannel.name}:`, err.message)
        );
      }
    }

    // Start auto-close timer
    startAutoClose(client);
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/events/ready.js
git commit -m "feat: wire up service panel, stateService init, and auto-close in ready.js"
```

---

### Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md architecture docs**

Update the following sections in `CLAUDE.md` to reflect the new architecture:

1. Under **Two-Step Booking Flow**, add a new section **New Multi-Step Booking Flow** explaining:
   - The 5-step guided flow (service panel select → detail + buttons → payment select → goal select → modal → ticket)
   - The separation between service channel (new flow) and support channel (unchanged)
   - Session data in `bookingService` during flow, persisted to SQLite on ticket creation

2. Under **Services**, add:
   - **stateService** — SQLite-backed ticket state tracking (`data/tickets.db`), stores ticket records and events
   - **autoCloseService** — 48-hour auto-close timer for tickets in OPENED state, runs every 15 minutes
   - **servicePanelService** — Components V2 panel for the service/optimization channel

3. Under **Config**, add:
   - New customIds: `selectService`, `confirmService`, `askQuestion`, `selectPayment`, `selectGoal`, `bookingModal`
   - New constants: `serviceDetails` object with per-service metadata

4. Note that the old booking flow handlers still exist but are not reachable from the new service panel.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new booking flow architecture"
```

---

### Task 13: Manual smoke test

This task is for the human developer — not automated.

- [ ] **Step 1: Start the bot**

```bash
bun start
```

Verify in console:
- "Bot online as ..." is logged
- "Database initialized" is logged
- "Service panel sent to #..." is logged for the optimization channel
- "Panel sent to #..." is logged for the support channel
- "Auto-close service started (checking every 15 minutes)" is logged

- [ ] **Step 2: Test service panel in Discord**

Go to the optimization channel. Verify:
- Components V2 panel is visible with banner image, title, description, and service select menu
- Selecting "Core Session — €90" shows ephemeral service detail embed with includes + audience
- "I'm Ready — Book Now" button shows payment select menu
- "I Have a Question" button creates a support ticket in the support channel

- [ ] **Step 3: Test full booking flow**

1. Select a service → confirm → select payment → select goal → modal opens
2. Fill in PC specs, games, apps → submit
3. Verify private thread is created with booking summary embed + payment instructions embed
4. Verify "Reviewing" and "Close Ticket" buttons are present
5. Verify the ticket appears in SQLite (`data/tickets.db`) with state `OPENED`

- [ ] **Step 4: Test PaySafeCard / Gift Card fee notice**

Select PaySafeCard or Gift Card as payment method. Verify the fee notice appears before the goal select.

- [ ] **Step 5: Test support channel is untouched**

Go to the support channel. Verify:
- The existing support panel is still present and functional
- Selecting "Support" still creates a support thread as before
- The existing "Purchase" path in the support panel still works (old flow)

- [ ] **Step 6: Test close flow**

In a booking thread, click "Close Ticket" → enter reason → confirm. Verify:
- Thread is locked and archived
- Log is posted to log channel
- SQLite ticket state is updated to `CLOSED`

- [ ] **Step 7: Push to remote**

```bash
git push
```
