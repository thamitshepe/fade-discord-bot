const { customIds } = require('../../../config/constants');
const { closeConfirmEmbed, closeConfirmButtons } = require('../../services/embedService');

module.exports = {
  customId: customIds.closeTicketModal,

  async execute(interaction) {
    const reason = interaction.fields.getTextInputValue(customIds.closeReasonInput) || 'No reason provided';

    await interaction.reply({
      embeds: [closeConfirmEmbed(reason)],
      components: [closeConfirmButtons()],
    });
  },
};
