const { MessageFlags } = require('discord.js');

const { customIds } = require('../../../config/constants');

const {
  getSession,
} = require('../../services/bookingService');

module.exports = {
  customId: customIds.continueBooking,

  async execute(interaction) {
    const session = getSession(interaction.user.id);

    if (!session || !session.service || !session.payment) {
      await interaction.reply({
        content:
          'Your booking session has expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content:
        'Your booking is already in progress. Please complete the questionnaire opened after selecting your payment method.',
      flags: MessageFlags.Ephemeral,
    });
  },
};