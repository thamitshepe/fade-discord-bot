const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

const path = require('path');

const {
  colors,
  services,
  serviceDetails,
  paymentMethods,
  goals,
  customIds,
} = require('../../config/constants');

const TICKET_BANNER_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'images',
  'ticket.png'
);

function safeValue(value, fallback = 'Not provided') {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }

  return String(value).trim().slice(0, 1024);
}

function ticketPanelComponents() {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 1,
          label: 'Open a Ticket',
          custom_id: customIds.ticketPanelSelect,
        },
      ],
    },
  ];
}

function ticketPanelAttachment() {
  return new AttachmentBuilder(TICKET_BANNER_PATH, {
    name: 'ticket.png',
  });
}

function bookingSummaryEmbed(data) {
  return new EmbedBuilder()
    .setColor(colors.embed)
    .setTitle('Booking Summary')
    .addFields(
      {
        name: 'Customer',
        value: safeValue(data.customer),
        inline: true,
      },
      {
        name: 'Service',
        value: safeValue(data.service),
        inline: true,
      },
      {
        name: 'Price',
        value: safeValue(data.price),
        inline: true,
      },
      {
        name: 'Payment Method',
        value: safeValue(data.paymentMethod || data.payment),
        inline: true,
      }
    )
    .setTimestamp();
}

function ticketActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIds.reviewTicket)
      .setLabel('Review Ticket')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(customIds.closeTicket)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );
}

function approvedEmbed(data) {
  return new EmbedBuilder()
    .setColor(colors.success)
    .setTitle('Ticket Approved')
    .setDescription(
      `Your request has been reviewed${data?.staff ? ` by ${data.staff}` : ''}.`
    )
    .setTimestamp();
}

function closeConfirmEmbed() {
  return new EmbedBuilder()
    .setColor(colors.warning)
    .setTitle('Close Ticket?')
    .setDescription(
      'Are you sure you want to close this ticket? This action will archive the conversation.'
    );
}

function closeConfirmButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIds.confirmClose)
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(customIds.cancelClose)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );
}

function ticketLogEmbed(data) {
  return new EmbedBuilder()
    .setColor(colors.embed)
    .setTitle('Ticket Closed')
    .addFields(
      {
        name: 'Ticket',
        value: safeValue(data.threadName),
        inline: true,
      },
      {
        name: 'Opened By',
        value: safeValue(data.openedBy),
        inline: true,
      },
      {
        name: 'Closed By',
        value: safeValue(data.closedByTag),
        inline: true,
      },
      {
        name: 'Reason',
        value: safeValue(data.reason),
      }
    )
    .setTimestamp();
}

function ticketLogActionRow(data) {
  const row = new ActionRowBuilder();

  if (data?.threadId) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('View Ticket')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${data.guildId}/${data.threadId}`)
    );
  }

  return row;
}

function supportCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIds.closeTicket)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );
}

function serviceDetailEmbed(serviceKey) {
  const service = serviceDetails[serviceKey];

  if (!service) return null;

  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(service.name)
    .setDescription(service.description)
    .addFields({
      name: 'Price',
      value: safeValue(service.price),
      inline: true,
    });

  if (service.duration) {
    embed.addFields({
      name: 'Estimated Duration',
      value: safeValue(service.duration),
      inline: true,
    });
  }

  if (service.audience) {
    embed.addFields({
      name: 'Who is this for?',
      value: safeValue(service.audience),
    });
  }

  if (service.includes?.length) {
    embed.addFields({
      name: 'Included',
      value: service.includes.map((item) => `• ${item}`).join('\n').slice(0, 1024),
    });
  }

  if (service.benefits?.length) {
    embed.addFields({
      name: 'Potential Benefits',
      value: service.benefits.map((item) => `• ${item}`).join('\n').slice(0, 1024),
    });
  }

  return embed;
}

function serviceDetailButtons(serviceKey) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${customIds.confirmService}_${serviceKey}`)
      .setLabel('Continue')
      .setStyle(ButtonStyle.Primary)
  );
}

function paymentSelectRow() {
  const options = paymentMethods.map((method) => ({
    label: method.label,
    value: method.value,
  }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.selectPayment)
      .setPlaceholder('Choose a payment method')
      .addOptions(options)
  );
}

function goalSelectRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customIds.goalSelect)
      .setPlaceholder('Choose your main goal')
      .addOptions(
        goals.map((goal) => ({
          label: goal.label,
          value: goal.value,
        }))
      )
  );
}

function newBookingSummaryEmbed(data) {
  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('Complete PC Optimization Booking')
    .setDescription(
      'A new optimization request has been submitted. Review the customer information and requirements below.'
    )
    .addFields(
      {
        name: 'Customer',
        value: safeValue(data.customer),
        inline: true,
      },
      {
        name: 'Service',
        value: safeValue(data.service),
        inline: true,
      },
      {
        name: 'Price',
        value: safeValue(data.price),
        inline: true,
      },
      {
        name: 'Payment Method',
        value: safeValue(data.paymentMethod || data.payment),
        inline: true,
      },
      {
        name: 'CPU',
        value: safeValue(data.cpu),
        inline: true,
      },
      {
        name: 'GPU',
        value: safeValue(data.gpu),
        inline: true,
      },
      {
        name: 'Motherboard',
        value: safeValue(data.motherboard),
        inline: true,
      },
      {
        name: 'RAM',
        value: safeValue(data.ram),
        inline: true,
      },
      {
        name: 'What They Want to Improve',
        value: safeValue(data.objective),
      },
      {
        name: 'Games Played',
        value: safeValue(data.games),
      },
      {
        name: 'Windows Version',
        value: safeValue(data.windows),
        inline: true,
      },
      {
        name: 'Availability & Timezone',
        value: safeValue(data.availability),
      },
      {
        name: 'Apps Used While Gaming',
        value: safeValue(data.apps),
      }
    );

  if (Number(data.fee) > 0) {
    embed.addFields({
      name: 'Additional Processing Fee',
      value: `€${Number(data.fee).toFixed(2)}`,
      inline: true,
    });
  }

  return embed.setTimestamp();
}

function paymentInstructionsEmbed(data) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('Payment Instructions')
    .setDescription(safeValue(data.instructions))
    .addFields({
      name: 'Payment Method',
      value: safeValue(data.method),
      inline: true,
    })
    .setTimestamp();
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