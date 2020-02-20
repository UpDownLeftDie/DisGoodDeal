import { Snowflake } from "discord.js";
export enum Methods {
  link = "link",
  instructions = "instructions"
}

export interface NewDeal {
  description: string;
  expireDate: Date;
  method: Methods.link | Methods.instructions;
  redemptionInfo: string;
  title: string;
  userId: string;
}

export interface Deal extends NewDeal {
  id: {
    guildId: Snowflake;
    channelId: Snowflake;
    messageId: Snowflake;
  };
}

export type Deals = Deal[];

export interface User {
  id: Snowflake;
  dealCount: number;
}

export type DBSchema = {
  activeDeals: Deals;
  pastDeals: Deals;
  users: User[];
};
