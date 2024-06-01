import { MongoClient } from "mongodb";

import { getParsedProcessEnv } from "./env.server";
import { singleton } from "./singleton.server";

const parsedEnv = getParsedProcessEnv();

export const mongodb = singleton("mongodb", () => {
  const mongoClient = new MongoClient(parsedEnv.MONGODB_URI);
  return mongoClient;
});
