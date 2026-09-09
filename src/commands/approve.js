const {
  SlashCommandBuilder,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const settings = require('../../config/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('approve')
    .setDescription('Approve the current booking ticket'),

  async execute(interaction) {
    // Only staff can approve tickets
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      await interaction.reply({ content: 'Only staff can approve tickets.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Must be used in a thread
    if (interaction.channel.type !== ChannelType.PrivateThread && interaction.channel.type !== ChannelType.PublicThread) {
      await interaction.reply({ content: 'This command can only be used inside a ticket thread.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.reply('Your booking has been approved. A staff member will send you payment instructions shortly.');
  },
};
