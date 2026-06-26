import type { EchoInput } from "./system.schema";

export function echoMessage(payload: EchoInput): { echoed: string } {
  return { echoed: payload.message };
}
