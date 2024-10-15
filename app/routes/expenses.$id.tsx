import { ActionFunction, redirect } from "@remix-run/node";
import { z } from "zod";
import { deleteExpenseById } from "~/models/expense.server";
import { requireUserId } from "~/utils/session.server";

export const action: ActionFunction = async ({ params, request }) => {
  await requireUserId(request);
  const expenseId = z.string().parse(params.id);
  await deleteExpenseById(expenseId);
  const referer = request.headers.get("referer");
  return redirect(referer ?? "/expenses");
};

const Expense = () => {
  return <div>Expense</div>;
};

export default Expense;
