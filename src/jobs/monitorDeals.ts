import { Deal, Deals } from "../models";
import client, { deleteMessage } from "../loaders/discord";
import Queue from "./bull";
import db from "../loaders/lowdb";

const checkForExpiredDeals = () => {
  const activeDeals: Deals = db.get("activeDeals").value();
  activeDeals.forEach(async (deal: Deal) => {
    const now = new Date();
    const expireDate = new Date(deal.expireDate);
    if (now.getTime() > expireDate.getTime()) {
      if (
        await deleteMessage(
          deal.id.guildId,
          deal.id.channelId,
          deal.id.messageId
        )
      ) {
        // TODO prevent duplicate entries
        db.get("pastDeals")
          .push(deal)
          .write();
        db.get("activeDeals")
          .remove(deal)
          .write();
      }
    }
  });
};

function start() {
  const dealsQueue = new Queue("active deals");

  // Repeat every 60 seconds
  dealsQueue.add("checkForExpiredDeals", null, {
    repeat: {
      jobId: "checkForExpiredDeals",
      every: 60000
    }
  });
  dealsQueue.process("checkForExpiredDeals", 1, checkForExpiredDeals);
}

export default { start };
