# Discord Booking Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular Discord.js v14 bot with a support ticket system and an optimization booking funnel that uses select menus + modal for data collection, then creates private ticket channels.

**Architecture:** Event-driven bot with handler auto-loading. Interactions flow through a central dispatcher that routes to modular button/select/modal handlers. Three services (ticket, payment, booking) encapsulate business logic separate from UI. The booking flow uses a two-step interaction: select menus for choices, then a modal for text inputs (Discord modals only support TextInput components).

**Tech Stack:** Node.js, discord.js v14, dotenv for config

---

## File Structure

```
/
├── package.json
├── .env                          # Token, guild ID, channel IDs, role IDs
├── .gitignore
├── config/
│   ├── settings.js               # Loads .env, exports typed config object
│   └── constants.js              # Embed colors, service options, payment options, goal options
├── src/
│   ├── index.js                  # Bot entry point: client init, handler loading
│   ├── deploy-commands.js        # Slash command registration script
│   ├── events/
│   │   ├── ready.js              # Bot ready log
│   │   └── interactionCreate.js  # Central interaction router
│   ├── commands/
│   │   └── setup.js              # /setup command to send panels to channels
│   ├── components/
│   │   ├── buttons/
│   │   │   ├── openSupportTicket.js   # Opens support ticket
│   │   │   ├── bookOptimization.js    # Shows select menus (step 1)
│   │   │   └── continueBooking.js     # Opens modal (step 2)
│   │   ├── selects/
│   │   │   ├── serviceSelect.js       # Stores service choice in memory
│   │   │   ├── paymentSelect.js       # Stores payment choice in memory
│   │   │   └── goalSelect.js          # Stores goal choice in memory
│   │   └── modals/
│   │       └── bookingForm.js         # Handles modal submit → creates ticket
│   ├── services/
│   │   ├── ticketService.js           # Create ticket channels (support + booking)
│   │   ├── paymentService.js          # Payment instructions + fee logic
│   │   └── bookingService.js          # Booking session state + orchestration
│   └── utils/
│       └── embedBuilder.js            # Reusable embed helpers
```

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `config/settings.js`
- Create: `config/constants.js`

- [ ] **Step 1: Initialize package.json**

```bash
cd "/c/Users/doner/OneDrive/Desktop/eros/clients/Fade Solutions/Discord/Discord bot"
npm init -y
npm install discord.js dotenv
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.env
```

- [ ] **Step 3: Create .env.example**

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
STAFF_ROLE_ID=your_staff_role_id_here
SUPPORT_CHANNEL_ID=your_support_channel_id_here
OPTIMIZATION_CHANNEL_ID=your_optimization_channel_id_here
TICKET_CATEGORY_ID=your_ticket_category_id_here
```

- [ ] **Step 4: Create config/settings.js**

```js
require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  staffRoleId: process.env.STAFF_ROLE_ID,
  supportChannelId: process.env.SUPPORT_CHANNEL_ID,
  optimizationChannelId: process.env.OPTIMIZATION_CHANNEL_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
};
```

- [ ] **Step 5: Create config/constants.js**

```js
const { ButtonStyle } = require('discord.js');

module.exports = {
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    danger: 0xED4245,
  },

  services: [
    { label: 'Full Optimization (Windows + BIOS + Hidden BIOS)', value: 'full_optimization' },
    { label: 'Advanced Optimization (Includes RAM tuning)', value: 'advanced_optimization' },
  ],

  paymentMethods: [
    { label: 'PayPal', value: 'paypal' },
    { label: 'Crypto', value: 'crypto' },
    { label: 'Card', value: 'card' },
    { label: 'PaySafeCard (+€10 fee)', value: 'paysafecard' },
    { label: 'Gift Card (+€15 fee)', value: 'giftcard' },
  ],

  goals: [
    { label: 'FPS', value: 'fps' },
    { label: 'Input Delay', value: 'input_delay' },
    { label: 'Stability', value: 'stability' },
    { label: 'Streaming / Recording', value: 'streaming_recording' },
  ],

  customIds: {
    // Buttons
    openSupportTicket: 'open_support_ticket',
    bookOptimization: 'book_optimization',
    continueBooking: 'continue_booking',
    // Selects
    serviceSelect: 'service_select',
    paymentSelect: 'payment_select',
    goalSelect: 'goal_select',
    // Modal
    bookingForm: 'booking_form',
    // Modal fields
    pcSpecsInput: 'pc_specs_input',
    gamesInput: 'games_input',
    appsInput: 'apps_input',
  },
};
```

- [ ] **Step 6: Commit**

```bash
git init
git add package.json package-lock.json .gitignore .env.example config/
git commit -m "chore: project setup with discord.js v14, config, and constants"
```

---

### Task 2: Bot Entry Point and Event System

**Files:**
- Create: `src/index.js`
- Create: `src/events/ready.js`
- Create: `src/events/interactionCreate.js`

- [ ] **Step 1: Create src/index.js**

```js
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const settings = require('../config/settings');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(settings.token);
```

- [ ] **Step 2: Create src/events/ready.js**

```js
const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Bot online as ${client.user.tag}`);
  },
};
```

