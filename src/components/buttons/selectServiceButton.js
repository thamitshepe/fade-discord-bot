const { MessageFlags } = require('discord.js');
const { customIds } = require('../../../config/constants');
const { createSession, updateSession } = require('../../services/bookingService');
const { serviceDetailEmbed, serviceDetailButtons } = require('../../services/embedService');
const settings = require('../../../config/settings');

module.exports = {
  customId: customIds.selectService,

  async execute(interaction) {
    // Extract service key from dynamic customId (e.g. select_service_core_optimization → core_optimization)
    const serviceKey = interaction.customId.replace(`${customIds.selectService}_`, '');

    // Care Plan access control — requires Core or Signature role
    if (serviceKey === 'care_plan') {
      const member = interaction.member;
      const hasAccess = member.roles.cache.has(settings.coreRoleId)
        || member.roles.cache.has(settings.signatureRoleId);

      if (!hasAccess) {
        await interaction.reply({
          content: "You don't have access to the Care Plan. Please complete a Core or Signature Optimization service first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    // Create a fresh session and store the service choice
    createSession(interaction.user.id);
    updateSession(interaction.user.id, 'service', serviceKey);

    const embed = serviceDetailEmbed(serviceKey);
    if (!embed) {
      await interaction.reply({
        content: 'Something went wrong. Please try again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [embed],
      components: [serviceDetailButtons(serviceKey)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
