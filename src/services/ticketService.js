const { ChannelType, PermissionFlagsBits } = require('discord.js');
const settings = require('../../config/settings');

// Track who opened each ticket (threadId → userId)
const ticketOpeners = new Map();

async function createTicket(channel, user, { type, name }) {
  const threadName = name.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const thread = await channel.threads.create({
    name: threadName,
    type: ChannelType.PrivateThread,
    reason: `${type} ticket for ${user.username}`,
  });

  await thread.members.add(user.id);

  // Grant the ticket creator permission to send messages in the thread
  await thread.permissionOverwrites?.edit(user.id, {
    [PermissionFlagsBits.SendMessages]: true,
    [PermissionFlagsBits.ViewChannel]: true,
  }).catch(() => {});

  // Add all members with the staff role
  const guild = channel.guild;
  const staffRole = guild.roles.cache.get(settings.staffRoleId);
  if (staffRole) {
    for (const [, member] of staffRole.members) {
      await thread.members.add(member.id).catch(() => {});
    }
  }

  ticketOpeners.set(thread.id, user.id);

  return thread;
}

function getTicketOpener(threadId) {
  return ticketOpeners.get(threadId) || null;
}

async function closeTicket(thread, { closedBy, reason }) {
  // Determine ticket type from thread name
  const ticketType = thread.name?.startsWith('support-') ? 'support' : 'booking';

  const logData = {
    threadId: thread.id,
    threadName: thread.name,
    ticketType,
    openedBy: ticketOpeners.get(thread.id) || 'Unknown',
    closedBy: closedBy.id,
    closedByTag: closedBy.username,
    reason: reason || 'No reason provided',
    openedAt: thread.createdTimestamp ? Math.floor(thread.createdTimestamp / 1000) : null,
    closedAt: Math.floor(Date.now() / 1000),
  };

  await thread.setLocked(true);
  await thread.setArchived(true);

  ticketOpeners.delete(thread.id);

  return logData;
}

module.exports = { createTicket, closeTicket, getTicketOpener };
