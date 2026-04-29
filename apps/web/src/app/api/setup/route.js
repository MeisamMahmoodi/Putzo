import argon2 from "argon2";
import sql from "../utils/sql.js";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  const setupToken = process.env.SETUP_TOKEN;
  const setupEmail = process.env.SETUP_OWNER_EMAIL;
  const setupPassword = process.env.SETUP_OWNER_PASSWORD;
  const setupName = process.env.SETUP_OWNER_NAME || "Owner";

  if (!setupToken || !setupEmail || !setupPassword) {
    return Response.json(
      {
        error:
          "Setup ist nicht konfiguriert. SETUP_TOKEN, SETUP_OWNER_EMAIL und SETUP_OWNER_PASSWORD muessen gesetzt sein.",
      },
      { status: 500 },
    );
  }

  if (token !== setupToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      full_name text NOT NULL,
      role text NOT NULL DEFAULT 'employee',
      password_hash text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
      first_name text NOT NULL,
      last_name text NOT NULL,
      phone text,
      avatar_color text,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS objects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      address text NOT NULL,
      type text,
      cleaning_days jsonb NOT NULL DEFAULT '[]'::jsonb,
      start_time text,
      end_time text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS known_objects (
      employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      object_id uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
      PRIMARY KEY (employee_id, object_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS object_assignments (
      object_id uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
      employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      PRIMARY KEY (object_id, employee_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      object_id uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
      date date NOT NULL,
      status text NOT NULL DEFAULT 'scheduled',
      substitute_id uuid REFERENCES employees(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT attendance_employee_object_date_unique UNIQUE (employee_id, object_id, date)
    )
  `;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'employee'`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`;

  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone text`;
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_color text`;
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'`;
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`;

  await sql`ALTER TABLE objects ADD COLUMN IF NOT EXISTS address text`;
  await sql`ALTER TABLE objects ADD COLUMN IF NOT EXISTS type text`;
  await sql`ALTER TABLE objects ADD COLUMN IF NOT EXISTS cleaning_days jsonb DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE objects ADD COLUMN IF NOT EXISTS start_time text`;
  await sql`ALTER TABLE objects ADD COLUMN IF NOT EXISTS end_time text`;
  await sql`ALTER TABLE objects ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`;

  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS object_id uuid REFERENCES objects(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES employees(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS note text`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'attendance_employee_object_date_unique'
      ) THEN
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_employee_object_date_unique
        UNIQUE (employee_id, object_id, date);
      END IF;
    END $$;
  `;

  const email = setupEmail.toLowerCase().trim();
  const hash = await argon2.hash(setupPassword);
  await sql`
    INSERT INTO profiles (email, full_name, role, password_hash)
    VALUES (${email}, ${setupName}, 'owner', ${hash})
    ON CONFLICT (email) DO UPDATE SET full_name = ${setupName}, role = 'owner', password_hash = ${hash}
  `;
  return Response.json({ success: true });
}