- [ ] **Step 3: Create src/events/interactionCreate.js**

This is the central router. It dispatches to the correct handler based on interaction type and customId.

```js
const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load component handlers into maps
const buttons = new Map();
const selects = new Map();
const modals = new Map();

function loadHandlers(dir, map) {
  const dirPath = path.join(__dirname, '..', 'components', dir);
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const handler = require(path.join(dirPath, file));
    map.set(handler.customId, handler);
  }
}

loadHandlers('buttons', buttons);
loadHandlers('selects', selects);
loadHandlers('modals', modals);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
      } else if (interaction.isButton()) {
        const handler = buttons.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      } else if (interaction.isStringSelectMenu()) {
        const handler = selects.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      } else if (interaction.isModalSubmit()) {
        const handler = modals.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      }
    } catch (error) {
      console.error('Interaction error:', error);
      const reply = { content: 'Something went wrong. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add src/index.js src/events/
git commit -m "feat: bot entry point with event-driven interaction router"
```

---

### Task 3: Services (ticketService, paymentService, bookingService)

**Files:**
- Create: `src/services/ticketService.js`
- Create: `src/services/paymentService.js`
- Create: `src/services/bookingService.js`

- [ ] **Step 1: Create src/services/ticketService.js**

```js
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const settings = require('../../config/settings');

async function createTicket(guild, user, { type, name }) {
  const channelName = `${type}-${name}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId || null,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: settings.staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  return channel;
}

module.exports = { createTicket };
```

- [ ] **Step 2: Create src/services/paymentService.js**

```js
const fees = {
  paypal: 0,
  crypto: 0,
  card: 0,
  paysafecard: 10,
  giftcard: 15,
};

const instructions = {
  paypal: '**PayPal:** Send payment to `payments@fadesolutions.com`\nUse "Friends & Family" to avoid fees.',
  crypto: '**Crypto:** Send payment to the wallet address provided by staff.\nSupported: BTC, ETH, LTC.',
  card: '**Card:** A payment link will be sent to you by staff shortly.',
  paysafecard: '**PaySafeCard (+€10 fee):** Send your PaySafeCard code(s) in this channel.\nStaff will verify and confirm.',
  giftcard: '**Gift Card (+€15 fee):** Send your gift card details in this channel.\nStaff will verify and confirm.',
};

function getPaymentInfo(method) {
  return {
    instructions: instructions[method] || 'Staff will provide payment details shortly.',
    fee: fees[method] || 0,
  };
}

module.exports = { getPaymentInfo };
```

- [ ] **Step 3: Create src/services/bookingService.js**

This service manages in-progress booking sessions (select menu choices before modal submission). Uses a Map keyed by `userId`. Sessions expire after 15 minutes.

```js
const sessions = new Map();
const SESSION_TTL = 15 * 60 * 1000;

function getSession(userId) {
  const session = sessions.get(userId);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(userId);
    return null;
  }
  return session;
}

function createSession(userId) {
  const session = {
    service: null,
    payment: null,
    goal: null,
    createdAt: Date.now(),
  };
  sessions.set(userId, session);
  return session;
}

function updateSession(userId, field, value) {
  let session = getSession(userId);
  if (!session) {
    session = createSession(userId);
  }
  session[field] = value;
  return session;
}

