import { requireSchool } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MANAGER_ROLES } from "@/lib/roles";
import { Card, EmptyState, PageHeader, Pill, StatRow } from "@/components/ui";

const todayPk = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

export default async function SchoolHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership, school } = await requireSchool(slug);
  const isManager = MANAGER_ROLES.includes(membership.role);
  const supabase = await createClient();
  const today = todayPk();
  const dateLabel = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" });

  if (!isManager) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={`Assalam-o-Alaikum, ${membership.full_name.split(" ")[0]}`} sub={dateLabel} />
        <Card>
          <EmptyState title="Your screens are coming next" body="Attendance, homework, results and fees for your role arrive in the following milestones." />
        </Card>
      </div>
    );
  }

  const [students, staff, present, absent, leave, teachersIn, classes] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("status", "active"),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("is_active", true).in("role", ["teacher", "principal", "admin", "school_admin"]),
    supabase.from("student_attendance").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("on_date", today).in("status", ["present", "late", "half_day"]),
    supabase.from("student_attendance").select("id, student:students(full_name), class:classes(name, section)").eq("school_id", school.id).eq("on_date", today).eq("status", "absent").limit(8),
    supabase.from("student_attendance").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("on_date", today).eq("status", "leave"),
    supabase.from("staff_attendance").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("on_date", today).not("check_in_at", "is", null),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", school.id),
  ]);

  const total = students.count ?? 0;
  const marked = (present.count ?? 0) + (absent.data?.length ?? 0) + (leave.count ?? 0);
  type Absent = { id: string; student: { full_name: string }; class: { name: string; section: string } };
  const absentees = (absent.data ?? []) as unknown as Absent[];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Dashboard" sub={dateLabel} />
      <StatRow
        items={[
          { label: "Students present", value: `${present.count ?? 0} / ${total}`, sub: marked ? `${Math.round(((present.count ?? 0) / marked) * 100)}% of marked` : "Not marked yet", tone: "ok" },
          { label: "Teachers checked in", value: `${teachersIn.count ?? 0} / ${staff.count ?? 0}` },
          { label: "Absent", value: absentees.length, tone: absentees.length ? "bad" : undefined },
          { label: "Classes", value: classes.count ?? 0 },
        ]}
      />
      <Card title="Absent today">
        {total === 0 ? (
          <EmptyState title="Add your first students" body="Start with classes and sections, then add students or import them from a CSV file." />
        ) : absentees.length === 0 ? (
          <EmptyState title="No absences recorded yet" body="Absences show here as teachers submit class attendance." />
        ) : (
          <ul>
            {absentees.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-t border-line px-4 py-2.5 first:border-t-0">
                <span className="font-medium">{a.student.full_name}</span>
                <span className="flex items-center gap-3 text-[13px] text-muted">{a.class.name}-{a.class.section}<Pill tone="bad">Absent</Pill></span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
