const { MessageFlags } = require('discord.js');

const { customIds } = require('../../../config/constants');

module.exports = {
  customId: customIds.goalSelect,

  async execute(interaction) {
    await interaction.reply({
      content:
        'The booking questionnaire has been updated. Please restart your booking from the service menu to continue.',
      flags: MessageFlags.Ephemeral,
    });
  },
};