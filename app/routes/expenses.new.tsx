import { z } from "zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useRef } from "react";
import { createExpense } from "~/models/expense.server";
import { requireUserId } from "~/utils/session.server";
import { validateFormData } from "~/utils/zod";
import { badRequest } from "~/utils/response.server";
import { getAllCategories } from "~/models/category.server";
import { getMonthIndexFromName, ZodMonthShort } from "~/utils/date";

export const ExpenseFormSchema = z.object({
  amount: z.string().transform(parseFloat),
  date: z
    .string()
    .transform((date) => new Date(date ? date : Date.now()))
    .refine((d) => z.date().safeParse(d).success),
  category: z.string(),
  comment: z.string().optional(),
  redirectTo: z.string().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const categories = await getAllCategories(userId);

  return { categories };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const parsedFormData = await validateFormData(ExpenseFormSchema, formData);

  if ("errors" in parsedFormData) return badRequest(parsedFormData);
  const { redirectTo = "/expenses", ...expenseData } = parsedFormData;

  await createExpense({ ...expenseData, userId });
  return redirect(redirectTo);
};

export default function NewExpensePage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const redirectTo = searchParams.get("redirectTo") || "";
  const defaultDate = getDefaultDate(redirectTo.split("?")[1]);

  useEffect(() => {
    if (actionData?.errors?.amount) {
      amountRef.current?.focus();
    } else if (actionData?.errors?.date) {
      dateRef.current?.focus();
    } else if (actionData?.errors?.category) {
      categoryRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <h1 className="text-2xl font-bold mb-4">Add New Expense</h1>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount
            </label>
            <input
              ref={amountRef}
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              className={`w-full rounded border border-gray-500 px-2 py-1 text-lg focus:border-blue-500`}
              aria-invalid={actionData?.errors?.amount ? true : undefined}
              aria-describedby="amount-error"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              ref={dateRef}
              id="date"
              name="date"
              type="date"
              className={`w-full rounded border border-gray-500 px-2 py-1 text-lg focus:border-blue-500`}
              aria-invalid={actionData?.errors?.date ? true : undefined}
              aria-describedby="date-error"
              max={new Date().toISOString().split("T")[0]}
              defaultValue={defaultDate}
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              ref={categoryRef}
              id="category"
              name="category"
              required
              className={`w-full rounded border border-gray-500 px-2 py-1 text-lg focus:border-blue-500`}
              aria-invalid={actionData?.errors?.category ? true : undefined}
              aria-describedby="category-error"
              defaultValue={loaderData.categories[1].name}
            >
              <option value="">Select a category</option>
              {loaderData.categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700"
            >
              Comment
            </label>
            <textarea
              ref={commentRef}
              id="comment"
              name="comment"
              rows={2}
              className={`w-full rounded border border-gray-500 px-2 py-1 text-lg focus:border-blue-500`}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Add expense
          </button>
          <a href="/expenses" className="block text-center text-blue-500">
            Go to expenses
          </a>
        </Form>
      </div>
    </div>
  );
}

function getDefaultDate(query: string): string {
  const urlSearchParams = new URLSearchParams(query);
  const month = ZodMonthShort.safeParse(urlSearchParams.get("month"));
  const year = z.coerce.number().safeParse(urlSearchParams.get("year"));

  if (month.success && year.success) {
    const date = new Date();
    date.setUTCFullYear(year.data);
    date.setUTCMonth(getMonthIndexFromName(month.data));
    return date.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}
