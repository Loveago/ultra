import { Job, Worker } from "bullmq";
import { env } from "../../../config/env";
import { logger } from "../../../config/logger";

export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name, payload: job.data }, "Processing notification job");
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    concurrency: 5,
  }
);
