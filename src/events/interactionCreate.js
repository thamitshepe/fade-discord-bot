const { Events, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
        let handler = buttons.get(interaction.customId);
        // Support prefix-matched buttons (e.g. confirm_service_core_optimization matches confirm_service)
        if (!handler) {
          for (const [key, h] of buttons) {
            if (interaction.customId.startsWith(key)) {
              handler = h;
              break;
            }
          }
        }
        if (handler) await handler.execute(interaction);
      } else if (interaction.isStringSelectMenu()) {
        const handler = selects.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      } else if (interaction.isModalSubmit()) {
        const handler = modals.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      }
    } catch (error) {
      // Suppress "Unknown interaction" — stale interactions from before bot restart
      if (error.code === 10062) return;

      console.error('Interaction error:', error);
      const reply = { content: 'Something went wrong. Please try again.', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
