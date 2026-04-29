import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/jwt";

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return Response.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const { action, employee_id, object_id, date, substitute_id } =
      await request.json();

    if (action === "report_sick") {
      const result = await sql`
        INSERT INTO attendance (employee_id, object_id, date, status)
        VALUES (${employee_id}, ${object_id}, ${date}, 'sick')
        ON CONFLICT ON CONSTRAINT attendance_employee_object_date_unique
        DO UPDATE SET status = 'sick', substitute_id = NULL
        RETURNING *
      `;
      await sql`UPDATE employees SET status = 'sick' WHERE id = ${employee_id}`;
      return Response.json(result[0]);
    }

    if (action === "assign_substitute") {
      const result = await sql`
        UPDATE attendance
        SET substitute_id = ${substitute_id}, status = 'substitute_requested'
        WHERE employee_id = ${employee_id} AND object_id = ${object_id} AND date = ${date}
        RETURNING *
      `;
      return Response.json(result[0] || { success: true });
    }

    if (action === "checkin") {
      const result = await sql`
        INSERT INTO attendance (employee_id, object_id, date, status)
        VALUES (${employee_id}, ${object_id}, ${date}, 'present')
        ON CONFLICT ON CONSTRAINT attendance_employee_object_date_unique
        DO UPDATE SET status = 'present'
        RETURNING *
      `;
      return Response.json(result[0]);
    }

    return Response.json({ error: "Ungültige Aktion" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
