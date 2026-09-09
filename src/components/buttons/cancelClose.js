const { customIds } = require('../../../config/constants');

module.exports = {
  customId: customIds.cancelClose,

  async execute(interaction) {
    await interaction.message.delete().catch(() => {});
  },
};
