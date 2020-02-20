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
  messageId: Snowflake;
}

export interface Deals {
  deals: Deal[];
}

export interface User {
  id: Snowflake;
  dealCount: number;
}

export type DBSchema = {
  activeDeals: Deal[];
  pastDeals: Deal[];
  users: User[];
};
