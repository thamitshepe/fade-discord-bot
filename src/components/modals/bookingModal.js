
const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');

const { customIds } = require('../../../config/constants');

const {
  getSession,
  updateSessionFields,
} = require('../../services/bookingService');

module.exports = {
  customId: customIds.bookingModal,

  async execute(interaction) {
    const session = getSession(interaction.user.id);

    if (!session || !session.service || !session.payment) {
      await interaction.reply({
        content: 'Your booking session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Save the first questionnaire.
    const name = interaction.fields.getTextInputValue(
      customIds.bookingNameInput
    );

    const cpu = interaction.fields.getTextInputValue(
      customIds.bookingCpuInput
    );

    const gpu = interaction.fields.getTextInputValue(
      customIds.bookingGpuInput
    );

    const motherboard = interaction.fields.getTextInputValue(
      customIds.bookingMotherboardInput
    );

    const ram = interaction.fields.getTextInputValue(
      customIds.bookingRamInput
    );

    updateSessionFields(interaction.user.id, {
      name,
      cpu,
      gpu,
      motherboard,
      ram,
    });

    // Second questionnaire: performance goals and scheduling.
    const objectiveInput = new TextInputBuilder()
      .setCustomId(customIds.bookingObjectiveInput)
      .setLabel('What would you like us to improve?')
      .setPlaceholder(
        'e.g. Fortnite stutters, FPS drops, input delay, unstable frametimes...'
      )
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    const gamesInput = new TextInputBuilder()
      .setCustomId(customIds.bookingGamesInput)
      .setLabel('Which games do you play?')
      .setPlaceholder('List the games you mainly play')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(500)
      .setRequired(true);

    const windowsInput = new TextInputBuilder()
      .setCustomId(customIds.bookingWindowsInput)
      .setLabel('Which Windows version are you using?')
      .setPlaceholder('e.g. Windows 11 Pro 24H2 or Unknown')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const availabilityInput = new TextInputBuilder()
      .setCustomId(customIds.bookingAvailabilityInput)
      .setLabel('When are you available? Include timezone')
      .setPlaceholder('e.g. Weekdays after 18:00, SAST (UTC+2)')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(300)
      .setRequired(true);

    const appsInput = new TextInputBuilder()
      .setCustomId(customIds.bookingAppsInput)
      .setLabel('Which apps run while you game? (Optional)')
      .setPlaceholder('e.g. Discord, OBS, Spotify, browser')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(500)
      .setRequired(false);

    const modal = new ModalBuilder()
      .setCustomId(customIds.bookingDetailsModal)
      .setTitle('Optimization Details')
      .addComponents(
        new ActionRowBuilder().addComponents(objectiveInput),
        new ActionRowBuilder().addComponents(gamesInput),
        new ActionRowBuilder().addComponents(windowsInput),
        new ActionRowBuilder().addComponents(availabilityInput),
        new ActionRowBuilder().addComponents(appsInput),
      );

    await interaction.showModal(modal);
  },
};
