import { describe, expect, it } from "vitest";
import { attendancePercent, distanceMeters, isLate, workingDays } from "../attendance";
import { createInviteToken, passwordProblems, tokensMatch } from "../invite";
import { homePath, navFor } from "../roles";

describe("attendancePercent", () => {
  it("counts late as present, half day as half, ignores leave", () => {
    expect(attendancePercent(["present", "late", "absent", "half_day", "leave"])).toBe(62.5);
  });
  it("returns null when there is nothing to count", () => {
    expect(attendancePercent(["leave"])).toBeNull();
  });
});

describe("distanceMeters", () => {
  it("is about 111 km per degree of latitude", () => {
    expect(distanceMeters({ lat: 30, lng: 73 }, { lat: 31, lng: 73 })).toBeGreaterThan(110000);
  });
  it("is 0 for the same point", () => {
    expect(distanceMeters({ lat: 30.81, lng: 73.45 }, { lat: 30.81, lng: 73.45 })).toBe(0);
  });
});

describe("isLate", () => {
  it("uses Pakistan time", () => {
    expect(isLate(new Date("2026-10-21T03:24:00Z"), "08:15")).toBe(true); // 08:24 PKT
    expect(isLate(new Date("2026-10-21T02:56:00Z"), "08:15")).toBe(false); // 07:56 PKT
  });
});

describe("workingDays", () => {
  it("excludes Sundays and holidays", () => {
    const days = workingDays(2026, 10, [0], ["2026-10-09"]);
    expect(days).not.toContain("2026-10-04");
    expect(days).not.toContain("2026-10-09");
    expect(days).toHaveLength(26);
  });
});

describe("invites", () => {
  it("matches only the original token", () => {
    const { token, hash } = createInviteToken();
    expect(tokensMatch(token, hash)).toBe(true);
    expect(tokensMatch(token + "x", hash)).toBe(false);
  });
  it("checks password rules", () => {
    expect(passwordProblems("short")).toContain("At least 8 characters");
    expect(passwordProblems("Okara2026!", "0333-2209187")).toEqual([]);
    expect(passwordProblems("x3332209187", "0333-2209187")).toContain("Must not contain your phone number");
  });
});

describe("roles", () => {
  it("routes users to the right home", () => {
    expect(homePath({ isPlatformOwner: true, memberships: [] })).toBe("/owner");
    expect(homePath({ isPlatformOwner: false, memberships: [{ school: { slug: "al-noor" } }] })).toBe("/school/al-noor");
    expect(homePath({ isPlatformOwner: false, memberships: [] })).toBe("/no-access");
  });
  it("gives parents no admin menu", () => {
    const labels = navFor("parent", "/school/x").map((n) => n.label);
    expect(labels).not.toContain("Payroll");
    expect(labels).toContain("Fees");
  });
});
