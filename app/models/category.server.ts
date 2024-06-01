import { BSON } from "mongodb";
import { z } from "zod";
import { mongodb } from "~/utils/db.server";

const CategorySchema = z.object({
  _id: z
    .instanceof(BSON.ObjectId)
    .transform((value) => value.toHexString())
    .or(z.string())
    .default(() => new BSON.ObjectId().toHexString()),
  name: z.string(),
  description: z.string().optional(),
  createdByUserId: z
    .instanceof(BSON.ObjectId)
    .transform((value) => value.toHexString())
    .or(z.string())
    .optional(), // Reference to the User ID who created the category
});

const CategoryViewSchema = CategorySchema.transform((category) => {
  const { _id: id, createdByUserId, ...rest } = category;
  return { ...rest, id, createdByUserId };
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoryView = z.infer<typeof CategoryViewSchema>;

const categoryCollection = mongodb.db().collection<Category>("categories");

export async function getCategoryById(_id: Category["_id"]) {
  const foundCategory = await categoryCollection.findOne({ _id });
  return foundCategory ? CategoryViewSchema.parse(foundCategory) : null;
}

export async function createCategory(params: {
  name: Category["name"];
  description?: Category["description"];
  createdByUserId?: Category["createdByUserId"];
}) {
  const { name, description, createdByUserId } = params;

  const categoryDocument = CategorySchema.parse({
    name,
    description,
    createdByUserId,
  });
  const inserted = await categoryCollection.insertOne(categoryDocument);
  return CategoryViewSchema.parse(
    inserted.acknowledged ? categoryDocument : null,
  );
}

export async function getAllCategories(userId: string) {
  const categories = await categoryCollection
    .find({
      $or: [
        { createdByUserId: { $exists: false } },
        { createdByUserId: userId },
      ],
    })
    .toArray();
  return categories.map((category) => CategoryViewSchema.parse(category));
}

export async function deleteCategoryById(_id: Category["_id"]) {
  return await categoryCollection.deleteOne({ _id });
}
