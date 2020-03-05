import { Message, MessageEmbed, User, DMChannel } from "discord.js";
import Discord from "discord.js";
import { NewDeal, Deal, Methods } from "./models";
import db from "./loaders/lowdb";

import { askQuestion, sendDM } from "./utils";

const optionalEmoji = "⏭";

const getDealTile = async (dm: DMChannel, user: User): Promise<string> => {
  const msgStr = "What is the deal? 😀 *(Enter a title)*";
  try {
    return await askQuestion(dm, user, msgStr);
  } catch (err) {
    console.error(`User did not respond in time when setting: title`, err);
  }
};

const getDealDescription = async (
  dm: DMChannel,
  user: User
): Promise<string> => {
  const msgStr = "So, like what IS it? 😲 *(Enter a descrption)*";
  try {
    return await askQuestion(dm, user, msgStr);
  } catch (err) {
    console.error(
      `User did not respond in time when setting: description`,
      err
    );
  }
};

const getDealRedemptionInfo = async (
  dm: DMChannel,
  user: User
): Promise<{
  redemptionInfo: string;
  method: Methods.instructions | Methods.link;
}> => {
  const msgStr =
    "How do you get said deal? 🤔 *(Paste a link or type instructions)*";
  try {
    let redemptionInfo = await askQuestion(dm, user, msgStr);
    try {
      redemptionInfo = new URL(redemptionInfo).href;
      return { redemptionInfo, method: Methods.link };
    } catch (err) {
      if (err.code === "ERR_INVALID_URL") {
        console.log("deal was not a link");
      } else {
        console.error("SOMETHING BAD HAPPENED: redemptionInfo", err);
      }
    }

    return { redemptionInfo, method: Methods.instructions };
  } catch (err) {
    console.error(
      `User did not respond in time when setting: redemptionInfo`,
      err
    );
  }
};

const getExpireDate = async (dm: DMChannel, user: User): Promise<Date> => {
  const defaultExpireDate = new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 7
  ); // second * min * hour * day * week
  const msgStr = "When does it expire? ⏳ (Default: 1 week)";
  let isValidDate = false;
  do {
    try {
      const expireStr: string | null = await askQuestion(
        dm,
        user,
        msgStr,
        true
      );
      // TODO refactor to handle optional reaction
      if (!expireStr) {
        isValidDate = true;
        return defaultExpireDate;
      } else {
        const expireDate = new Date(expireStr);
        if (expireDate instanceof Date && !isNaN(expireDate.getTime())) {
          isValidDate = true;
          return expireDate;
        } else {
          const invalidMsg = "Invalid date. Try again 🤷‍♂️";
          await sendDM(dm, invalidMsg);
        }
      }
    } catch (err) {
      console.error(
        `User did not respond in time when setting: expireMsg`,
        err
      );
      isValidDate = true;
    }
  } while (!isValidDate);
};

const goodDeal = async (msg: Message): Promise<[NewDeal, MessageEmbed]> => {
  const user: User = msg.author;
  const dm: DMChannel = await user.createDM();
  // TODO: what if user has DM's disabled?
  const introMsg = `Heard you got something good for me! 🤑\n*Required messages are **bold**\nUse ${optionalEmoji} reaction to skip optional questions*`;
  await sendDM(dm, introMsg);
  const deal: NewDeal = {
    title: await getDealTile(dm, user),
    description: await getDealDescription(dm, user),
    ...(await getDealRedemptionInfo(dm, user)),
    expireDate: await getExpireDate(dm, user),
    userId: user.id
  };

  const dealEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(deal.title)
    .setAuthor(msg.author.username, msg.author.displayAvatarURL())
    .setDescription(deal.description)
    // .setThumbnail("https://i.imgur.com/wSTFkRM.png")
    // .addField("Regular field title", "Some value here")
    // .addBlankField()
    // .addField("Inline field title", "Some value here", true)
    // .addField("Inline field title", "Some value here", true)
    // .addField("Inline field title", "Some value here", true)
    // .setImage("https://i.imgur.com/wSTFkRM.png")
    // .setTimestamp()
    .setFooter(`Expires: ${deal.expireDate.toDateString()}`);
  if (deal.method === Methods.link) {
    dealEmbed.setURL(deal.redemptionInfo);
  } else if (deal.redemptionInfo) {
    dealEmbed.addField("Instructions", deal.redemptionInfo);
  }
  return [deal, dealEmbed];
};

export const handleCommand = async (
  msg: Message,
  command: string
): Promise<void> => {
  // TODO use Switch
  if (command.startsWith("gooddeal")) {
    msg.delete();
    const newDealCommand = command.split("gooddeal ");
    if (newDealCommand.length === 1) {
      const [dealObj, richEmbed] = await goodDeal(msg);
      // TODO setup posting deals in specific channelId
      const messageRes = await msg.channel.send(
        "*WOW look at dis good deal!*",
        richEmbed
      );
      const newDealMsg: Message = messageRes?.[0] || messageRes;
      const deal: Deal = {
        ...dealObj,
        id: {
          guildId: newDealMsg.guild.id,
          channelId: newDealMsg.channel.id,
          messageId: newDealMsg.id
        }
      };
      db.get("activeDeals")
        .push(deal)
        .write();
      console.log(db.getState());
    } else {
      const helpText = "To use this command type: `wow gooddeal`";
      msg.channel.send(helpText);
    }
  } else {
    msg.channel.send("Unknown Command");
  }
};
