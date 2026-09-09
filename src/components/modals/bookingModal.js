const { MessageFlags } = require('discord.js');
const { customIds, services, paymentMethods, goals } = require('../../../config/constants');
const { getSession, deleteSession } = require('../../services/bookingService');
const { createTicket } = require('../../services/ticketService');
const { newBookingSummaryEmbed } = require('../../services/embedService');
const { createTicketRecord } = require('../../services/stateService');
const { getPaymentInfo } = require('../../services/paymentService');

function findLabel(list, value) {
  const item = list.find(i => i.value === value);
  return item ? item.label : value;
}

module.exports = {
  customId: customIds.bookingModal,

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const session = getSession(interaction.user.id);
    if (!session || !session.service || !session.payment || !session.goal) {
      await interaction.editReply({ content: 'Your booking session expired. Please start again from the service menu.' });
      return;
    }

    const pcSpecs = interaction.fields.getTextInputValue(customIds.bookingPcSpecsInput);
    const gamesValue = interaction.fields.getTextInputValue(customIds.bookingGamesInput);
    const apps = interaction.fields.getTextInputValue(customIds.bookingAppsInput);

    const { fee } = getPaymentInfo(session.payment);

    const bookingData = {
      service: findLabel(services, session.service),
      payment: findLabel(paymentMethods, session.payment),
      goal: findLabel(goals, session.goal),
      pcSpecs,
      games: gamesValue,
      apps,
      fee,
    };

    // Build thread name: [service-name]-[username] (e.g. signature-optimization-don-arrows)
    const serviceName = session.service.replace(/_/g, '-');
    const threadName = `${serviceName}-${interaction.user.username}`;

    // Create private thread using existing ticket logic
    const thread = await createTicket(interaction.channel, interaction.user, {
      type: 'booking',
      name: threadName,
    });

    // Post booking summary
    await thread.send({
      embeds: [newBookingSummaryEmbed(bookingData)],
    });

    // Record ticket in SQLite (non-blocking — thread is already created)
    try {
      createTicketRecord({
        threadId: thread.id,
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        type: 'booking',
        service: session.service,
        paymentMethod: session.payment,
        goal: session.goal,
      });
    } catch (err) {
      console.error('Failed to record ticket in database:', err.message);
    }

    deleteSession(interaction.user.id);

    await interaction.editReply({ content: `Your booking ticket has been created: ${thread}` });
  },
};
