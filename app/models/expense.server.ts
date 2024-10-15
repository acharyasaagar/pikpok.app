import { BSON } from "mongodb";
import { z } from "zod";
import { MonthName, getMonthIndexFromName } from "~/utils/date";
import { mongodb } from "~/utils/db.server";

export const ExpenseSchema = z.object({
  _id: z
    .instanceof(BSON.ObjectId)
    .transform((value) => value.toHexString())
    .or(z.string())
    .default(() => new BSON.ObjectId().toHexString()),
  createdAt: z.date().default(() => new Date()),
  amount: z.number(),
  date: z.date(),
  category: z.string(),
  comment: z.string().optional(),
  userId: z.string(),
});

export const ExpenseViewSchema = ExpenseSchema.transform((expense) => {
  const { _id: id, userId, ...rest } = expense;
  return { ...rest, id, userId };
});

export type Expense = z.infer<typeof ExpenseSchema>;
export type ExpenseView = z.infer<typeof ExpenseViewSchema>;

const expenseCollection = mongodb.db().collection<Expense>("expenses");

export async function getExpenseById(_id: Expense["_id"]) {
  const foundExpense = await expenseCollection
    .findOne({ _id })
    .then((result) => result || null);
  return foundExpense ? ExpenseViewSchema.parse(foundExpense) : null;
}

export async function createExpense(params: {
  userId: Expense["userId"];
  amount: Expense["amount"];
  category: Expense["category"];
  date?: Expense["date"];
  comment?: Expense["comment"];
}) {
  const { amount, date = new Date(), category, comment, userId } = params;

  const expenseDocument = ExpenseSchema.parse({
    amount,
    date,
    category,
    comment,
    userId,
  });
  const inserted = await expenseCollection.insertOne(expenseDocument);
  return ExpenseViewSchema.parse(
    inserted.acknowledged ? expenseDocument : null,
  );
}

export async function getAllExpenses(userId: string) {
  const expenses = await expenseCollection
    .find({ userId })
    .sort({ date: -1 })
    .toArray();
  return expenses.map((expense) => ExpenseViewSchema.parse(expense));
}

export async function getExpensesByCategory(userId: string, category: string) {
  const expenses = await expenseCollection
    .find({ userId, category })
    .sort({ date: -1 })
    .toArray();
  return expenses.map((expense) => ExpenseViewSchema.parse(expense));
}

export async function getUserExpensesForMonth(
  userId: string,
  month: MonthName,
  year: number,
) {
  const monthIndex = getMonthIndexFromName(month);
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);
  const expenses = await expenseCollection
    .find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
    .sort({ date: -1 })
    .toArray();
  return expenses.map((expense) => ExpenseViewSchema.parse(expense));
}

export async function updateExpenseById(_id: string, update: Partial<Expense>) {
  const result = await expenseCollection.updateOne({ _id }, { $set: update });
  return result.matchedCount > 0;
}

export async function deleteExpenseById(_id: string) {
  const result = await expenseCollection.deleteOne({ _id });
  return result.deletedCount > 0;
}
