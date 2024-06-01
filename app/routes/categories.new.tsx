import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { z } from "zod";

import { createCategory } from "~/models/category.server";
import { badRequest } from "~/utils/response.server";
import { requireUserId } from "~/utils/session.server";
import { validateFormData } from "~/utils/zod";

const CategoryFormSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const categoryData = await validateFormData(CategoryFormSchema, formData);

  if ("errors" in categoryData) return badRequest(categoryData);

  await createCategory({ ...categoryData, createdByUserId: userId });
  return redirect(`/categories`);
};

export default function NewCategoryPage() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.description) {
      descriptionRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="flex flex-col gap-8">
          <div>
            <label
              htmlFor="categoryName"
              className="block text-sm font-medium text-gray-700"
            >
              Category Name
            </label>
            <div className="mt-1">
              <input
                ref={nameRef}
                id="categoryName"
                required
                name="name"
                type="text"
                autoComplete="off"
                aria-invalid={actionData?.errors?.name ? true : undefined}
                aria-describedby="categoryName-error"
                className={`w-full rounded border border-gray-500 px-2 py-1 text-lg ${
                  actionData?.errors?.name
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }`}
              />
              {actionData?.errors?.name ? (
                <div className="pt-1 text-red-700" id="categoryName-error">
                  {actionData.errors.name}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="categoryDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Category Description
            </label>
            <div className="mt-1">
              <textarea
                ref={descriptionRef}
                id="categoryDescription"
                name="description"
                rows={2}
                autoComplete="off"
                aria-invalid={
                  actionData?.errors?.description ? true : undefined
                }
                aria-describedby="categoryDescription-error"
                className={`w-full rounded border border-gray-500 px-2 py-1 text-lg ${
                  actionData?.errors?.description
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }`}
              />
              {actionData?.errors?.description ? (
                <div
                  className="pt-1 text-red-700"
                  id="categoryDescription-error"
                >
                  {actionData.errors.description}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Create Category
          </button>
        </Form>
      </div>
    </div>
  );
}
