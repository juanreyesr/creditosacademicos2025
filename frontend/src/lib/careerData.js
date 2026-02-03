export const CAREER_DATA = {
  psicologia_clinica: {
    name: 'Psicología Clínica y Consejería Social',
    plan: 'Plan Sábado',
    duration: '5 años',
    prices: {
      inscription: 'Q.500.00',
      monthly: 'Q.660.00',
      card: 'Q.100.00',
      piaa: 'Q.0.00 (Gratuito)'
    },
    campus: 'Campus Chimaltenango',
    field: 'Hospitales, clínicas privadas, instituciones educativas, programas de prevención, centros de rehabilitación, consultorios psicológicos, proyectos sociales, atención clínica, consejería social y programas de apoyo comunitario.',
    description: 'Carrera enfocada en la formación de profesionales capacitados para brindar atención psicológica clínica y consejería social en diversos contextos.'
  },
  licenciatura_psicologicas: {
    name: 'Licenciatura en Ciencias Psicológicas',
    plan: 'Plan Diario',
    duration: '4 años',
    prices: {
      inscription: 'Q.500.00',
      monthly: 'Q.570.00',
      card: 'Q.100.00',
      piaa: 'Q.0.00 (Gratuito)'
    },
    campus: 'Campus Chimaltenango',
    field: 'Investigación, docencia, consultoría organizacional, recursos humanos, desarrollo comunitario y atención psicológica general.',
    description: 'Carrera de 4 años en modalidad diaria que forma profesionales en ciencias psicológicas con enfoque integral.'
  }
};

const INSCRIPCIONES_URL = 'https://inscripciones.upana.edu.gt';

export const buildMessageForLead = (lead, messageType) => {
  const careerKey = lead.career_interest === 'sin_definir' ? null : lead.career_interest;
  const career = CAREER_DATA[careerKey];
  const careerName = career?.name || 'la Universidad Panamericana';

  if (messageType === 'email') {
    const subject = `Información sobre ${career?.name || 'UPANA'} - UPANA`;
    const message = `Estimado/a ${lead.name},

¡Gracias por tu interés en ${career?.name || 'la Universidad Panamericana'} en la Universidad Panamericana, Campus Chimaltenango!

Nos complace compartir contigo la siguiente información:

📚 Modalidad: ${career?.plan || 'Por definir'}
⏱️ Duración: ${career?.duration || 'Por definir'}
📍 Campus: ${career?.campus || 'Campus Chimaltenango'}

💰 Costos:
- Inscripción: ${career?.prices?.inscription || 'Por definir'}
- Mensualidad: ${career?.prices?.monthly || 'Por definir'}
- Carné: ${career?.prices?.card || 'Por definir'}
- PIAA: ${career?.prices?.piaa || 'Por definir'}

🎯 Campo Laboral:
${career?.field || 'Por definir'}

✨ Beneficios del Campus Chimaltenango:
- Edificio propio
- Parque gratuito para estudiantes
- Seguridad 24 horas
- Laboratorios disponibles todo el tiempo

📞 Para más información:
- Teléfono: 78394716
- WhatsApp: 41850352
- Inscripciones: ${INSCRIPCIONES_URL}

¡Esperamos verte pronto en UPANA!

Saludos cordiales,
Coordinación de Psicología
Universidad Panamericana`;
    return { subject, message };
  }

  if (messageType === 'whatsapp') {
    const message = `Hola ${lead.name}! 👋

Gracias por tu interés en ${careerName} 🎓

📌 *Información clave:*
• Modalidad: ${career?.plan || 'Por definir'}
• Duración: ${career?.duration || 'Por definir'}
• Inscripción: ${career?.prices?.inscription || 'Por definir'}
• Mensualidad: ${career?.prices?.monthly || 'Por definir'}

✨ Campus Chimaltenango: Edificio propio, seguridad 24/7, laboratorios disponibles

¿Te gustaría más información? Contáctame! 📱

🌐 Inscripciones: ${INSCRIPCIONES_URL}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/50241850352?text=${encodedMessage}`;
    return { message, whatsappLink };
  }

  throw new Error('Tipo de mensaje no válido');
};
