
const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');

const { customIds } = require('../../../config/constants');
const {
  updateSession,
  getSession,
} = require('../../services/bookingService');

module.exports = {
  customId: customIds.selectPayment,

  async execute(interaction) {
    const paymentKey = interaction.values[0];

    const session = getSession(interaction.user.id);

    if (!session || !session.service) {
      await interaction.reply({
        content: 'Your booking session expired. Please start again from the service menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    updateSession(interaction.user.id, 'payment', paymentKey);

    const nameInput = new TextInputBuilder()
      .setCustomId(customIds.bookingNameInput)
      .setLabel('What should we call you?')
      .setPlaceholder('Your name or preferred name')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(80)
      .setRequired(true);

    const cpuInput = new TextInputBuilder()
      .setCustomId(customIds.bookingCpuInput)
      .setLabel('What CPU do you have?')
      .setPlaceholder('e.g. Ryzen 7 9800X3D or Unknown')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const gpuInput = new TextInputBuilder()
      .setCustomId(customIds.bookingGpuInput)
      .setLabel('What GPU do you have?')
      .setPlaceholder('e.g. RTX 4080 SUPER or Unknown')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const motherboardInput = new TextInputBuilder()
      .setCustomId(customIds.bookingMotherboardInput)
      .setLabel('What motherboard do you have?')
      .setPlaceholder('e.g. ASUS ROG STRIX B650E or Unknown')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(120)
      .setRequired(true);

    const ramInput = new TextInputBuilder()
      .setCustomId(customIds.bookingRamInput)
      .setLabel('What RAM do you have?')
      .setPlaceholder('e.g. 32GB DDR5 6000MHz or Unknown')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(120)
      .setRequired(true);

    const modal = new ModalBuilder()
      .setCustomId(customIds.bookingModal)
      .setTitle('PC Specifications')
      .addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(cpuInput),
        new ActionRowBuilder().addComponents(gpuInput),
        new ActionRowBuilder().addComponents(motherboardInput),
        new ActionRowBuilder().addComponents(ramInput),
      );

    await interaction.showModal(modal);
  },
};
