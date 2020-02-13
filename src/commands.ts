import { Message, RichEmbed, User, DMChannel, Collection } from "discord.js";
import { Deal, Methods } from "./models";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import Discord from "discord.js";

const adapter = new FileSync("db.json");
const db: low.LowdbSync<any> = low(adapter);

db.defaults({ activeDeals: [], pastDeals: [] }).write();

const getUserResponse = async (
  dm: DMChannel,
  user: User
): Promise<Collection<string, Message>> =>
  await dm.awaitMessages((m: Message) => m.author.id === user.id, {
    max: 1,
    time: 120000,
    errors: ["time"]
  });

const getDealTile = async (dm: DMChannel, user: User): Promise<string> => {
  await dm.send(
    "Heard you got something good for me! 🤑\nWhat is the deal? 😀 *(Enter a title)*"
  );
  try {
    const titleMsg = await getUserResponse(dm, user);
    return titleMsg.first().content;
  } catch (err) {
    console.error(`User did not respond in time when setting: title`, err);
  }
};

const getDealDescription = async (
  dm: DMChannel,
  user: User
): Promise<string> => {
  await dm.send("So, like what IS it? 😲 *(Enter a descrption)*");
  try {
    const descriptionMsg = await getUserResponse(dm, user);
    return descriptionMsg.first().content;
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
  await dm.send(
    "How do you get said deal? 🤔 *(Paste a link or type instructions)*"
  );
  try {
    const redemptionMsg = await getUserResponse(dm, user);
    let redemptionInfo: string = redemptionMsg.first().content;
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
  await dm.send("When does it expire? 💣 *(Enter a date, 'idk' = 1 week)*");
  let isValidDate = false;
  do {
    try {
      const expireMsg = await getUserResponse(dm, user);
      const expireStr = expireMsg.first().content;
      if (expireStr === "idk") {
        isValidDate = true;
        return defaultExpireDate;
      } else {
        const expireDate = new Date(expireStr);
        isValidDate = true;
        return expireDate;
      }
    } catch (err) {
      console.error(
        `User did not respond in time when setting: expireMsg`,
        err
      );
    }
  } while (!isValidDate);
};

const goodDeal = async (msg: Message): Promise<RichEmbed> => {
  const user: User = msg.author;
  const dm: DMChannel = await user.createDM();
  // TODO: what if user has DM's disabled?
  const deal: Deal = {
    title: await getDealTile(dm, user),
    description: await getDealDescription(dm, user),
    ...(await getDealRedemptionInfo(dm, user)),
    expireDate: await getExpireDate(dm, user),
    userId: user.id
  };

  const dealEmbed = new Discord.RichEmbed()
    .setColor("#0099ff")
    .setTitle(deal.title)
    .setAuthor(msg.author.username, msg.author.displayAvatarURL)
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
  return dealEmbed;
};

export const handleCommand = async (
  msg: Message,
  command: string
): Promise<void> => {
  // TODO use Switch
  if (command.startsWith("gooddeal")) {
    const deal = command.split("gooddeal ");
    if (deal.length === 1) {
      const richEmbed = await goodDeal(msg);
      // TODO setup posting deals in specific channelId
      const newDealMsg = await msg.channel.send(
        "*WOW look at dis good deal!*",
        richEmbed
      );
      // TODO store this in the DB for deleting after it expires
      console.log(newDealMsg);
    } else {
      const helpText = "To use this command type: `wow gooddeal`";
      msg.channel.send(helpText);
    }
  } else {
    msg.channel.send("Unknown Command");
  }
};
