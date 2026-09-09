const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const settings = require('../../config/settings');
const { customIds } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket'),

  async execute(interaction) {
    // Only staff can close tickets
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      await interaction.reply({ content: 'Only staff can close tickets.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Must be used in a thread
    if (interaction.channel.type !== ChannelType.PrivateThread && interaction.channel.type !== ChannelType.PublicThread) {
      await interaction.reply({ content: 'This command can only be used inside a ticket thread.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Open the close ticket modal (reuses existing modal handler)
    const modal = new ModalBuilder()
      .setCustomId(customIds.closeTicketModal)
      .setTitle('Close Ticket');

    const reasonInput = new TextInputBuilder()
      .setCustomId(customIds.closeReasonInput)
      .setLabel('Reason for closing (optional)')
      .setPlaceholder('e.g. Issue resolved, no response, etc.')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

    await interaction.showModal(modal);
  },
};
