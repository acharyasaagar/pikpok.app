// Use this to delete a user by their email
// Simply call this with:
// yarn ts-node -r tsconfig-paths/register ./cypress/support/delete-user.ts username@example.com,
// and that user will get deleted

import { installGlobals } from "@remix-run/node";
import { mongodb } from "~/utils/db.server";

const userCollection = mongodb.db().collection("users");

installGlobals();

async function deleteUser(email: string) {
  if (!email) {
    throw new Error("email required for login");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  try {
    const deleteResult = await userCollection.deleteOne({ email });
    if (deleteResult.deletedCount === 0) {
      console.log("User not found, so no need to delete");
    }
  } finally {
    await mongodb.close();
  }
}

deleteUser(process.argv[2]);
