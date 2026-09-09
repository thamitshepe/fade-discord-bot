const { customIds } = require('../../../config/constants');
const { updateSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.serviceSelect,

  async execute(interaction) {
    const value = interaction.values[0];
    updateSession(interaction.user.id, 'service', value);
    await interaction.deferUpdate();
  },
};
