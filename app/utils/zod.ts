import { z } from "zod";

export const ZodEmail = z.string().email();

export const validateFormData = async <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  formData: FormData,
): Promise<z.infer<typeof schema> | { errors: z.infer<typeof schema> }> => {
  try {
    const data = schema.parse(Object.fromEntries(formData));
    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path.join(".")] = err.message;
        }
      });

      return { errors } as { errors: z.infer<typeof schema> };
    }

    throw error;
  }
};

export const getErrorMessagesFromZodError = (errors: z.ZodError): string => {
  return errors.errors
    .map(
      ({ message, path }) =>
        `${message} ${path.length ? "in '" + path.join(", ") + "'" : ""}`,
    )
    .join(", ");
};

export const isZodError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError;
};
