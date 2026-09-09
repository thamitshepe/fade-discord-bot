const { customIds } = require('../../../config/constants');
const { updateSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.paymentSelect,

  async execute(interaction) {
    const value = interaction.values[0];
    updateSession(interaction.user.id, 'payment', value);
    await interaction.deferUpdate();
  },
};
