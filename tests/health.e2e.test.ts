import request from "supertest";
import { createApp } from "../src/app";

jest.mock("../src/infrastructure/db/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn().mockRejectedValue(new Error("mocked")),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../src/infrastructure/cache/redis", () => ({
  redis: {
    ping: jest.fn().mockRejectedValue(new Error("mocked")),
    duplicate: jest.fn().mockReturnValue({
      ping: jest.fn().mockRejectedValue(new Error("mocked")),
    }),
  },
}));

describe("Health endpoint", () => {
  it("responds with service status", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");

    expect([200, 503]).toContain(response.statusCode);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("data");
  });
});
