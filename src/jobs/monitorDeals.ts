import { Deal, Deals } from "../models";
import Queue from "./bull";
import db from "../loaders/lowdb";

const checkForExpiredDeals = () => {
  const activeDeals: Deals = db.get("activeDeals").value();
  //   console.log("checkForExpiredDeals...", activeDeals);
  activeDeals.forEach((deal: Deal) => {
    const now = new Date();
    const expireDate = new Date(deal.expireDate);
    // console.log(`now: ${now.toISOString()}  (${now.getTime()})`);
    // console.log(`now: ${expireDate.toISOString()}  (${expireDate.getTime()})`);
    // console.log(
    //   `Checking deal: "${deal.title}" now: ${now} > ${expireDate} = ${now >
    //     expireDate}`
    // );
    if (now.getTime() > expireDate.getTime()) {
      db.get("pastDeals")
        .push(deal)
        .write();
      // TODO delete discord message
      db.get("activeDeals")
        .remove(deal)
        .write();
    }
  });
};

const dealsQueue = new Queue("active deals");

// Repeat every 60 seconds
dealsQueue.add("checkForExpiredDeals", {
  repeat: {
    // every: 60000
    every: 5000
  }
});
dealsQueue.process("checkForExpiredDeals", checkForExpiredDeals);
