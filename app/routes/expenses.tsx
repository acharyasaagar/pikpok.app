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
              to="/new-expense"
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
            >
              New Expense
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-100 border-l-4 border-blue-500">
          <p className="text-blue-700">
            Total Expense for {month} {year}: <b>{totalExpenseAmount} EUR</b>
          </p>
        </div>

        <ul className="mt-6">
          {expenses.map((expense) => (
            <li key={expense.id} className=" border-gray-200 border-b  py-4">
              <div className="flex justify-between items-start  border-gray-200">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-800">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-600 capitalize mb-1">
                    {expense.category}
                  </div>
                </div>
              </div>
              {expense.comment ? (
                <div className="text-sm text-gray-600 mt-4">
                  {expense.comment}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reduceTotal(total: number, expense: any) {
  const result = total + expense.amount;
  // round up the result to 2 decimal places
  return Math.ceil(result * 100) / 100;
}
