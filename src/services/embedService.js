const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
} = require('discord.js');
const { colors, customIds } = require('../../config/constants');
const path = require('path');

const BANNER_PATH = path.join(__dirname, '..', '..', 'assets', 'images', 'tickets.png');

function ticketPanelComponents() {
  // Banner at top
  const banner = new MediaGalleryBuilder().addItems({
    media: { url: 'attachment://tickets.png' },
  });

  // Title + Description (single TextDisplay)
  const titleBlock = new TextDisplayBuilder().setContent(
    '# FadeSolutions Support\nOpen one support ticket and keep everything in the same thread so we can help faster.'
  );

  // Timezone
 /*  const timezone = new TextDisplayBuilder().setContent(
    ''
  );

  */ 

  // Information
  const info = new TextDisplayBuilder().setContent(
    '**Priority Support (Clients & Serious Buyers)**\n' +
    '- Support is for active clients and users ready to book. **DMs are ignored**.\n' +
    '- Keep one issue per ticket. Duplicate/off-topic tickets may be closed.\n\n' +
    '**Best Use Cases**\n' +
    '- Session scheduling or rescheduling\n' +
    '- Payment confirmation and booking follow-up\n' +
    '- Post-optimization issues (FPS, stutters, crashes)\n' +
    '- App/game setup tied to your optimization\n\n' +
    '**To Get Fast Help, Include**\n' +
    '- Your goal (FPS, input delay, stability)\n' +
    '- PC specs + motherboard\n' +
    '- Affected games/apps + screenshots/errors\n\n'
  );

  // Select menu
  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.ticketPanelSelect)
      .setPlaceholder('☰ Open a support ticket...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Support')
          .setDescription('Get support from the team')
          .setValue('support'),
      )
  );

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(banner)
    .addTextDisplayComponents(titleBlock)
    //.addTextDisplayComponents(timezone)
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(info)
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(selectRow);

  return [container];
}

function ticketPanelAttachment() {
  return new AttachmentBuilder(BANNER_PATH, { name: 'tickets.png' });
}

function bookingSummaryEmbed(data) {
  return new EmbedBuilder()
    .setTitle('Booking Request')
    .setDescription('Your ticket is under review. A staff member will review your booking shortly.')
    .setColor(colors.embed)
    .addFields(
      { name: 'Service', value: data.service, inline: true },
      { name: 'Payment Method', value: data.payment, inline: true },
      { name: 'Goal', value: data.goal, inline: true },
      { name: 'PC Specs', value: data.pcSpecs || 'Not provided' },
      { name: 'Games', value: data.games || 'Not provided' },
      { name: 'Apps / Software', value: data.apps || 'Not provided' },
    );
}

function ticketActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIds.reviewTicket)
      .setLabel('Reviewing')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(customIds.closeTicket)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger),
  );
}

function approvedEmbed() {
  return new EmbedBuilder()
    .setTitle('Ticket Approved')
    .setDescription('Your booking has been approved. Please complete payment using the instructions below.')
    .setColor(colors.success);
}

function closeConfirmEmbed(reason) {
  const embed = new EmbedBuilder()
    .setTitle('Close Ticket')
    .setDescription('Are you sure you want to close this ticket?')
    .setColor(colors.danger);

  if (reason && reason !== 'No reason provided') {
    embed.addFields({ name: 'Reason', value: reason });
  }

  return embed;
}

function closeConfirmButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIds.confirmClose)
      .setLabel('Confirm Close')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(customIds.cancelClose)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );
}

function ticketLogEmbed(logData) {
  return new EmbedBuilder()
    .setTitle('Ticket Closed')
    .setColor(0xFFFFFF)
    .addFields(
      { name: '<:ID:1495252449823428750> Ticket ID', value: logData.threadId },
      { name: '<:Openedby:1495252525371232266> Opened By', value: `<@${logData.openedBy}>`, inline: true },
      { name: '<:Closedby:1495252556325326948> Closed By', value: `<@${logData.closedBy}>`, inline: true },
      { name: ' ', value: ' ' },
      { name: '<:Openedat:1495252418278064189> Opened At', value: logData.openedAt ? `<t:${logData.openedAt}:D>` : 'Unknown', inline: true },
      { name: '<:Closedat:1495250473832153169> Closed At', value: `<t:${logData.closedAt}:D>`, inline: true },
    );
}

function ticketLogActionRow(logData) {
  const { guildId } = require('../../config/settings');
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('View Thread')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${guildId}/${logData.threadId}`)
  );
}

function supportCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIds.closeTicket)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger),
  );
}

function serviceDetailEmbed(serviceKey) {
  const { serviceDetails } = require('../../config/constants');
  const detail = serviceDetails[serviceKey];
  if (!detail) return null;

  const includesList = detail.includes.map(item => `- ${item}`).join('\n');

  return new EmbedBuilder()
    .setTitle(detail.name)
    .setDescription(`**${detail.price}** · ${detail.duration}`)
    .setColor(colors.primary)
    .addFields(
      { name: 'What\'s Included', value: includesList },
    );
}

function serviceDetailButtons(serviceKey) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${customIds.confirmService}_${serviceKey}`)
      .setLabel('Ready to Buy')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(customIds.askQuestion)
      .setLabel('More Questions')
      .setStyle(ButtonStyle.Secondary),
  );
}

function paymentSelectRow() {
  const { paymentMethods } = require('../../config/constants');
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.selectPayment)
      .setPlaceholder('Select a payment method')
      .addOptions(
        paymentMethods.map(p =>
          new StringSelectMenuOptionBuilder().setLabel(p.label).setValue(p.value)
        )
      )
  );
}

function goalSelectRow() {
  const { goals } = require('../../config/constants');
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.selectGoal)
      .setPlaceholder('What\'s your main goal?')
      .addOptions(
        goals.map(g =>
          new StringSelectMenuOptionBuilder().setLabel(g.label).setValue(g.value)
        )
      )
  );
}

function newBookingSummaryEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle('Booking Request')
    .setDescription('A staff member will review your booking shortly.')
    .setColor(0xFFFFFF)
    .addFields(
      { name: 'Service', value: data.service },
      { name: 'Payment Method', value: data.payment },
      { name: 'Goal', value: data.goal },
      { name: 'PC Specs', value: data.pcSpecs || 'Not provided' },
      { name: 'Games', value: data.games || 'Not provided' },
      { name: 'Apps / Software', value: data.apps || 'Not provided' },
    );

  if (data.fee > 0) {
    embed.addFields({ name: 'Processing Fee', value: `+€${data.fee}` });
  }

  return embed;
}

function paymentInstructionsEmbed(paymentKey) {
  const { getPaymentInfo } = require('./paymentService');
  const { instructions, fee } = getPaymentInfo(paymentKey);

  let description = instructions;
  if (fee > 0) {
    description += `\n\n> A **€${fee} processing fee** applies to this payment method.`;
  }

  return new EmbedBuilder()
    .setTitle('Payment Instructions')
    .setDescription(description)
    .setColor(colors.warning);
}

module.exports = {
  ticketPanelComponents,
  ticketPanelAttachment,
  bookingSummaryEmbed,
  ticketActionRow,
  approvedEmbed,
  closeConfirmEmbed,
  closeConfirmButtons,
  ticketLogEmbed,
  ticketLogActionRow,
  supportCloseRow,
  serviceDetailEmbed,
  serviceDetailButtons,
  paymentSelectRow,
  goalSelectRow,
  newBookingSummaryEmbed,
  paymentInstructionsEmbed,
};