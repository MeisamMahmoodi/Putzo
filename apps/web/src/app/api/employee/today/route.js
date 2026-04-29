// Returns today's shift for the logged-in employee
import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/jwt";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const dayName = dayNames[new Date().getDay()];

    // Find the employee linked to this user's profile
    const employees = await sql`
      SELECT * FROM employees WHERE profile_id = ${user.id} LIMIT 1
    `;
    const employee = employees[0];

    if (!employee) {
      return Response.json({ employee: null, shift: null });
    }

    // Check if there's a sick record for today
    const sickCheck = await sql`
      SELECT * FROM attendance
      WHERE employee_id = ${employee.id}
        AND date = ${today}
        AND status = 'sick'
      LIMIT 1
    `;

    if (sickCheck.length > 0) {
      return Response.json({ employee, shift: null, isSick: true });
    }

    // Find today's shift from attendance OR object_assignments
    const shiftFromAttendance = await sql`
      SELECT a.*, o.name as object_name, o.address, o.start_time, o.end_time, o.id as object_id
      FROM attendance a
      JOIN objects o ON a.object_id = o.id
      WHERE a.employee_id = ${employee.id}
        AND a.date = ${today}
        AND a.status != 'sick'
      LIMIT 1
    `;

    if (shiftFromAttendance.length > 0) {
      const row = shiftFromAttendance[0];
      return Response.json({
        employee,
        shift: {
          object_id: row.object_id,
          object_name: row.object_name,
          address: row.address,
          start_time: row.start_time,
          end_time: row.end_time,
          attendance_id: row.id,
          status: row.status,
        },
        isSick: false,
      });
    }

    // Fall back to scheduled assignments for today's cleaning day
    const shiftFromAssignment = await sql`
      SELECT o.id as object_id, o.name as object_name, o.address, o.start_time, o.end_time
      FROM object_assignments oa
      JOIN objects o ON oa.object_id = o.id
      WHERE oa.employee_id = ${employee.id}
        AND o.cleaning_days::jsonb @> ${JSON.stringify(dayName)}::jsonb
      LIMIT 1
    `;

    if (shiftFromAssignment.length > 0) {
      const row = shiftFromAssignment[0];
      return Response.json({
        employee,
        shift: {
          object_id: row.object_id,
          object_name: row.object_name,
          address: row.address,
          start_time: row.start_time,
          end_time: row.end_time,
          attendance_id: null,
          status: "scheduled",
        },
        isSick: false,
      });
    }

    // No shift today
    return Response.json({ employee, shift: null, isSick: false });
  } catch (err) {
    console.error("employee/today error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
