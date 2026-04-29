import sql from "@/app/api/utils/sql";
import { getAuthUser, requireAuth } from "@/app/api/utils/jwt";

export async function GET(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const objects = await sql`
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object('id', e.id, 'first_name', e.first_name, 'last_name', e.last_name)
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as assigned_employees
      FROM objects o
      LEFT JOIN object_assignments oa ON o.id = oa.object_id
      LEFT JOIN employees e ON oa.employee_id = e.id
      GROUP BY o.id
      ORDER BY o.name ASC
    `;
    return Response.json(objects);
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
    const {
      name,
      address,
      type,
      cleaning_days,
      start_time,
      end_time,
      employee_ids,
    } = await request.json();

    const [object] = await sql`
      INSERT INTO objects (name, address, type, cleaning_days, start_time, end_time)
      VALUES (${name}, ${address}, ${type}, ${JSON.stringify(cleaning_days)}, ${start_time}, ${end_time})
      RETURNING *
    `;

    if (employee_ids?.length > 0) {
      for (const empId of employee_ids) {
        await sql`INSERT INTO object_assignments (object_id, employee_id) VALUES (${object.id}, ${empId})`;
      }
    }

    return Response.json(object);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function PATCH(request) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user, "owner");
  if (authError) return authError;

  try {
    const { id, ...updates } = await request.json();
    const { employee_ids, ...fieldUpdates } = updates;

    if (Object.keys(fieldUpdates).length > 0) {
      if (fieldUpdates.cleaning_days) {
        fieldUpdates.cleaning_days = JSON.stringify(fieldUpdates.cleaning_days);
      }
      const setClauses = Object.keys(fieldUpdates)
        .map((key, i) => `${key} = $${i + 2}`)
        .join(", ");
      const values = Object.values(fieldUpdates);
      await sql(`UPDATE objects SET ${setClauses} WHERE id = $1`, [
        id,
        ...values,
      ]);
    }

    if (employee_ids) {
      await sql`DELETE FROM object_assignments WHERE object_id = ${id}`;
      for (const empId of employee_ids) {
        await sql`INSERT INTO object_assignments (object_id, employee_id) VALUES (${id}, ${empId})`;
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
    await sql`DELETE FROM objects WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