function deleteSession(userId) {
  sessions.delete(userId);
}

function isSessionComplete(userId) {
  const session = getSession(userId);
  if (!session) return false;
  return session.service && session.payment && session.goal;
}

module.exports = { getSession, createSession, updateSession, deleteSession, isSessionComplete };
```

- [ ] **Step 4: Commit**

```bash
git add src/services/
git commit -m "feat: ticket, payment, and booking services"
```

---

### Task 4: Utility - Embed Helpers

**Files:**
- Create: `src/utils/embedBuilder.js`

- [ ] **Step 1: Create src/utils/embedBuilder.js**

```js
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config/constants');

function supportPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('Support')
    .setDescription(
      'Need help? Have a question?\n\n' +
      'Click the button below to open a support ticket.\n' +
      'Our team will assist you as soon as possible.'
    )
    .setColor(colors.primary);
}

function optimizationPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('PC Optimization')
    .setDescription(
      '**Services**\n' +
      '> **Full Optimization** — Windows + BIOS + Hidden BIOS\n' +
      '> **Advanced Optimization** — Includes RAM tuning\n\n' +
      '**Pricing**\n' +
      '> Full Optimization: **€30**\n' +
      '> Advanced Optimization: **€50**\n\n' +
      '**Payment Methods**\n' +
      '> PayPal, Crypto, Card, PaySafeCard (+€10), Gift Card (+€15)\n\n' +
      '[View full details on our website](https://fadesolutions.com)\n\n' +
      'Ready to book? Click below.'
    )
    .setColor(colors.success);
}

function bookingSummaryEmbed(data) {
  return new EmbedBuilder()
    .setTitle('Booking Request')
    .setColor(colors.primary)
    .addFields(
      { name: 'Service', value: data.service, inline: true },
      { name: 'Payment Method', value: data.payment, inline: true },
      { name: 'Goal', value: data.goal, inline: true },
      { name: 'PC Specs', value: data.pcSpecs || 'Not provided' },
      { name: 'Games', value: data.games || 'Not provided' },
      { name: 'Apps / Software', value: data.apps || 'Not provided' },
    );
}

module.exports = { supportPanelEmbed, optimizationPanelEmbed, bookingSummaryEmbed };
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/
git commit -m "feat: embed builder helpers for panels and booking summary"
```

---

### Task 5: /setup Command

**Files:**
- Create: `src/commands/setup.js`
- Create: `src/deploy-commands.js`

- [ ] **Step 1: Create src/commands/setup.js**

```js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const settings = require('../../config/settings');
const { customIds } = require('../../config/constants');
const { supportPanelEmbed, optimizationPanelEmbed } = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Send panels to support and optimization channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    // Support panel
    const supportChannel = guild.channels.cache.get(settings.supportChannelId);
    if (supportChannel) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(customIds.openSupportTicket)
          .setLabel('Open Support Ticket')
          .setStyle(ButtonStyle.Primary)
      );
      await supportChannel.send({ embeds: [supportPanelEmbed()], components: [row] });
    }

    // Optimization panel
    const optChannel = guild.channels.cache.get(settings.optimizationChannelId);
    if (optChannel) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(customIds.bookOptimization)
          .setLabel('Book Optimization')
          .setStyle(ButtonStyle.Success)
      );
      await optChannel.send({ embeds: [optimizationPanelEmbed()], components: [row] });
    }

    await interaction.editReply({ content: 'Panels sent successfully.' });
  },
};
```

- [ ] **Step 2: Create src/deploy-commands.js**

```js
const { REST, Routes } = require('discord.js');
const settings = require('../config/settings');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(settings.token);

(async () => {
  try {
    console.log(`Registering ${commands.length} command(s)...`);
    await rest.put(
      Routes.applicationGuildCommands(settings.clientId, settings.guildId),
      { body: commands },
    );
    console.log('Commands registered.');
  } catch (error) {
    console.error(error);
  }
})();
```

- [ ] **Step 3: Add scripts to package.json**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "deploy": "node src/deploy-commands.js"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/commands/ src/deploy-commands.js package.json
git commit -m "feat: /setup command and deploy-commands script"
```

---

### Task 6: Button Handlers

