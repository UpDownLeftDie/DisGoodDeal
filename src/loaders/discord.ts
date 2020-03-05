import { Client, TextChannel, Guild, Snowflake } from "discord.js";
import Discord from "discord.js";
import { DiscordErrors } from "../models";
const client: Client = new Discord.Client();

export const deleteMessage = async (
  guildId: Snowflake,
  channelId: Snowflake,
  messageId: Snowflake
): Promise<boolean> => {
  const guild: Guild = client.guilds.cache.get(guildId);
  if (guild.available) {
    const channel: TextChannel = new Discord.TextChannel(guild, {
      id: channelId
    });
    if (!channel.deleted) {
      const messags = channel.messages;
      try {
        const message = await messags.fetch(messageId, false);
        if (!message.deleted) message.delete();
      } catch (err) {
        if (err.code === DiscordErrors.UnknownMessage) {
          console.log("Message already deleted");
        } else {
          console.error(err);
          throw err;
        }
      }
    }
    return true;
  }
  return false;
};

export default client;
