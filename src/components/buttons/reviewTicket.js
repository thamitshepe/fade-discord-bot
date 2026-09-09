const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const settings = require('../../../config/settings');
const { approvedEmbed } = require('../../services/embedService');
const { getPaymentInfo } = require('../../services/paymentService');

module.exports = {
  customId: customIds.reviewTicket,

  async execute(interaction) {
    // Only staff can review
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      await interaction.reply({ content: 'Only staff can review tickets.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Disable the reviewing button and update it to "Approved"
    const originalRow = interaction.message.components[0];
    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customIds.reviewTicket)
        .setLabel('Approved')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(customIds.closeTicket)
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.update({ components: [updatedRow] });

    // Find payment method from the booking summary embed
    const embed = interaction.message.embeds[0];
    const paymentField = embed?.fields?.find(f => f.name === 'Payment Method');
    let paymentKey = null;

    if (paymentField) {
      // Reverse-lookup the value from the label
      const { paymentMethods } = require('../../../config/constants');
      const method = paymentMethods.find(p => p.label === paymentField.value);
      paymentKey = method ? method.value : null;
    }

    // Send approved embed
    await interaction.channel.send({ embeds: [approvedEmbed()] });

    // Send payment instructions if we found the method
    if (paymentKey) {
      const { instructions, fee } = getPaymentInfo(paymentKey);
      let paymentMessage = instructions;
      if (fee > 0) {
        paymentMessage += `\n\n> Note: A **€${fee} processing fee** applies to this payment method.`;
      }
      await interaction.channel.send(paymentMessage);
    }
  },
};
