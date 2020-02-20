import dotenv from "dotenv";
dotenv.config();

import { Client, Message } from "discord.js";
import Discord from "discord.js";
const client: Client = new Discord.Client();
import { handleCommand } from "./commands";
import "./jobs/monitorDeals";

const config = {
  token: process.env.TOKEN,
  prefix: process.env.PREFIX
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg: Message) => {
  if (msg.content.startsWith(`${config.prefix}`)) {
    const command: string[] = msg.content.trim().split(config.prefix);
    if (command.length > 1) {
      handleCommand(msg, command[1].trim());
    }
    // } else {
    //   handleHelpError()
    // }
  }
});

client.login(config.token);
