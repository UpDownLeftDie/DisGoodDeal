export enum Methods {
  link = "link",
  instructions = "instructions"
}

export interface Deal {
  description: string;
  expireDate: Date;
  method: Methods.link | Methods.instructions;
  redemptionInfo: string;
  title: string;
  userId: string;
}

export interface Deals {
  deals: Deal[];
}
