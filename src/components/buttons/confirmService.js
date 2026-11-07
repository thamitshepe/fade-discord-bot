const { MessageFlags } = require('discord.js');

const { customIds } = require('../../../config/constants');

const {
  getSession,
} = require('../../services/bookingService');

const {
  paymentSelectRow,
} = require('../../services/embedService');

module.exports = {
  customId: customIds.confirmService,

  async execute(interaction) {
    const session = getSession(interaction.user.id);

    if (!session || !session.service) {
      await interaction.reply({
        content:
          'Your booking session expired. Please start again from the service menu.',
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