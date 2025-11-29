import { getDb } from "./server/db";
import { agremiados } from "./drizzle/schema";
import { hashPassword } from "./server/auth";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  console.log("🔧 Creando usuario superadministrador...");

  /*
   * Leer las credenciales del superadministrador desde variables de entorno.
   * De esta manera no exponemos contraseñas en el código fuente. Asegúrate
   * de definir INIT_ADMIN_COLEGIADO e INIT_ADMIN_PASSWORD en tu archivo
   * .env o .env.local antes de ejecutar este script. Consulta
   * `.env.example` para más detalles.
   */
  const numeroColegiado = process.env.INIT_ADMIN_COLEGIADO;
  const password = process.env.INIT_ADMIN_PASSWORD;

  if (!numeroColegiado || !password) {
    console.error(
      "❌ Faltan las variables INIT_ADMIN_COLEGIADO e INIT_ADMIN_PASSWORD en el entorno."
    );
    console.error(
      "Define estas variables en tu archivo .env antes de ejecutar este script."
    );
    return;
  }

  // Verificar si el agremiado ya existe en la base de datos.
  const existing = await db
    .select()
    .from(agremiados)
    .where(eq(agremiados.numeroColegiado, numeroColegiado))
    .limit(1);

  if (existing.length > 0) {
    console.log(
      "⚠️  Usuario ya existe. No se modificará la contraseña por seguridad."
    );
    console.log(
      `ℹ️  Para cambiar la contraseña, actualízala manualmente en la base de datos.`
    );
    return;
  }

  console.log("➕ Creando nuevo usuario superadministrador...");

  const passwordHash = await hashPassword(password);

  await db.insert(agremiados).values({
    numeroColegiado,
    nombreCompleto: "Super Administrador",
    email: "admin@example.com",
    telefono: null,
    especialidad: null,
    activo: true,
    role: "superadministrador",
    passwordHash,
    primerIngreso: false,
  });

  console.log("✅ Usuario superadministrador creado exitosamente.");

  console.log("\n📝 Credenciales de acceso inicial:");
  console.log(`   Número de Colegiado: ${numeroColegiado}`);
  console.log(
    `   Contraseña: la definida en la variable INIT_ADMIN_PASSWORD (cámbiala después de iniciar sesión)`
  );
}

createAdmin().catch((err) => {
  console.error("❌ Error al crear el superadministrador:", err);
});
