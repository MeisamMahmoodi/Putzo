import sql from "@/app/api/utils/sql";
import { getAuthUser, requireAuth } from "@/app/api/utils/jwt";

export async function GET(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const employees = await sql`
      SELECT 
        e.*,
        COALESCE(
          json_agg(
            json_build_object('id', o.id, 'name', o.name)
          ) FILTER (WHERE o.id IS NOT NULL),
          '[]'
        ) as known_objects
      FROM employees e
      LEFT JOIN known_objects ko ON e.id = ko.employee_id
      LEFT JOIN objects o ON ko.object_id = o.id
      GROUP BY e.id
      ORDER BY e.last_name ASC
    `;
    return Response.json(employees);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const { first_name, last_name, phone, known_object_ids } =
      await request.json();
    const avatarColors = [
      "#4F46E5",
      "#0EA5E9",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
    ];
    const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const result = await sql`
      INSERT INTO employees (first_name, last_name, phone, avatar_color, status)
      VALUES (${first_name}, ${last_name}, ${phone || null}, ${color}, 'active')
      RETURNING *
    `;
    const employee = result[0];
    if (known_object_ids?.length > 0) {
      for (const objId of known_object_ids) {
        await sql`INSERT INTO known_objects (employee_id, object_id) VALUES (${employee.id}, ${objId}) ON CONFLICT DO NOTHING`;
      }
    }
    return Response.json(employee);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const { id, ...updates } = await request.json();

    // Separate known_objects update from other fields
    const { known_object_ids, ...fieldUpdates } = updates;

    if (Object.keys(fieldUpdates).length > 0) {
      const setClauses = Object.keys(fieldUpdates)
        .map((key, i) => `${key} = $${i + 2}`)
        .join(", ");
      const values = Object.values(fieldUpdates);
      await sql(`UPDATE employees SET ${setClauses} WHERE id = $1`, [
        id,
        ...values,
      ]);
    }

    if (known_object_ids) {
      await sql`DELETE FROM known_objects WHERE employee_id = ${id}`;
      for (const objId of known_object_ids) {
        await sql`INSERT INTO known_objects (employee_id, object_id) VALUES (${id}, ${objId})`;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function DELETE(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const { id } = await request.json();
    await sql`DELETE FROM employees WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
