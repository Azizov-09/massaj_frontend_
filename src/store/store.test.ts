import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useStore } from "./index";
import { api } from "@/services/api";
import type { UserRole } from "@/types";
describe("Global Zustand Store Tests", () => {
  beforeEach(() =>
    useStore.setState({
      currentUser: null,
      isAuthenticated: false,
      toasts: [],
    }),
  );
  afterEach(() => vi.restoreAllMocks());
  it.each(["SUPER_ADMIN", "SPECIALIST", "PARENT"] as UserRole[])(
    "uses the authenticated server identity for %s",
    async (role) => {
      vi.spyOn(api.auth, "login").mockResolvedValue({
        accessToken: "test-token",
        user: {
          id: "server-user",
          phone: "+998901234567",
          fullName: "Server user",
          role,
        },
      });
      const result = await useStore
        .getState()
        .login("901234567", "test-password");
      expect(result.success).toBe(true);
      expect(useStore.getState().currentUser).toMatchObject({
        id: "server-user",
        role,
        phone: "+998901234567",
      });
      expect(api.auth.login).toHaveBeenCalledWith({
        phone: "+998901234567",
        password: "test-password",
      });
    },
  );
  it("rejects invalid credentials without creating a local identity", async () => {
    vi.spyOn(api.auth, "login").mockRejectedValue(
      new Error("Telefon raqami yoki parol noto'g'ri"),
    );
    const result = await useStore.getState().login("+998900000000", "badpass");
    expect(result.success).toBe(false);
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(useStore.getState().currentUser).toBeNull();
  });
  it("adds and removes toast messages correctly", () => {
    useStore.getState().addToast({ type: "success", title: "Saqlandi" });
    const toast = useStore.getState().toasts[0];
    expect(toast).toBeDefined();
    useStore.getState().removeToast(toast.id);
    expect(
      useStore.getState().toasts.find((t) => t.id === toast.id),
    ).toBeUndefined();
  });
});
