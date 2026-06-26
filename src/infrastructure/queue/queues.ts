import { Queue } from "bullmq";
import { env } from "../../config/env";

export const notificationQueue = new Queue("notifications", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});
