import { z } from "zod";

export const ZodEmail = z.string().email();
