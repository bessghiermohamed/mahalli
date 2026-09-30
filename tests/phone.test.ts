import { describe, expect, it } from "vitest";
import {
  formatPhoneIntl,
  formatPhoneLocal,
  normalizeAlgerianPhone,
} from "@/lib/phone";

describe("normalizeAlgerianPhone", () => {
  it("normalizes mobile numbers with leading zero", () => {
    expect(normalizeAlgerianPhone("0550123456")).toBe("213550123456");
    expect(normalizeAlgerianPhone("0661234567")).toBe("213661234567");
    expect(normalizeAlgerianPhone("0770123456")).toBe("213770123456");
  });

  it("normalizes mobile numbers without leading zero", () => {
    expect(normalizeAlgerianPhone("550123456")).toBe("213550123456");
  });

  it("normalizes international formats", () => {
    expect(normalizeAlgerianPhone("+213550123456")).toBe("213550123456");
    expect(normalizeAlgerianPhone("213550123456")).toBe("213550123456");
  });

  it("ignores spaces, dashes, dots and parentheses", () => {
    expect(normalizeAlgerianPhone("0550 12 34 56")).toBe("213550123456");
    expect(normalizeAlgerianPhone("0550-12-34-56")).toBe("213550123456");
    expect(normalizeAlgerianPhone("(0550) 123456")).toBe("213550123456");
    expect(normalizeAlgerianPhone("0550.123.456")).toBe("213550123456");
  });

  it("normalizes landline numbers", () => {
    expect(normalizeAlgerianPhone("0212345678")).toBe("213212345678");
    expect(normalizeAlgerianPhone("213312345678")).toBe("213312345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeAlgerianPhone("")).toBeNull();
    expect(normalizeAlgerianPhone("055012345")).toBeNull(); // too short
    expect(normalizeAlgerianPhone("05501234567")).toBeNull(); // too long
    expect(normalizeAlgerianPhone("12345")).toBeNull();
    expect(normalizeAlgerianPhone("abcdefghij")).toBeNull();
    expect(normalizeAlgerianPhone("0850123456")).toBeNull(); // invalid prefix
    expect(normalizeAlgerianPhone("0999123456")).toBeNull();
  });
});

describe("formatPhoneLocal / formatPhoneIntl", () => {
  it("formats stored E.164 back to local display", () => {
    expect(formatPhoneLocal("213550123456")).toBe("0550123456");
    expect(formatPhoneLocal("213212345678")).toBe("0212345678");
  });

  it("formats international display", () => {
    expect(formatPhoneIntl("213550123456")).toBe("+213 550 12 34 56");
  });
});
