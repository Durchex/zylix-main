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
  emailVerifiedAt: new Date().toISOString(),
  phoneVerifiedAt: null,
  twoFactorEnabled: false,
  preferredCurrency: "NGN",
  preferredLocale: "en",
  phone: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, status: "idle" });
    document.cookie = "zylix_session=; path=/; max-age=0";
  });

  it("starts in the idle state with no session", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe("idle");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it("setSession stores the user/token and marks status authenticated", () => {
    useAuthStore.getState().setSession(sampleUser, "access-token-123");

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user).toEqual(sampleUser);
    expect(state.accessToken).toBe("access-token-123");
  });

  it("clearSession wipes the user/token and marks status unauthenticated", () => {
    useAuthStore.getState().setSession(sampleUser, "access-token-123");
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it("setSession sets a same-domain marker cookie proxy.ts can read (the real refresh token is on the API's domain, invisible here)", () => {
    useAuthStore.getState().setSession(sampleUser, "access-token-123");
    expect(document.cookie).toContain("zylix_session=1");
  });

  it("clearSession removes the marker cookie", () => {
    useAuthStore.getState().setSession(sampleUser, "access-token-123");
    useAuthStore.getState().clearSession();
    expect(document.cookie).not.toContain("zylix_session=1");
  });
});
