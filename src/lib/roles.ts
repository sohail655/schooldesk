export const SCHOOL_ROLES = ["school_admin", "principal", "admin", "teacher", "student", "parent"] as const;
export type SchoolRole = (typeof SCHOOL_ROLES)[number];

export const ROLE_LABEL: Record<SchoolRole, string> = {
  school_admin: "School Admin",
  principal: "Principal",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

export const MANAGER_ROLES: SchoolRole[] = ["school_admin", "principal", "admin"];

export type NavItem = { label: string; href: string };

/** Sidebar / tab items per role. `base` is /school/<slug>. */
export function navFor(role: SchoolRole, base: string): NavItem[] {
  const m = (label: string, path = "") => ({ label, href: `${base}${path}` });
  switch (role) {
    case "school_admin":
    case "principal":
    case "admin":
      return [
        m("Dashboard"),
        m("Students", "/students"),
        m("Teachers", "/teachers"),
        m("Classes", "/classes"),
        m("Attendance", "/attendance"),
        m("Fees", "/fees"),
        m("Payroll", "/payroll"),
        m("Homework", "/homework"),
        m("Exams", "/exams"),
        m("Messages", "/messages"),
        m("Reports", "/reports"),
        m("Settings", "/settings"),
        m("Subscription", "/billing"),
      ];
    case "teacher":
      return [m("Today"), m("Attendance", "/attendance"), m("Check-in", "/check-in"), m("Homework", "/homework"), m("Messages", "/messages")];
    case "parent":
      return [m("Home"), m("Attendance", "/attendance"), m("Results", "/results"), m("Fees", "/fees"), m("Messages", "/messages")];
    case "student":
      return [m("Home"), m("Homework", "/homework"), m("Results", "/results"), m("Attendance", "/attendance")];
  }
}

/** Where a user lands after login. */
export function homePath(opts: { isPlatformOwner: boolean; memberships: { school: { slug: string } }[] }) {
  if (opts.isPlatformOwner) return "/owner";
  if (opts.memberships.length === 1) return `/school/${opts.memberships[0].school.slug}`;
  if (opts.memberships.length > 1) return "/choose-school";
  return "/no-access";
}
