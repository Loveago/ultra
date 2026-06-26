import { z } from "zod";

export const echoSchema = z.object({
  message: z.string().min(1).max(120),
});

export type EchoInput = z.infer<typeof echoSchema>;
