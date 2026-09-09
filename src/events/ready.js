const { Events } = require('discord.js');
const settings = require('../../config/settings');
const { postPanel } = require('../services/panelService');
const { postServicePanel } = require('../services/servicePanelService');
const { initDatabase } = require('../services/stateService');

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

    // Register slash commands for this guild on every boot so a deploy always
    // ships the commands that match the running code.
    const commandData = [...client.commands.values()].map(command => command.data.toJSON());
    if (commandData.length) {
      await guild.commands.set(commandData)
        .then(() => console.log(`Registered ${commandData.length} slash command(s)`))
        .catch(err => console.error('Failed to register slash commands:', err.message));
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

  },
};
