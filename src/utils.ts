import {
  Collection,
  DMChannel,
  Message,
  MessageReaction,
  User
} from "discord.js";

const optionalEmoji = "⏭";

export const sendDM = async (
  dm: DMChannel,
  msgStr: string
): Promise<Message> => {
  //   dm.startTyping();
  const message = await dm.send(msgStr);
  //   dm.stopTyping();
  return message?.[0] || message;
};

export const askQuestion = async (
  dm: DMChannel,
  user: User,
  msgStr: string,
  isOptional: boolean = false
): Promise<string | null> => {
  if (!isOptional) msgStr = `**${msgStr}**`;
  const question: Message = await sendDM(dm, msgStr);
  if (isOptional) {
    const reactionPromise = getUserReaction(question, user, optionalEmoji);
    const userReposePromise = getUserResponse(dm, user);
    const winner = await Promise.race([reactionPromise, userReposePromise]);
    const response = winner.first();
    if (response instanceof MessageReaction) {
      // ? might trigger on any reaction
      return null;
    } else if (response instanceof Message) {
      return (response as Message).content;
    }
  } else {
    const response = await getUserResponse(dm, user);
    return response.first().content;
  }
};

const getUserResponse = async (
  dm: DMChannel,
  user: User
): Promise<Collection<string, Message>> => {
  const filter = (m: Message) => m.author.id === user.id;
  return await dm.awaitMessages(filter, {
    max: 1,
    time: 120000,
    errors: ["time"]
  });
};

const getUserReaction = async (
  question: Message,
  user: User,
  emoji: string
): Promise<Collection<string, MessageReaction>> => {
  const filter = (r: MessageReaction, u: User) =>
    r.emoji.name === emoji && u.id === user.id;
  await question.react(optionalEmoji);
  return await question.awaitReactions(filter, {
    max: 1,
    time: 120000,
    errors: ["time"]
  });
};
