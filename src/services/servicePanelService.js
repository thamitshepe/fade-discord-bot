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

const BANNER_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'images',
  'optimization.png'
);

function servicePanelComponents() {
  const container = new ContainerBuilder()
    .addMediaGalleryComponents((gallery) =>
      gallery.addItems((mediaGalleryItem) =>
        mediaGalleryItem.setURL('attachment://optimization.png')
      )
    )
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        '# Complete PC Optimization\n\n' +
        'A complete system optimization covering BIOS, Windows, GPU drivers, ' +
        'network configuration, CPU scheduling, and system responsiveness.\n\n' +
        'Designed for players experiencing inconsistent FPS, frame drops, ' +
        'micro-stuttering, or input delay.'
      )
    )
    .addSeparatorComponents((separator) =>
      separator
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            '## Complete PC Optimization\n\n' +
            '**€60 — One-time payment**\n\n' +
            'A full configuration session tailored to your hardware and the ' +
            'issues you want to address.'
          )
        )
        .setButtonAccessory((button) =>
          button
            .setStyle(ButtonStyle.Primary)
            .setCustomId(
              `${customIds.selectService}_complete_pc_optimization`
            )
            .setLabel('Get Started · €60')
          )
    )
    .addSeparatorComponents((separator) =>
      separator
        .setDivider(false)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        '**Included in the service**\n' +
        '• BIOS and advanced system configuration\n' +
        '• CPU and RAM behaviour optimization\n' +
        '• Windows 11 installation assistance and debloating\n' +
        '• NVIDIA / AMD driver configuration\n' +
        '• GPU performance and power settings\n' +
        '• Network and adapter configuration\n' +
        '• Windows processor and thread scheduling\n' +
        '• Final configuration and stability review\n\n' +
        '*Results depend on your hardware, software, and starting configuration. ' +
        'Specific FPS gains or complete elimination of stuttering cannot be guaranteed.*'
      )
    );

  return [container];
}

function servicePanelAttachment() {
  return new AttachmentBuilder(BANNER_PATH, {
    name: 'optimization.png',
  });
}

async function postServicePanel(channel) {
  if (await panelAlreadyPosted(channel, 'optimization.png')) {
    console.log(
      `Service panel already present in #${channel.name}, skipping`
    );
    return;
  }

  await channel.send({
    components: servicePanelComponents(),
    files: [servicePanelAttachment()],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`Service panel sent to #${channel.name}`);
}

module.exports = {
  postServicePanel,
};