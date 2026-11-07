const { MessageFlags } = require('discord.js');

const {
  customIds,
  serviceDetails,
  paymentMethods,
} = require('../../../config/constants');

const {
  getSession,
  updateSessionFields,
  deleteSession,
} = require('../../services/bookingService');

const { createTicket } = require('../../services/ticketService');
const { newBookingSummaryEmbed } = require('../../services/embedService');
const { createTicketRecord } = require('../../services/stateService');
const { getPaymentInfo } = require('../../services/paymentService');

function findLabel(list, value) {
  const item = list.find((entry) => entry.value === value);
  return item ? item.label : value;
}

function safeThreadName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

module.exports = {
  customId: customIds.bookingDetailsModal,

  async execute(interaction) {
    const session = getSession(interaction.user.id);

    if (!session || !session.service || !session.payment) {
      await interaction.reply({
        content:
          'Your booking session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    let thread;

    try {
      const objective = interaction.fields.getTextInputValue(
        customIds.bookingObjectiveInput
      );

      const games = interaction.fields.getTextInputValue(
        customIds.bookingGamesInput
      );

      const windows = interaction.fields.getTextInputValue(
        customIds.bookingWindowsInput
      );

      const availability = interaction.fields.getTextInputValue(
        customIds.bookingAvailabilityInput
      );

      const apps = interaction.fields.getTextInputValue(
        customIds.bookingAppsInput
      );

      updateSessionFields(interaction.user.id, {
        objective,
        games,
        windows,
        availability,
        apps: apps.trim() || 'Not provided',
      });

      const bookingSession = getSession(interaction.user.id);

      if (!bookingSession) {
        await interaction.editReply({
          content:
            'Your booking session expired. Please start again from the service menu.',
        });
        return;
      }

      const service = serviceDetails[bookingSession.service];

      if (!service) {
        await interaction.editReply({
          content:
            'The selected service is no longer available. Please contact support.',
        });
        return;
      }

      const payment = findLabel(
        paymentMethods,
        bookingSession.payment
      );

      const { fee } = getPaymentInfo(bookingSession.payment);

      const bookingData = {
        customer: bookingSession.name,
        service: service.name,
        price: service.price,
        payment,
        paymentMethod: payment,

        cpu: bookingSession.cpu,
        gpu: bookingSession.gpu,
        motherboard: bookingSession.motherboard,
        ram: bookingSession.ram,

        objective: bookingSession.objective,
        games: bookingSession.games,
        windows: bookingSession.windows,
        availability: bookingSession.availability,
        apps: bookingSession.apps,

        fee,
      };

      const threadName = safeThreadName(
        `booking-${interaction.user.username}`
      );

      thread = await createTicket(
        interaction.channel,
        interaction.user,
        {
          type: 'booking',
          name: threadName,
        }
      );

      await thread.send({
        content: `<@${interaction.user.id}>`,
        embeds: [newBookingSummaryEmbed(bookingData)],
      });

      try {
        createTicketRecord({
          threadId: thread.id,
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          type: 'booking',
          service: bookingSession.service,
          paymentMethod: bookingSession.payment,
          goal: bookingSession.objective,
        });
      } catch (databaseError) {
        console.error(
          'Failed to record booking ticket:',
          databaseError
        );
      }

      deleteSession(interaction.user.id);

      await interaction.editReply({
        content:
          `Your booking ticket has been created: ${thread}\n\n` +
          'Your information has been sent to the team. A staff member will review your request and follow up with you.',
      });
    } catch (error) {
      console.error('Booking creation error:', error);

      await interaction.editReply({
        content:
          'Something went wrong while creating your booking ticket. ' +
          'Please contact support so the team can assist you.',
      }).catch(() => {});
    }
  },
};