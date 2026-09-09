const { customIds } = require('../../../config/constants');
const { updateSession } = require('../../services/bookingService');

module.exports = {
  customId: customIds.goalSelect,

  async execute(interaction) {
    const value = interaction.values[0];
    updateSession(interaction.user.id, 'goal', value);
    await interaction.deferUpdate();
  },
};
