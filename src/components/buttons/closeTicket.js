const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const settings = require('../../../config/settings');

module.exports = {
  customId: customIds.closeTicket,

  async execute(interaction) {
    // Only staff can close
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      await interaction.reply({ content: 'Only staff can close tickets.', flags: MessageFlags.Ephemeral });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(customIds.closeTicketModal)
      .setTitle('Close Ticket');

    const reasonInput = new TextInputBuilder()
      .setCustomId(customIds.closeReasonInput)
      .setLabel('Reason for closing (optional)')
      .setPlaceholder('e.g. Resolved, Inactive, Completed')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

    await interaction.showModal(modal);
  },
};
