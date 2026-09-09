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
