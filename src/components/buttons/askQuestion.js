const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const { createTicket } = require('../../services/ticketService');
const { getSession, deleteSession } = require('../../services/bookingService');
const settings = require('../../../config/settings');

module.exports = {
  customId: customIds.askQuestion,

  async execute(interaction) {
    await interaction.deferUpdate();

    const guild = interaction.guild;
    const supportChannel = guild.channels.cache.get(settings.supportChannelId);

    if (!supportChannel) {
      await interaction.followUp({
        content: 'Support channel not found. Please contact staff directly.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Build thread name: support-[service-name]-[username]
    const session = getSession(interaction.user.id);
    const serviceName = session?.service ? session.service.replace(/_/g, '-') : 'general';
    const threadName = `support-${serviceName}-${interaction.user.username}`;

    const thread = await createTicket(supportChannel, interaction.user, {
      type: 'support',
      name: threadName,
    });

    await thread.send({
      content: `Welcome ${interaction.user}! You had a question about our services. Let us know how we can help!`,
    });

    // Clean up booking session
    deleteSession(interaction.user.id);

    await interaction.editReply({
      content: `A support ticket has been created for you in <#${settings.supportChannelId}>: ${thread}`,
      embeds: [],
      components: [],
    });
  },
};
