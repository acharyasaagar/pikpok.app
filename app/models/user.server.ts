import bcrypt from "bcryptjs";
import { BSON } from "mongodb";
import { z } from "zod";

import { mongodb } from "~/utils/db.server";

const UserSchema = z.object({
  _id: z.instanceof(BSON.ObjectId).transform((value) => value.toHexString()),
  createdAt: z.date().default(() => new Date()),
  email: z.string(),
  password: z.string(),
});

const UserViewSchema = UserSchema.omit({ password: true }).transform(
  (user) => ({ ...user, id: user._id }),
);

export type User = z.infer<typeof UserSchema>;
export type UserView = z.infer<typeof UserViewSchema>;

const userCollection = mongodb.db().collection<User>("users");

export async function getUserById(_id: User["_id"]) {
  const foundUser = await userCollection.findOne({ _id });
  return foundUser ? UserViewSchema.parse(foundUser) : null;
}

export async function getUserByEmail(email: User["email"]) {
  const foundUser = await userCollection.findOne({ email });
  return foundUser ? UserViewSchema.parse(foundUser) : null;
}

export async function createUser(email: User["email"], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userDocument = UserSchema.parse({ email, password: hashedPassword });
  const inserted = await userCollection.insertOne(userDocument);
  return UserViewSchema.parse(inserted.acknowledged ? userDocument : null);
}

export async function deleteUserByEmail(email: User["email"]) {
  return await userCollection.deleteOne({ email });
}

export async function verifyLogin(
  email: User["email"],
  password: User["password"],
) {
  const userWithPassword = await userCollection.findOne({ email });

  if (!userWithPassword || !userWithPassword.password) return null;

  const isValid = await bcrypt.compare(password, userWithPassword.password);

  if (!isValid) return null;

  return UserViewSchema.parse(userWithPassword);
}
