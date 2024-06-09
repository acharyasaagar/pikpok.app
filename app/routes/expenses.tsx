import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getUserExpensesForMonth } from "~/models/expense.server";
import { requireUserId } from "~/utils/session.server";
import {
  MonthName,
  ZodMonthShort,
  getMonthIndexFromName,
  getMonthNameFromIndex,
} from "~/utils/date.server";
import { z } from "zod";
import { getErrorMessagesFromZodError, isZodError } from "~/utils/zod";
import { badRequest } from "~/utils/response.server";

const ReqQuerySchema = z.object({
  month: ZodMonthShort.optional(),
  year: z
    .string()
    .transform((y) => parseInt(y))
    .refine((y) => y >= 2024 && y < 2050)
    .optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const rawSearchParams = Object.fromEntries(new URL(request.url).searchParams);
  const queryParseResult = ReqQuerySchema.safeParse(rawSearchParams);
  if (!queryParseResult.success) {
    throw badRequest(getErrorMessagesFromZodError(queryParseResult.error));
  }
  const searchParams = queryParseResult.data;
  const now = new Date();
  const month = searchParams.month || getMonthNameFromIndex(now.getMonth());
  const year = searchParams.year || now.getFullYear();
  const expenses = await getUserExpensesForMonth(userId, month, year);
  const { previous, next } = getPagination(month, year);

  return {
    expenses,
    totalExpenseAmount: expenses.reduce(reduceTotal, 0),
    month,
    year,
    previous,
    next,
  };
};

export default function Expenses() {
  const [, setSearchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  console.log(loaderData);
  const { expenses, totalExpenseAmount, month, year, previous, next } =
    loaderData;

  const handlePrevious = () => {
    previous && setSearchParams(new URLSearchParams(previous));
  };

  const handleNext = () => {
    next && setSearchParams(new URLSearchParams(next));
  };

  const prevButtonJsx = previous ? (
    <button
      onClick={handlePrevious}
      className=" hover:bg-blue-50 py-1 px-2 rounded"
    >
      Previous
    </button>
  ) : null;

  const nextButtonJsx = next ? (
    <button
      onClick={handleNext}
      className={`hover:bg-blue-50 py-1 px-2 rounded ${prevButtonJsx ? "ml-4" : ""} inline-block`}
    >
      Next
    </button>
  ) : null;

  return (
    <div className="flex min-h-full flex-col justify-start">
      <div className="mx-auto w-full max-w-md px-8 py-8">
        <div className="flex items-center mb-2 -ml-2">
          {prevButtonJsx}
          {nextButtonJsx}
        </div>
        <h1 className="text-2xl font-semibold">
          {month} {year}
        </h1>

        <div className="mt-6 p-4 bg-blue-100 border-l-4 border-blue-500">
          <p className="text-blue-700">
            Total Expense for {month} {year}: <b>{totalExpenseAmount} EUR</b>
          </p>
        </div>

        <div className=" flex justify-between items-center border-b border-gray-200 py-8 ">
          <h2 className="text-lg font-semibold ">Expenses</h2>
          <div className="ml-auto ">
            <Link
              to="/new-expense"
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
            >
              New Expense
            </Link>
          </div>
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

export const ErrorBoundary = () => {
  const error = useRouteError();

  const errorMessage = isRouteErrorResponse(error)
    ? error.data
    : isZodError(error)
      ? getErrorMessagesFromZodError(error)
      : "Something went wrong.";

  console.log(errorMessage);
  return (
    <div className="text-center mt-8 text-red-500">
      <h1>Error</h1>
      <p>{errorMessage}</p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reduceTotal(total: number, expense: any) {
  const result = total + expense.amount;
  // round up the result to 2 decimal places
  return Math.ceil(result * 100) / 100;
}

const getPagination = (month: MonthName, year: number): Pagination => {
  const monthIndex = getMonthIndexFromName(month);
  const date = new Date(year, monthIndex);
  const now = new Date();
  const nextDate = new Date(date.getFullYear(), date.getMonth() + 1);
  const previousDate = new Date(date.getFullYear(), date.getMonth() - 1);
  const earliestValidDate = new Date(2024, 0);

  const next =
    nextDate <= now
      ? `?month=${getMonthNameFromIndex(nextDate.getMonth())}&year=${nextDate.getFullYear()}`
      : null;

  const previous =
    previousDate >= earliestValidDate
      ? `?month=${getMonthNameFromIndex(previousDate.getMonth())}&year=${previousDate.getFullYear()}`
      : null;

  return {
    previous,
    next,
  };
};

export type Pagination = {
  previous: string | null;
  next: string | null;
};