**Files:**
- Create: `src/components/buttons/openSupportTicket.js`
- Create: `src/components/buttons/bookOptimization.js`
- Create: `src/components/buttons/continueBooking.js`

- [ ] **Step 1: Create src/components/buttons/openSupportTicket.js**

```js
const { customIds } = require('../../../config/constants');
const { createTicket } = require('../../services/ticketService');

module.exports = {
  customId: customIds.openSupportTicket,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = await createTicket(interaction.guild, interaction.user, {
      type: 'support',
      name: interaction.user.username,
    });

    await channel.send(`Welcome ${interaction.user}! Describe your issue and our team will help you shortly.`);
    await interaction.editReply({ content: `Your support ticket has been created: ${channel}` });
  },
};
```

- [ ] **Step 2: Create src/components/buttons/bookOptimization.js**

This sends an ephemeral message with 3 select menus + Continue button (step 1 of booking).

```js
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { customIds, services, paymentMethods, goals } = require('../../../config/constants');
const { createSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.bookOptimization,

  async execute(interaction) {
    createSession(interaction.user.id);

    const serviceRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customIds.serviceSelect)
        .setPlaceholder('Select a service')
        .addOptions(
          services.map(s =>
            new StringSelectMenuOptionBuilder().setLabel(s.label).setValue(s.value)
          )
        )
    );

    const paymentRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customIds.paymentSelect)
        .setPlaceholder('Select payment method')
        .addOptions(
          paymentMethods.map(p =>
            new StringSelectMenuOptionBuilder().setLabel(p.label).setValue(p.value)
          )
        )
    );

    const goalRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customIds.goalSelect)
        .setPlaceholder('Select your goal')
        .addOptions(
          goals.map(g =>
            new StringSelectMenuOptionBuilder().setLabel(g.label).setValue(g.value)
          )
        )
    );

    const continueRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customIds.continueBooking)
        .setLabel('Continue')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: '**Step 1/2** — Select your options below, then click **Continue**.',
      components: [serviceRow, paymentRow, goalRow, continueRow],
      ephemeral: true,
    });
  },
};
```

- [ ] **Step 3: Create src/components/buttons/continueBooking.js**

Opens the modal (step 2) only if all select menus have been filled.

