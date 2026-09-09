const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const { customIds } = require('../../../config/constants');
const { isSessionComplete } = require('../../services/bookingService');

module.exports = {
  customId: customIds.continueBooking,

  async execute(interaction) {
    if (!isSessionComplete(interaction.user.id)) {
      await interaction.reply({
        content: 'Please select all options (service, payment, goal) before continuing.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(customIds.bookingForm)
      .setTitle('Booking Details');

    const pcSpecs = new TextInputBuilder()
      .setCustomId(customIds.pcSpecsInput)
      .setLabel('Enter your PC specs (CPU, GPU, RAM)')
      .setPlaceholder('Example: Ryzen 5 5600X, RTX 3060, 16GB RAM')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const games = new TextInputBuilder()
      .setCustomId(customIds.gamesInput)
      .setLabel('What games do you play most?')
      .setPlaceholder('e.g. Valorant, Fortnite, CS2')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const apps = new TextInputBuilder()
      .setCustomId(customIds.appsInput)
      .setLabel('What apps do you use? (Discord, OBS, etc)')
      .setPlaceholder('e.g. Discord, OBS, Spotify, Chrome')
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
