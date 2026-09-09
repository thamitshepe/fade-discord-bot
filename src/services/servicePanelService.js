const {
  MessageFlags,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  SeparatorSpacingSize,
} = require('discord.js');
const { customIds } = require('../../config/constants');
const { panelAlreadyPosted } = require('./panelGuard');
const path = require('path');

const BANNER_PATH = path.join(__dirname, '..', '..', 'assets', 'images', 'optimization.png');

function servicePanelComponents() {
  const container = new ContainerBuilder()
    .addMediaGalleryComponents((gallery) => gallery
      .addItems(
        (mediaGalleryItem) => mediaGalleryItem
          .setURL('attachment://optimization.png'),
      )
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
      .setContent('# PC Optimization\n\nGet your PC performing at its best. Pick a service below to get started.')
    )
    .addSeparatorComponents((separator) => separator
      .setDivider(false)
      .setSpacing(SeparatorSpacingSize.Small)
    )
    .addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) => textDisplay
          .setContent('## Core Optimization\n\nFull system optimization covering BIOS, Windows, drivers, GPU settings, network, input latency, and more. Built for players dealing with stuttering, input lag, or inconsistent frames. One session. Noticeable difference.'),
      )
      .setButtonAccessory((button) => button
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`${customIds.selectService}_core_optimization`)
        .setLabel('€90')
      )
    )
    .addSeparatorComponents((separator) => separator
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Large)
    )
    .addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) => textDisplay
          .setContent('## Signature Optimization\n\nEverything in **Core Optimization**, plus advanced memory tuning and extended stability validation. For players who compete and want every millisecond accounted for.'),
      )
      .setButtonAccessory((button) => button
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`${customIds.selectService}_signature_optimization`)
        .setLabel('€130')
      )
    )
    .addSeparatorComponents((separator) => separator
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Large)
    )
    .addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) => textDisplay
          .setContent('## Care Plan\n\nMonthly system maintenance — check-ups, performance monitoring, cleanup, configuration review, and priority support. Peace of mind, handled.'),
      )
      .setButtonAccessory((button) => button
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`${customIds.selectService}_care_plan`)
        .setLabel('€25/mo')
      )
    );

  return [container];
}

function servicePanelAttachment() {
  return new AttachmentBuilder(BANNER_PATH, { name: 'optimization.png' });
}

async function postServicePanel(channel) {
  if (await panelAlreadyPosted(channel, 'optimization.png')) {
    console.log(`Service panel already present in #${channel.name}, skipping`);
    return;
  }

  await channel.send({
    components: servicePanelComponents(),
    files: [servicePanelAttachment()],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`Service panel sent to #${channel.name}`);
}

module.exports = { postServicePanel };
