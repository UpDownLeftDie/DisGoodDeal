import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
const adapter = new FileSync("db.json");
import { DBSchema } from "../models";

const db: low.LowdbSync<DBSchema> = low(adapter);
db.defaults({ activeDeals: [], pastDeals: [], users: {} }).write();
export default db;
