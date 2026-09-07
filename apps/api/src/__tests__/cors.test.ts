import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]) },
}));
jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

jest.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "test",
    // Deliberately pasted with a trailing slash — that's how a dashboard
    // value usually ends up, and the Origin header never carries one.
    APP_URL: "https://zylixstore.online/",
    CORS_ORIGINS: "https://www.zylixstore.online, https://zylix-web.onrender.com",
  },
}));

import { createApp } from "@/app";

const app = createApp();

function preflight(origin: string) {
  return request(app)
    .options("/api/v1/auth/login")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST");
}

describe("CORS allow-list", () => {
  it("allows APP_URL, ignoring its trailing slash", async () => {
    const res = await preflight("https://zylixstore.online");
    expect(res.headers["access-control-allow-origin"]).toBe("https://zylixstore.online");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("allows each additional origin in CORS_ORIGINS, trimming whitespace", async () => {
    for (const origin of ["https://www.zylixstore.online", "https://zylix-web.onrender.com"]) {
      const res = await preflight(origin);
      expect(res.headers["access-control-allow-origin"]).toBe(origin);
    }
  });

  it("does not allow an origin that isn't listed", async () => {
    const res = await preflight("https://not-zylix.example.com");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("still serves requests with no Origin header (server-to-server, health checks)", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
  });
});
