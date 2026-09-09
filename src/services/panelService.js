const { MessageFlags } = require('discord.js');
const { ticketPanelComponents, ticketPanelAttachment } = require('./embedService');
const { panelAlreadyPosted } = require('./panelGuard');

async function postPanel(channel) {
  if (await panelAlreadyPosted(channel, 'tickets.png')) {
    console.log(`Panel already present in #${channel.name}, skipping`);
    return;
  }

  await channel.send({
    components: ticketPanelComponents(),
    files: [ticketPanelAttachment()],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`Panel sent to #${channel.name}`);
}

module.exports = { postPanel };
