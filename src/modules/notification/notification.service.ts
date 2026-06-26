import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { notificationQueue } from "../../infrastructure/queue/queues";
import type {
  ListNotificationsInput,
  SendNotificationInput,
  UpdatePreferencesInput,
} from "./notification.schema";

async function getOrCreatePreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { userId } });
  }
  return prefs;
}

const emailTransporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

async function sendPushNotification(fcmToken: string, title: string, body: string, data: Record<string, unknown>) {
  if (!env.FCM_SERVER_KEY) {
    logger.warn("FCM_SERVER_KEY not configured, skipping push notification");
    return;
  }

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${env.FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body },
        data,
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "FCM push notification failed");
    }
  } catch (err) {
    logger.error({ err: (err as Error).message }, "FCM push notification error");
  }
}

async function sendSmsNotification(phone: string, body: string) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    logger.warn("Twilio not configured, skipping SMS notification");
    return;
  }

  try {
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: env.TWILIO_PHONE_NUMBER,
        To: phone,
        Body: body,
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Twilio SMS failed");
    }
  } catch (err) {
    logger.error({ err: (err as Error).message }, "Twilio SMS error");
  }
}

async function sendEmailNotification(email: string, title: string, body: string) {
  if (!emailTransporter) {
    logger.warn("SMTP not configured, skipping email notification");
    return;
  }

  try {
    await emailTransporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: title,
      text: body,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "Email notification error");
  }
}

export async function sendNotification(input: SendNotificationInput) {
  const prefs = await getOrCreatePreferences(input.userId);
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, phone: true },
  });

  const channels: string[] = [];
  for (const ch of input.channels) {
    if (ch === "PUSH" && prefs.pushEnabled && prefs.fcmToken) channels.push("PUSH");
    if (ch === "SMS" && prefs.smsEnabled && user?.phone) channels.push("SMS");
    if (ch === "EMAIL" && prefs.emailEnabled && user?.email) channels.push("EMAIL");
    if (ch === "IN_APP" && prefs.inAppEnabled) channels.push("IN_APP");
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type as never,
      title: input.title,
      body: input.body,
      data: input.data as Prisma.InputJsonValue,
      channels: channels as never,
    },
  });

  await notificationQueue.add("send-notification", {
    notificationId: notification.id,
    userId: input.userId,
    channels,
    title: input.title,
    body: input.body,
    data: input.data,
    fcmToken: prefs.fcmToken,
    email: user?.email,
    phone: user?.phone,
  });

  return notification;
}

export async function processNotificationJob(job: {
  channels: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  fcmToken: string | null;
  email: string | null;
  phone: string | null;
}) {
  const { channels, title, body, data, fcmToken, email, phone } = job;

  for (const ch of channels) {
    if (ch === "PUSH" && fcmToken) {
      await sendPushNotification(fcmToken, title, body, data);
    } else if (ch === "SMS" && phone) {
      await sendSmsNotification(phone, body);
    } else if (ch === "EMAIL" && email) {
      await sendEmailNotification(email, title, body);
    }
  }
}

export async function listNotifications(userId: string, input: ListNotificationsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { userId };
  if (input.unreadOnly) where.read = false;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new AppError("Notification not found", StatusCodes.NOT_FOUND);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });

  return { marked: true };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, read: false },
  });

  return { unreadCount: count };
}

export async function getPreferences(userId: string) {
  return getOrCreatePreferences(userId);
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  const prefs = await getOrCreatePreferences(userId);

  return prisma.notificationPreference.update({
    where: { id: prefs.id },
    data: {
      pushEnabled: input.pushEnabled,
      smsEnabled: input.smsEnabled,
      emailEnabled: input.emailEnabled,
      inAppEnabled: input.inAppEnabled,
      fcmToken: input.fcmToken,
    },
  });
}
