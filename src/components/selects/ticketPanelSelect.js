const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { customIds, services, paymentMethods, goals } = require('../../../config/constants');
const { createTicket } = require('../../services/ticketService');
const { createSession } = require('../../services/bookingService');
const { supportCloseRow } = require('../../services/embedService');

module.exports = {
  customId: customIds.ticketPanelSelect,

  async execute(interaction) {
    const value = interaction.values[0];

    if (value === 'support') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const thread = await createTicket(interaction.channel, interaction.user, {
        type: 'support',
        name: `support-${interaction.user.username}`,
      });

      await thread.send({
        content: `Welcome ${interaction.user}! Describe your issue and our team will help you shortly.`,
      });

      await interaction.editReply({ content: `Your support ticket has been created: ${thread}` });
    }

    if (value === 'purchase') {
      createSession(interaction.user.id);

      const serviceRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(customIds.serviceSelect)
          .setPlaceholder('Select a service')
          .addOptions(
            services.map(s =>
              new StringSelectMenuOptionBuilder().setLabel(s.label).setValue(s.value)
            )
          )
      );

      const paymentRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(customIds.paymentSelect)
          .setPlaceholder('Select payment method')
          .addOptions(
            paymentMethods.map(p =>
              new StringSelectMenuOptionBuilder().setLabel(p.label).setValue(p.value)
            )
          )
      );

      const goalRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(customIds.goalSelect)
          .setPlaceholder('Select your goal')
          .addOptions(
            goals.map(g =>
              new StringSelectMenuOptionBuilder().setLabel(g.label).setValue(g.value)
            )
          )
      );

      const continueRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(customIds.continueBooking)
          .setLabel('Continue')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: '**Step 1/2** — Select your options below, then click **Continue**.',
        components: [serviceRow, paymentRow, goalRow, continueRow],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
