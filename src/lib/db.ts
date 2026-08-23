import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export default sql;
