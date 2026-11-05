import type { ParkConfig } from '../types';

export const DEFAULT_PARK_CONFIG: ParkConfig = {
  updatedAt: new Date().toISOString(),
  pitBikePackages: [
    {
      id: 'pitbike-10',
      durationMinutes: 10,
      label: '10 minutos',
      price: 45000,
      description: 'Ideal para tu primer contacto con la pista, inducción de 10 min incluida + 10 min de conducción pura.',
      badge: 'INICIACIÓN',
      active: true,
    },
    {
      id: 'pitbike-15',
      durationMinutes: 15,
      label: '15 minutos',
      price: 60000,
      description: 'El balance perfecto para calentar, tomar confianza en las curvas y disfrutar la adrenalina.',
      badge: 'MÁS POPULAR',
      active: true,
    },
    {
      id: 'pitbike-20',
      durationMinutes: 20,
      label: '20 minutos',
      price: 90000,
      description: 'Sesión extendida para dominar el trazado, mejorar tu técnica y vivir la emoción a fondo.',
      badge: 'ADRENALINA PRO',
      active: true,
    },
    {
      id: 'pitbike-30',
      durationMinutes: 30,
      label: '30 minutos',
      price: 100000,
      description: 'Experiencia máxima en pista. Media hora de conducción más inducción inicial de 10 minutos.',
      badge: 'MEJOR VALOR',
      active: true,
    },
  ],
  freePractice: {
    price: 50000,
    maxDailySlots: 25,
    active: true,
    tracks: ['Pista de motocross (MX)', 'Pista de enduro'],
    description:
      'Si ya practicas motocross o enduro y cuentas con tu propia motocicleta, disfruta durante todo el día de nuestras pistas y vive una jornada de entrenamiento, diversión y adrenalina.',
  },
  privateEvents: {
    weekdayPrice: 2500000,
    weekendHolidayPrice: 3500000,
    blocksEntireDay: true,
    active: true,
    idealFor: [
      'Activaciones de marca y lanzamientos comerciales.',
      'Eventos empresariales y actividades para empleados.',
      'Inauguraciones de motocicletas y vehículos.',
      'Experiencias para clientes y concesionarios.',
      'Encuentros privados con amigos y comunidades.',
      'Eventos especiales de motocross y off-road.',
    ],
  },
  schedule: {
    pitBikeCapacityPerHour: 5,
    weekdayHours: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    weekendHolidayHours: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    mondayOpen: false,
    weekdayScheduleLabel: '8:00 a. m. – 5:00 p. m.',
    weekendScheduleLabel: '9:00 a. m. – 6:00 p. m.',
    holidays: [
      '2026-01-01',
      '2026-01-12',
      '2026-03-23',
      '2026-04-02',
      '2026-04-03',
      '2026-05-01',
      '2026-05-18',
      '2026-06-08',
      '2026-06-15',
      '2026-06-29',
      '2026-07-20',
      '2026-08-07',
      '2026-08-17',
      '2026-10-12',
      '2026-11-02',
      '2026-11-16',
      '2026-12-08',
      '2026-12-25',
    ],
    blockedDates: [],
    blockedSlots: {},
  },
  paymentInfo: {
    whatsappNumber: '3208504410',
    whatsappDisplay: '320 850 4410',
    nequi: {
      enabled: true,
      number: '3208504410',
      holderName: 'GREEN X PARK',
    },
    daviplata: {
      enabled: true,
      number: '3208504410',
      holderName: 'GREEN X PARK',
    },
    bankAccount: {
      enabled: false,
      bank: 'Bancolombia',
      accountType: 'Ahorros',
      accountNumber: '',
      holderName: 'GREEN X PARK',
      document: '',
    },
    breB: {
      enabled: false,
      key: '',
      holderName: 'GREEN X PARK',
    },
  },
  legalTexts: {
    modalTitle: 'Autorización de Tratamiento de Datos Personales y Exoneración de Responsabilidad',
    arrivalNoticeText:
      'La inducción inicial de 10 minutos está incluida en el servicio. Debes llegar 30 minutos antes de la hora de tu reserva para realizar el proceso de inducción y preparación.',
    dataTreatmentText: `1. AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES (LEY 1581 DE 2012)
Al realizar esta reserva en GREEN X PARK EXTREME SPORTS, autorizo de manera libre, previa, expresa e informada el tratamiento de mis datos personales (y los de los acompañantes o menores de edad bajo mi representación legal) con la finalidad de:
• Gestionar la programación, confirmación, facturación y control de acceso de las reservas en pista.
• Contactarme vía WhatsApp, llamada telefónica o correo electrónico para notificaciones operativas, cambios de horario por condiciones climáticas o soporte al cliente.
• Capturar y utilizar registros fotográficos o audiovisuales tomados durante la experiencia recreativa en las instalaciones de GREEN X PARK con fines informativos, de seguridad o promocionales en redes sociales oficiales.
• Dar cumplimiento a obligaciones legales, contables y de seguridad deportiva.

El titular de los datos podrá ejercer en cualquier momento sus derechos de conocer, actualizar, rectificar y suprimir su información escribiendo a nuestro canal oficial de atención (+57 320 850 4410).`,
    waiverText: `2. DECLARACIÓN DE ASUNCIÓN DE RIESGOS Y EXONERACIÓN DE RESPONSABILIDAD
Declaro que comprendo y acepto que la conducción de motocicletas (Pit Bikes, Motocross y Enduro) es una actividad recreativa y deportiva a motor que conlleva riesgos inherentes de caídas, colisiones, lesiones físicas o daños materiales. En consecuencia, manifiesto que:
• Participo (o autorizo la participación de los menores a mi cargo) de manera voluntaria y bajo mi propia responsabilidad, encontrándome en óptimas condiciones físicas y mentales, y sin estar bajo el efecto de alcohol, sustancias psicoactivas o medicamentos que comprometan mis reflejos.
• Me comprometo a asistir puntualmente 30 minutos antes de la hora reservada para recibir la inducción obligatoria de 10 minutos y acatar en todo momento las instrucciones del personal e instructores de GREEN X PARK.
• Me obligo a portar correctamente durante todo el tiempo en pista los elementos de protección y seguridad indicados, así como a respetar el sentido de la pista y las normas de convivencia deportiva.
• Exonero de toda responsabilidad civil, contractual o extracontractual a GREEN X PARK, sus propietarios, operadores, instructores y colaboradores por cualquier incidente o lesión derivada de la práctica deportiva, imprudencia, desacato a las normas de la pista o fuerza mayor.
• Me hago responsable por el uso adecuado de la motocicleta asignada y me comprometo a informar de inmediato cualquier novedad mecánica o de pista al personal encargado.`,
  },
};

