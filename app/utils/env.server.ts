import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"] as const),
  MONGODB_URI: z.string(),
  SESSION_SECRET: z.string(),
});

type EnvExtended = z.infer<typeof schema>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends EnvExtended {}
  }
}

let PARSED: EnvExtended | undefined;

export const initEnv = () => {
  const parsed = schema.safeParse(process.env);

  if (parsed.success === false) {
    // eslint-disable-next-line no-console
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );

    throw new Error("Invalid environment variables");
  }

  PARSED = parsed.data;
};

export const isProductionEnv = () => process.env.NODE_ENV === "production";
export const isDevelopmentEnv = () => process.env.NODE_ENV === "development";
export const getParsedProcessEnv = () => PARSED as unknown as EnvExtended;
