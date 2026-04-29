import sql from "@/app/api/utils/sql";
import { getAuthUser, requireAuth } from "@/app/api/utils/jwt";

export async function GET(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const today = new Date().toISOString().split("T")[0];
    const dayName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][
      new Date().getDay()
    ];

    // Stats (parallel)
    const [totalEmployees, activeEmployees, sickEmployeesCount, totalObjects] =
      await sql.transaction([
        sql`SELECT count(*) FROM employees`,
        sql`SELECT count(*) FROM employees WHERE status = 'active'`,
        sql`SELECT count(*) FROM employees WHERE status = 'sick'`,
        sql`SELECT count(*) FROM objects`,
      ]);

    // Today's sick leaves without a substitute
    const sickLeaves = await sql`
      SELECT
        a.id as attendance_id,
        e.id as employee_id,
        e.first_name,
        e.last_name,
        o.id as object_id,
        o.name as object_name,
        o.start_time,
        o.end_time
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN objects o ON a.object_id = o.id
      WHERE a.date = ${today} AND a.status = 'sick' AND a.substitute_id IS NULL
      ORDER BY e.last_name
    `;

    // Today's objects with employees and their attendance status
    const objectsToday = await sql`
      SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'first_name', e.first_name,
              'last_name', e.last_name,
              'avatar_color', e.avatar_color,
              'status', COALESCE(a.status, 'scheduled'),
              'attendance_id', a.id,
              'substitute_id', a.substitute_id
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as assigned_employees
      FROM objects o
      LEFT JOIN object_assignments oa ON o.id = oa.object_id
      LEFT JOIN employees e ON oa.employee_id = e.id
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.object_id = o.id AND a.date = ${today}
      WHERE o.cleaning_days::jsonb @> ${JSON.stringify(dayName)}::jsonb
      GROUP BY o.id
      ORDER BY o.start_time
    `;

    return Response.json({
      stats: {
        total: parseInt(totalEmployees[0].count),
        active: parseInt(activeEmployees[0].count),
        sick: parseInt(sickEmployeesCount[0].count),
        objects: parseInt(totalObjects[0].count),
        openSickLeaves: sickLeaves.length,
      },
      sickLeaves,
      objectsToday,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
