const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const { customIds } = require('../../../config/constants');
const { updateSession, getSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.selectGoal,

  async execute(interaction) {
    const goalKey = interaction.values[0];

    const session = getSession(interaction.user.id);
    if (!session) {
      await interaction.reply({
        content: 'Your session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    updateSession(interaction.user.id, 'goal', goalKey);

    // Open the booking modal
    const modal = new ModalBuilder()
      .setCustomId(customIds.bookingModal)
      .setTitle('Booking Details');

    const pcSpecs = new TextInputBuilder()
      .setCustomId(customIds.bookingPcSpecsInput)
      .setLabel('PC Specs (CPU, GPU, RAM)')
      .setPlaceholder('e.g. Ryzen 5 5600X, RTX 3060, 16GB RAM')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const games = new TextInputBuilder()
      .setCustomId(customIds.bookingGamesInput)
      .setLabel('Games you play')
      .setPlaceholder('e.g. Fortnite, Valorant, CS2, FiveM')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const apps = new TextInputBuilder()
      .setCustomId(customIds.bookingAppsInput)
      .setLabel('Apps / Software running in background')
      .setPlaceholder('e.g. Discord, Spotify, OBS, Steam overlay')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(pcSpecs),
      new ActionRowBuilder().addComponents(games),
      new ActionRowBuilder().addComponents(apps),
    );

    await interaction.showModal(modal);
  },
};
