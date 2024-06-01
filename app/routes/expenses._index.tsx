import { Link, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getUserExpensesForMonth } from "~/models/expense.server";
import { requireUserId } from "~/utils/session.server";
import { ZodMonthShort, getMonthNameFromIndex } from "~/utils/date.server";
import { z } from "zod";

const ReqQuerySchema = z.object({
  month: ZodMonthShort.optional(),
  year: z.number().min(2020).max(2050).optional(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const searchParams = ReqQuerySchema.parse(params);
  const now = new Date();
  const month = searchParams.month || getMonthNameFromIndex(now.getMonth());
  const year = searchParams.year || now.getFullYear();
  const expenses = await getUserExpensesForMonth(userId, month, year);

  return {
    expenses,
    totalExpenseAmount: expenses.reduce(reduceTotal, 0),
    month,
    year,
  };
};

export default function Expenses() {
  const loaderData = useLoaderData<typeof loader>();

  const { expenses, totalExpenseAmount, month, year } = loaderData;

  return (
    <div className="flex min-h-full flex-col justify-start">
      <div className="mx-auto w-full max-w-md px-8 py-8">
        <div className="flex justify-center">
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <div className="ml-auto mt-1">
            <Link
              to="/expenses/new"
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
            >
              New Expense
            </Link>
          </div>
        </div>
        <div className="mt-4">
          Total Expense for {month} {year}: {totalExpenseAmount}
        </div>
        <ul className="mt-8">
          {expenses.map((expense) => (
            <li key={expense.id} className="border-b border-gray-200 py-2">
              {expense.amount} - {expense.category} -{" "}
              {new Date(expense.date).toDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reduceTotal(total: number, expense: any) {
  return total + expense.amount;
}
