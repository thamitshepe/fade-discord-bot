// Panels are posted on every ClientReady. Without this check a redeploy would
// post a duplicate panel into the channel each time the container restarts.

const LOOKBACK = 50;

async function panelAlreadyPosted(channel, bannerName) {
  if (process.env.REPOST_PANELS === 'true') return false;

  try {
    const messages = await channel.messages.fetch({ limit: LOOKBACK });
    return messages.some(message =>
      message.author.id === channel.client.user.id &&
      message.attachments.some(attachment => attachment.name === bannerName)
    );
  } catch (err) {
    console.error(`Could not read #${channel.name} history, skipping panel post:`, err.message);
    return true;
  }
}

module.exports = { panelAlreadyPosted };
