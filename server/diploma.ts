import QRCode from "qrcode";
import { generateVerificationCode } from "./auth";

/**
 * Generate QR code as base64 string
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("[QR] Error generating QR code:", error);
    throw error;
  }
}

/**
 * Generate verification URL for diploma
 */
export function generateVerificationUrl(codigoVerificacion: string): string {
  const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
  return `${baseUrl}/verificar-diploma/${codigoVerificacion}`;
}

/**
 * Generate diploma data
 */
export async function generateDiplomaData(params: {
  nombreCompleto: string;
  cursoTitulo: string;
  tipo: "participacion" | "aprobacion";
  fechaEmision: Date;
}): Promise<{
  codigoVerificacion: string;
  codigoQR: string;
  verificationUrl: string;
}> {
  const codigoVerificacion = generateVerificationCode();
  const verificationUrl = generateVerificationUrl(codigoVerificacion);
  const codigoQR = await generateQRCode(verificationUrl);

  return {
    codigoVerificacion,
    codigoQR,
    verificationUrl,
  };
}

/**
 * Generate diploma HTML template
 */
export function generateDiplomaHTML(params: {
  nombreCompleto: string;
  cursoTitulo: string;
  tipo: "participacion" | "aprobacion";
  fechaEmision: Date;
  codigoVerificacion: string;
  codigoQR: string;
  logoUrl?: string;
}): string {
  const fechaFormateada = params.fechaEmision.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tipoDiploma = params.tipo === "aprobacion" ? "Diploma de Aprobación" : "Certificado de Participación";
  const textoReconocimiento = params.tipo === "aprobacion" 
    ? "por haber aprobado satisfactoriamente el curso"
    : "por su participación en el curso";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tipoDiploma}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      width: 297mm;
      height: 210mm;
      background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20mm;
    }
    
    .diploma {
      width: 100%;
      height: 100%;
      border: 8px solid #2B2E5F;
      border-radius: 10px;
      padding: 30px;
      background: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .border-inner {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #D91C7A;
      border-radius: 5px;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 15px;
    }
    
    .institution {
      font-size: 28px;
      color: #2B2E5F;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .diploma-type {
      font-size: 36px;
      color: #D91C7A;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 20px 0;
    }
    
    .content {
      text-align: center;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 20px 0;
    }
    
    .otorga {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    
    .recipient-name {
      font-size: 42px;
      color: #2B2E5F;
      font-weight: bold;
      margin: 20px 0;
      border-bottom: 3px solid #D91C7A;
      display: inline-block;
      padding: 10px 40px;
    }
    
    .recognition {
      font-size: 18px;
      color: #333;
      margin: 20px 0;
      line-height: 1.6;
    }
    
    .course-title {
      font-size: 28px;
      color: #D91C7A;
      font-weight: bold;
      margin: 15px 0;
      font-style: italic;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
    }
    
    .date-section {
      text-align: left;
    }
    
    .date-label {
      font-size: 14px;
      color: #666;
    }
    
    .date-value {
      font-size: 16px;
      color: #2B2E5F;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .qr-section {
      text-align: center;
    }
    
    .qr-code {
      width: 100px;
      height: 100px;
      margin-bottom: 5px;
    }
    
    .verification-code {
      font-size: 11px;
      color: #666;
      font-family: 'Courier New', monospace;
    }
    
    .signatures {
      text-align: right;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      width: 200px;
      margin: 0 0 5px auto;
      padding-top: 5px;
    }
    
    .signature-name {
      font-size: 14px;
      color: #2B2E5F;
      font-weight: bold;
    }
    
    .signature-title {
      font-size: 12px;
      color: #666;
    }
    
    .decorative-corner {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid #F5A623;
    }
    
    .corner-tl {
      top: 25px;
      left: 25px;
      border-right: none;
      border-bottom: none;
    }
    
    .corner-tr {
      top: 25px;
      right: 25px;
      border-left: none;
      border-bottom: none;
    }
    
    .corner-bl {
      bottom: 25px;
      left: 25px;
      border-right: none;
      border-top: none;
    }
    
    .corner-br {
      bottom: 25px;
      right: 25px;
      border-left: none;
      border-top: none;
    }
  </style>
</head>
<body>
  <div class="diploma">
    <div class="border-inner"></div>
    <div class="decorative-corner corner-tl"></div>
    <div class="decorative-corner corner-tr"></div>
    <div class="decorative-corner corner-bl"></div>
    <div class="decorative-corner corner-br"></div>
    
    <div class="header">
      ${params.logoUrl ? `<img src="${params.logoUrl}" alt="Logo" class="logo">` : ''}
      <div class="institution">Colegio de Psicólogos de Guatemala</div>
      <div class="subtitle">Aula Virtual de Capacitación Continua</div>
      <div class="diploma-type">${tipoDiploma}</div>
    </div>
    
    <div class="content">
      <div class="otorga">Otorga el presente reconocimiento a:</div>
      <div class="recipient-name">${params.nombreCompleto}</div>
      <div class="recognition">
        ${textoReconocimiento}
      </div>
      <div class="course-title">"${params.cursoTitulo}"</div>
    </div>
    
    <div class="footer">
      <div class="date-section">
        <div class="date-label">Fecha de emisión:</div>
        <div class="date-value">${fechaFormateada}</div>
      </div>
      
      <div class="qr-section">
        <img src="${params.codigoQR}" alt="QR Code" class="qr-code">
        <div class="verification-code">Código: ${params.codigoVerificacion}</div>
      </div>
      
      <div class="signatures">
        <div class="signature-line">
          <div class="signature-name">Junta Directiva</div>
          <div class="signature-title">Colegio de Psicólogos de Guatemala</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
