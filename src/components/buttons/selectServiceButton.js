const { MessageFlags } = require('discord.js');

const { customIds } = require('../../../config/constants');

const {
  createSession,
  updateSession,
} = require('../../services/bookingService');

const {
  serviceDetailEmbed,
  serviceDetailButtons,
} = require('../../services/embedService');

module.exports = {
  customId: customIds.selectService,

  async execute(interaction) {
    // The service key is appended to the button custom ID.
    const serviceKey = interaction.customId.slice(
      `${customIds.selectService}_`.length
    );

    const service = require('../../../config/constants')
      .serviceDetails[serviceKey];

    if (!service) {
      await interaction.reply({
        content: 'This service is currently unavailable. Please contact support.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Start a fresh booking session.
    createSession(interaction.user.id);

    updateSession(
      interaction.user.id,
      'service',
      serviceKey
    );

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