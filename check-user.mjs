import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { agremiados } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const user = await db.select().from(agremiados).where(eq(agremiados.numeroColegiado, "4661")).limit(1);

console.log("Usuario 4661:", JSON.stringify(user, null, 2));

if (user.length > 0) {
  console.log("\n✅ Usuario encontrado");
  console.log("- Activo:", user[0].activo);
  console.log("- Role:", user[0].role);
  console.log("- Tiene password:", !!user[0].passwordHash);
  console.log("- Primer ingreso:", user[0].primerIngreso);
} else {
  console.log("\n❌ Usuario NO encontrado");
}
