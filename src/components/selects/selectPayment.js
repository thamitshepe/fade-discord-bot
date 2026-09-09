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
      feeNotice = '\n> Note: A **\u20ac15 processing fee** applies to this payment method.\n';
    }

    await interaction.update({
      content: `${feeNotice}Almost there! Select your main goal below.`,
      components: [goalSelectRow()],
    });
  },
};
