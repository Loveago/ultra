import { prisma } from "../../infrastructure/db/prisma";
import { redis } from "../../infrastructure/cache/redis";

export type HealthStatus = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    api: "up";
    postgres: "up" | "down";
    redis: "up" | "down";
  };
};

export async function getHealthStatus(): Promise<HealthStatus> {
  let postgres: "up" | "down" = "up";
  let cache: "up" | "down" = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    postgres = "down";
  }

  try {
    await redis.ping();
  } catch {
    cache = "down";
  }

  const isHealthy = postgres === "up" && cache === "up";

  return {
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      api: "up",
      postgres,
      redis: cache,
    },
  };
}