```js
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { customIds } = require('../../../config/constants');
const { isSessionComplete } = require('../../services/bookingService');

module.exports = {
  customId: customIds.continueBooking,

  async execute(interaction) {
    if (!isSessionComplete(interaction.user.id)) {
      await interaction.reply({
        content: 'Please select all options (service, payment, goal) before continuing.',
        ephemeral: true,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(customIds.bookingForm)
      .setTitle('Booking Details');

    const pcSpecs = new TextInputBuilder()
      .setCustomId(customIds.pcSpecsInput)
      .setLabel('Enter your PC specs (CPU, GPU, RAM)')
      .setPlaceholder('Example: Ryzen 5 5600X, RTX 3060, 16GB RAM')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const games = new TextInputBuilder()
      .setCustomId(customIds.gamesInput)
      .setLabel('What games do you play most?')
      .setPlaceholder('e.g. Valorant, Fortnite, CS2')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const apps = new TextInputBuilder()
      .setCustomId(customIds.appsInput)
      .setLabel('What apps do you use? (Discord, OBS, etc)')
      .setPlaceholder('e.g. Discord, OBS, Spotify, Chrome')
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

- [ ] **Step 4: Commit**

```bash
git add src/components/buttons/
git commit -m "feat: button handlers for support ticket, booking flow, and continue"
```

---

### Task 7: Select Menu Handlers

**Files:**
- Create: `src/components/selects/serviceSelect.js`
- Create: `src/components/selects/paymentSelect.js`
- Create: `src/components/selects/goalSelect.js`

- [ ] **Step 1: Create src/components/selects/serviceSelect.js**

```js
const { customIds } = require('../../../config/constants');
const { updateSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.serviceSelect,

  async execute(interaction) {
    const value = interaction.values[0];
    updateSession(interaction.user.id, 'service', value);
    await interaction.deferUpdate();
  },
};
```

- [ ] **Step 2: Create src/components/selects/paymentSelect.js**

```js
const { customIds } = require('../../../config/constants');
const { updateSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.paymentSelect,

  async execute(interaction) {
    const value = interaction.values[0];
    updateSession(interaction.user.id, 'payment', value);
    await interaction.deferUpdate();
  },
};
```

- [ ] **Step 3: Create src/components/selects/goalSelect.js**

```js
const { customIds } = require('../../../config/constants');
const { updateSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.goalSelect,

  async execute(interaction) {
    const value = interaction.values[0];
    updateSession(interaction.user.id, 'goal', value);
    await interaction.deferUpdate();
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add src/components/selects/
git commit -m "feat: select menu handlers for service, payment, and goal"
```

---

### Task 8: Modal Handler (Booking Form Submission)

**Files:**
- Create: `src/components/modals/bookingForm.js`

- [ ] **Step 1: Create src/components/modals/bookingForm.js**

This is the final step. It reads the session + modal inputs, creates a ticket channel, posts the summary + payment instructions.

```js
const { customIds, services, paymentMethods, goals } = require('../../../config/constants');
const { getSession, deleteSession } = require('../../services/bookingService');
const { createTicket } = require('../../services/ticketService');
const { getPaymentInfo } = require('../../services/paymentService');
const { bookingSummaryEmbed } = require('../../utils/embedBuilder');

function findLabel(list, value) {
  const item = list.find(i => i.value === value);
  return item ? item.label : value;
}

module.exports = {
  customId: customIds.bookingForm,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const session = getSession(interaction.user.id);
    if (!session || !session.service || !session.payment || !session.goal) {
      await interaction.editReply({ content: 'Your booking session expired. Please start again.' });
      return;
    }

    const pcSpecs = interaction.fields.getTextInputValue(customIds.pcSpecsInput);
    const gamesValue = interaction.fields.getTextInputValue(customIds.gamesInput);
    const apps = interaction.fields.getTextInputValue(customIds.appsInput);

    const bookingData = {
      service: findLabel(services, session.service),
      payment: findLabel(paymentMethods, session.payment),
      goal: findLabel(goals, session.goal),
      pcSpecs,
      games: gamesValue,
      apps,
    };

    // Create ticket channel
    const channel = await createTicket(interaction.guild, interaction.user, {
      type: 'booking',
      name: interaction.user.username,
    });

    // Post summary
    await channel.send({ embeds: [bookingSummaryEmbed(bookingData)] });

    // Post payment instructions
    const { instructions, fee } = getPaymentInfo(session.payment);
    let paymentMessage =
      'Your booking request has been received.\n\n' +
      'Please complete payment using the instructions below.\n' +
      'Once done, send proof of payment in this channel.\n\n' +
      instructions;

    if (fee > 0) {
      paymentMessage += `\n\n> Note: A **€${fee} processing fee** applies to this payment method.`;
    }

    await channel.send(paymentMessage);

    deleteSession(interaction.user.id);

    await interaction.editReply({ content: `Your booking ticket has been created: ${channel}` });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/
git commit -m "feat: booking form modal handler with ticket creation and payment info"
```

---

### Task 9: Create Directory Structure and Verify

- [ ] **Step 1: Create all directories**

```bash
mkdir -p src/components/buttons src/components/selects src/components/modals src/services src/utils src/commands src/events config
```

- [ ] **Step 2: Verify bot starts without errors**

```bash
# First copy .env.example to .env and fill in values
# Then:
npm start
```

Expected: Bot logs `Bot online as <botname>` (requires valid token).

- [ ] **Step 3: Deploy commands**

```bash
npm run deploy
```

Expected: `Commands registered.`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Discord booking bot with modular architecture"
```

---

## Design Decisions

1. **Two-step booking flow:** Discord modals only support TextInput components (no dropdowns). The flow uses ephemeral select menus first, then a modal for text fields. This provides the best UX within Discord's constraints.

2. **In-memory sessions:** Booking sessions use a Map with 15-minute TTL. No database needed for this use case — sessions are transient and only bridge the gap between select menu choices and modal submission.

3. **Shared ticket service:** Both support and booking tickets use the same `createTicket()` function, differentiated by `type` prefix in channel name.

4. **Payment instructions as a service:** Keeps fee logic and instruction text out of UI handlers. Easy to update payment details without touching interaction code.
