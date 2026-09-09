const { MessageFlags } = require('discord.js');
const { customIds, services, paymentMethods, goals } = require('../../../config/constants');
const { getSession, deleteSession } = require('../../services/bookingService');
const { createTicket } = require('../../services/ticketService');
const { bookingSummaryEmbed } = require('../../services/embedService');

function findLabel(list, value) {
  const item = list.find(i => i.value === value);
  return item ? item.label : value;
}

module.exports = {
  customId: customIds.bookingForm,

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

    const serviceName = session.service.replace(/_/g, '-');
    const thread = await createTicket(interaction.channel, interaction.user, {
      type: 'booking',
      name: `${serviceName}-${interaction.user.username}`,
    });

    // Store payment method on the thread for later use when approved
    thread.paymentMethod = session.payment;

    await thread.send({
      embeds: [bookingSummaryEmbed(bookingData)],
    });

    deleteSession(interaction.user.id);

    await interaction.editReply({ content: `Your booking ticket has been created: ${thread}` });
  },
};
