import dotenv from "dotenv";
dotenv.config();

import { Message } from "discord.js";
import client from "./loaders/discord";
import { handleCommand } from "./commands";
import monitorDeals from "./jobs/monitorDeals";

const config = {
  token: process.env.TOKEN,
  prefix: process.env.PREFIX
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  monitorDeals.start();
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
