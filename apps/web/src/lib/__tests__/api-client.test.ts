import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/types/user";

const sampleUser: AuthUser = {
  id: "user_1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Obi",
  role: "CUSTOMER",
  status: "ACTIVE",
  avatarUrl: null,
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
  twoFactorEnabled: false,
  preferredCurrency: "NGN",
  preferredLocale: "en",
  phone: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: async () => body,
  } as unknown as Response;
}

describe("apiRequest", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, status: "idle" });
    global.fetch = jest.fn();
  });

  it("returns the parsed JSON body on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await apiRequest<{ ok: boolean }>("/health");

    expect(result).toEqual({ ok: true });
  });

  it("throws ApiRequestError with the server message on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(422, { error: { message: "Validation failed" } }),
    );

    await expect(apiRequest("/auth/register")).rejects.toMatchObject({
      status: 422,
      message: "Validation failed",
    });
  });

  it("transparently refreshes on 401 and retries the original request", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: "Invalid or expired session" } }))
      .mockResolvedValueOnce(jsonResponse(200, { user: sampleUser, accessToken: "new-token" }))
      .mockResolvedValueOnce(jsonResponse(200, { user: sampleUser }));

    const result = await apiRequest<{ user: AuthUser }>("/auth/me");

    expect(result.user.email).toBe("ada@example.com");
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });

  it("clears the session when refresh also fails", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: "Invalid or expired session" } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: "Session expired" } }));

    useAuthStore.getState().setSession(sampleUser, "stale-token");

    await expect(apiRequest("/auth/me")).rejects.toBeInstanceOf(ApiRequestError);
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("does not attempt a refresh when skipAuthRetry is set", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(401, { error: { message: "Session expired" } }),
    );

    await expect(apiRequest("/auth/refresh", { skipAuthRetry: true })).rejects.toMatchObject({
      status: 401,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
