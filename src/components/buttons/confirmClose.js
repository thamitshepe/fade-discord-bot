const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const settings = require('../../../config/settings');
const { closeTicket } = require('../../services/ticketService');
const { ticketLogEmbed, ticketLogActionRow } = require('../../services/embedService');

module.exports = {
  customId: customIds.confirmClose,

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      await interaction.reply({ content: 'Only staff can close tickets.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.update({ content: 'Closing ticket...', embeds: [], components: [] });

    // Extract reason from the confirmation embed
    const embed = interaction.message.embeds[0];
    const reasonField = embed?.fields?.find(f => f.name === 'Reason');
    const reason = reasonField ? reasonField.value : 'No reason provided';

    const thread = interaction.channel;
    const logData = await closeTicket(thread, {
      closedBy: interaction.user,
      reason,
    });

    // Route log to the correct channel based on ticket type
    const logChannelId = logData.ticketType === 'support'
      ? settings.supportLogChannelId
      : settings.optimizationLogChannelId;

    if (logChannelId) {
      const guild = interaction.guild;
      const logChannel = guild.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [ticketLogEmbed(logData)],
          components: [ticketLogActionRow(logData)],
        });
      }
    }
  },
};
