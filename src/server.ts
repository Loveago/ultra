import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { redis } from "./infrastructure/cache/redis";
import { prisma } from "./infrastructure/db/prisma";
import { notificationQueue } from "./infrastructure/queue/queues";
import { initSocket } from "./infrastructure/socket/socket";

async function bootstrap(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  initSocket(server);

  redis.on("error", (error) => {
    logger.error({ error }, "Redis connection error");
  });

  await prisma.$connect();

  await notificationQueue.add("startup", {
    event: "app_started",
    at: new Date().toISOString(),
  });

  server.listen(env.PORT, () => {
    logger.info(`Ultra API running on http://localhost:${env.PORT}`);
  });
}

void bootstrap();
