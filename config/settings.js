module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  staffRoleId: process.env.STAFF_ROLE_ID,
  coreRoleId: process.env.CORE_ROLE_ID,
  signatureRoleId: process.env.SIGNATURE_ROLE_ID,
  supportChannelId: process.env.SUPPORT_CHANNEL_ID,
  optimizationChannelId: process.env.OPTIMIZATION_CHANNEL_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  supportLogChannelId: process.env.SUPPORT_LOG_CHANNEL_ID || '1491619139343876238',
  optimizationLogChannelId: process.env.OPTIMIZATION_LOG_CHANNEL_ID || '1491619069403599068',
};
