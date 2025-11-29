import * as XLSX from "xlsx";
import { InsertAgremiado } from "../drizzle/schema";
import { hashPassword, generateRandomPassword } from "./auth";

export interface ExcelRow {
  numeroColegiado: string;
  nombreCompleto: string;
  email: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ImportResult {
  valid: ExcelRow[];
  errors: ValidationError[];
  duplicates: string[];
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate numero de colegiado format
 */
function isValidNumeroColegiado(numero: string): boolean {
  // Allow alphanumeric and some special characters
  return Boolean(numero && numero.trim().length > 0 && numero.trim().length <= 50);
}

/**
 * Parse Excel file and validate data
 */
export function parseExcelFile(buffer: Buffer): ImportResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { 
    header: 1,
    defval: "" as any,
  });

  if (rawData.length < 2) {
    throw new Error("El archivo Excel debe contener al menos una fila de encabezados y una fila de datos");
  }

  const headers = rawData[0] as string[];
  const dataRows = rawData.slice(1);

  // Find column indices (case-insensitive and flexible)
  const findColumnIndex = (possibleNames: string[]): number => {
    return headers.findIndex(h => 
      possibleNames.some(name => 
        h.toString().toLowerCase().includes(name.toLowerCase())
      )
    );
  };

  const colNumeroColegiado = findColumnIndex(["numero", "colegiado", "número", "no."]);
  const colNombreCompleto = findColumnIndex(["nombre", "completo", "apellido"]);
  const colEmail = findColumnIndex(["email", "correo", "e-mail", "mail"]);

  if (colNumeroColegiado === -1 || colNombreCompleto === -1 || colEmail === -1) {
    throw new Error(
      "El archivo Excel debe contener las columnas: 'Numero Colegiado', 'Nombre Completo' y 'Email'. " +
      "Columnas encontradas: " + headers.join(", ")
    );
  }

  const valid: ExcelRow[] = [];
  const errors: ValidationError[] = [];
  const seenNumeroColegiado = new Set<string>();
  const seenEmails = new Set<string>();
  const duplicates: string[] = [];

  dataRows.forEach((row: any[], index: number) => {
    const rowNumber = index + 2; // +2 because of header and 0-based index

    const numeroColegiado = row[colNumeroColegiado]?.toString().trim() || "";
    const nombreCompleto = row[colNombreCompleto]?.toString().trim() || "";
    const email = row[colEmail]?.toString().trim().toLowerCase() || "";

    // Skip empty rows
    if (!numeroColegiado && !nombreCompleto && !email) {
      return;
    }

    // Validate numero de colegiado
    if (!isValidNumeroColegiado(numeroColegiado)) {
      errors.push({
        row: rowNumber,
        field: "numeroColegiado",
        message: "Número de colegiado inválido o vacío",
        value: numeroColegiado,
      });
    }

    // Validate nombre completo
    if (!nombreCompleto || nombreCompleto.length < 3) {
      errors.push({
        row: rowNumber,
        field: "nombreCompleto",
        message: "Nombre completo inválido o muy corto",
        value: nombreCompleto,
      });
    }

    // Validate email
    if (!isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        message: "Formato de correo electrónico inválido",
        value: email,
      });
    }

    // Check for duplicates within the file
    if (seenNumeroColegiado.has(numeroColegiado)) {
      duplicates.push(`Fila ${rowNumber}: Número de colegiado duplicado: ${numeroColegiado}`);
    } else {
      seenNumeroColegiado.add(numeroColegiado);
    }

    if (seenEmails.has(email)) {
      duplicates.push(`Fila ${rowNumber}: Email duplicado: ${email}`);
    } else {
      seenEmails.add(email);
    }

    // If no errors for this row, add to valid
    const rowHasErrors = errors.some(e => e.row === rowNumber);
    if (!rowHasErrors && isValidNumeroColegiado(numeroColegiado) && isValidEmail(email)) {
      valid.push({
        numeroColegiado,
        nombreCompleto,
        email,
      });
    }
  });

  return {
    valid,
    errors,
    duplicates,
  };
}

/**
 * Convert validated Excel rows to Agremiado insert data
 */
export async function convertToAgremiadosData(
  rows: ExcelRow[],
  generatePasswords: boolean = true
): Promise<InsertAgremiado[]> {
  const agremiadosData: InsertAgremiado[] = [];

  for (const row of rows) {
    const password = generatePasswords ? generateRandomPassword() : undefined;
    const passwordHash = password ? await hashPassword(password) : undefined;

    agremiadosData.push({
      numeroColegiado: row.numeroColegiado,
      nombreCompleto: row.nombreCompleto,
      email: row.email,
      passwordHash: passwordHash || null,
      primerIngreso: true,
      activo: true,
      role: "agremiado",
    });
  }

  return agremiadosData;
}

/**
 * Generate Excel template for importing agremiados
 */
export function generateExcelTemplate(): Buffer {
  const data = [
    ["Numero Colegiado", "Nombre Completo", "Email"],
    ["12345", "Juan Pérez García", "juan.perez@example.com"],
    ["67890", "María López Hernández", "maria.lopez@example.com"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Agremiados");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
