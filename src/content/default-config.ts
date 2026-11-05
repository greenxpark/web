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
    weekdayHours: [
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
    ],
    weekendHolidayHours: [
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
    ],
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
    modalTitle: 'Carta de Compromiso Usuario, Exoneración de Responsabilidad y Convenio de Prácticas',
    arrivalNoticeText:
      'La inducción inicial de 10 minutos está incluida en el servicio. Debes llegar 30 minutos antes de la hora de tu reserva para realizar el proceso de inducción y preparación.',
    dataTreatmentText: `1. AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES (LEY 1581 DE 2012)
Al diligenciar este formulario y realizar la reserva en GREEN X PARK EXTREME SPORTS, autorizo de manera libre, previa, expresa e informada el tratamiento de mis datos personales (y los de los menores bajo mi representación legal) para:
• Gestión, programación, confirmación, facturación y control de acceso a las pistas e instalaciones.
• Contacto vía WhatsApp, llamada o email para novedades operativas, clima, reprogramación o soporte.
• Registro fotográfico o audiovisual con fines deportivos, de seguridad o informativos en canales oficiales.
• Atención de emergencias médicas o reporte a las entidades promotoras de salud (EPS) y centros asistenciales.
El titular puede ejercer sus derechos de consulta, actualización o rectificación al canal oficial (+57 320 850 4410).`,
    waiverText: `2. PISTA DE MOTOCROSS GREEN X PARK — CARTA DE COMPROMISO USUARIO (DECLARACIÓN JURADA)

DECLARO:
1. Participación voluntaria: Que acepto voluntariamente la responsabilidad de pilotear y/o conducir una motocicleta y/o vehículo motorizado en la PISTA DE MOTOCROSS GREEN X PARK, manifestando mi plena capacidad para otorgar el presente consentimiento.
2. Riesgo actividad: Que tengo conocimiento y estoy familiarizado con los riesgos, daños, peligros y azares generados por pilotear y/o conducir una motocicleta y/o vehículo motorizado en la PISTA DE MOTOCROSS GREEN X PARK asumiendo que tomaré parte en una actividad peligrosa y de alto riesgo. Participo en cualquiera de estas actividades de manera voluntaria y con pleno conocimiento del peligro que conlleva, y acepto todos y cada uno de los peligros que se desprenden de las mismas y así verifico esta afirmación aceptando el presente documento.
3. Formación y capacidad: Tengo la formación, experiencia, pericia, entrenamiento adecuado y poseo todas las licencias y seguros de accidente y de responsabilidad civil o certificaciones requeridas, estando en perfecto estado físico y psíquico y no estoy afectado por enfermedad o trastorno alguno.
4. Prudencia y responsabilidad: Me comprometo a adoptar las medidas que la prudencia aconseja para evitar daños propios o ajenos a personas y bienes derivados de mi participación en la PISTA DE MOTOCROSS GREEN X PARK, con especial atención a los riesgos que ello comporta y de los cuales tengo pleno conocimiento. Me comprometo a firmar el comunicado de accidente si fuese necesario.
5. Conservación instalaciones pista: Me comprometo a conservar en perfecto estado las instalaciones de la pista, y a detenerme, y avisar a la dirección de cualquier daño, anomalía y/o a cualquier otro usuario de la pista.
6. Uso estrictamente personal: Asumo que este documento es personal e intransferible. Quedando expresamente prohibido ceder el uso de mi vehículo a cualquier otra persona, así como llevar pasajeros en el interior de la pista o perímetro de la finca.
7. Prohibición conducción bajo síntomas de alcohol o estupefacientes: En caso de presentar síntomas de ingestión de alcohol y/o sustancias estupefacientes por mi seguridad y la del resto de pilotos, usuarios y/o empleados de la pista se me puede denegar el acceso a la misma.
8. Descargo de responsabilidad: En el nombre propio de la presente exonero y libero a la PISTA DE MOTOCROSS GREEN X PARK a los dueños, administradores y empleados de todo tipo de demandas, reclamaciones, acciones, obligaciones o responsabilidades de cualquier índole, por daños a la propiedad o lesiones personales incluido el fallecimiento. Que como usuario pueda incurrir a causa de mi actuación o participación de las actividades y prestaciones de la pista de motocross, y acuerdo además no reclamar o indemnizar a las partes reveladas por las reclamaciones que surjan por mi participación en las actividades practicadas en la PISTA DE MOTOCROSS GREEN X PARK.
9. Conocimiento y aceptación: He leído detenidamente este acuerdo y comprendo completamente su contenido. Tengo conocimiento de que este acuerdo es una exoneración o liberación de responsabilidad de todas las reclamaciones e indemnizaciones y un compromiso entre mi persona y la PISTA DE MOTOCROSS GREEN X PARK y/o sus empleados y/o cualquier persona que preste sus servicios a la misma. Y así lo manifiesto aceptando a continuación como piloto, participante o tutor.

ADVERTENCIAS CONTRACTUALES VINCULANTES:
• SI DURANTE LA CONDUCCIÓN DEL PILOTO Y/O PRACTICANTE, ESTE GENERA UN GOLPE FUERTE A LA MOTOCICLETA Y/O VEHÍCULO MOTORIZADO PERTENECIENTE A LA PISTA DE MOTOCROSS GREEN X PARK, ESTO INCURRIRÁ EN UNA MULTA MONETARIA QUE DEBERÁ SER CANCELADA BAJO INMEDIATEZ.
• SI EL PILOTO Y/O PRACTICANTE REALIZA DE MANERA REITERADA UNA MALA CONDUCCIÓN Y/O USO INADECUADO DE LA MOTOCICLETA Y/O VEHÍCULO MOTORIZADO, EL CUAL BAJO CONSIDERACIÓN DE LOS EMPLEADOS DE LA PISTA DE MOTOCROSS GREEN X PARK PUEDA AFECTAR LA EXPERIENCIA DE OTROS USUARIOS, VISITANTES Y/O PILOTOS Y/O PRACTICANTES O DEL PILOTO Y/O PRACTICANTE MISMO, COMO TAMBIÉN AFECTAR DE MANERA NEGATIVA LA MOTOCICLETA Y/O VEHÍCULO MOTORIZADO PERTENECIENTE A GREEN X PARK, INCURRIRÁ EN LA FINALIZACIÓN DE CUALQUIER SERVICIO QUE LE HAYA SIDO PRESTADO Y PRIVACIÓN DEL USO DEL VEHÍCULO, ACEPTANDO LA NO DEVOLUCIÓN DE NINGUNA SUMA MONETARIA, A CONSIDERACIÓN DE LAS AFECCIONES PROVOCADAS A OTROS Y/O AL VEHÍCULO MOTORIZADO.
• TODO DAÑO EN LA MOTO EN PLÁSTICO Y MECÁNICO SERÁ COBRADO EL 100% - PARA MOTOS 125cc SE DEBE PRESENTAR LICENCIA DE CONDUCCIÓN.
• TODO POR EL BIENESTAR DEL PILOTO Y/O PRACTICANTE. Municipio de Chía, Cundinamarca.`,
    contractConvenioText: `3. CONVENIO PARA PRÁCTICAS LIBRES, PRÁCTICAS OFICIALES Y VÁLIDAS EN LAS INSTALACIONES DEL PARQUE

Entre los suscritos Nelly Rojas O. mayor de edad domiciliada en Bogotá, identificada con C.C. 35.476.506 quien actúa en nombre y representación de GREEN X PARK S.A.S. y de su establecimiento de comercio denominado GREEN X PARK en su calidad de Gerente. Sociedad legalmente constituida con domicilio en Chía debidamente inscrita en la cámara de comercio de Bogotá, quien en adelante se denominará GREEN X PARK, de una parte; y el PILOTO Y/O PRACTICANTE (o su tutor en caso de menores de edad) identificado con los datos consignados en esta reserva, se acuerda:

CONSIDERACIONES:
• Que el PILOTO Y/O PRACTICANTE en forma libre ha decidido participar en las diferentes prácticas libres y oficiales y/o visitas de campeonato y/o competencias y/o entrenamiento para la temporada de deporte a motor en las instalaciones de GREEN X PARK.
• Que GREEN X PARK es propietario de LA PISTA DEL PARQUE EXTREMO y en tales instalaciones cuenta con los sistemas de seguridad requeridos para la realización de este tipo de eventos, de conformidad con los reglamentos de la federación colombiana de motociclismo deportivo y el reglamento particular del club deportivo organizador.
• Que el PILOTO Y/O PRACTICANTE ha realizado una cuidadosa revisión de la totalidad de las instalaciones de la pista, declarando que se encuentra suficiente para la práctica de motocross y manifestando su conformidad al respecto, obligándose a cumplir dichos reglamentos, respetar la totalidad de las señales y acatar las órdenes del personal encargado.
• Que EL PILOTO Y/O PRACTICANTE expresamente declara en forma libre y espontánea que en la fecha está realizando prácticas libres de motocross en la pista de GREEN X PARK, asumiendo todos los riesgos y situaciones que eventualmente puedan presentarse de accidentes, conociendo que en prácticas libres no se cuenta con la totalidad de recursos (como ambulancias y bomberos que solo asisten a competencias oficiales con validas), por lo tanto exonera a GREEN X PARK.
• Que EL PILOTO Y/O PRACTICANTE se compromete y tiene la obligación de utilizar casco y guantes aptos para competencias de motocross durante todo el tiempo en pista.

CLÁUSULAS:
PRIMERO: Toda vez que la decisión de participar se toma libre y espontáneamente, siendo plenamente consciente de los riesgos que implican estas actividades deportivas, asume todo daño personal, médico, quirúrgico, invalidez o fallecimiento, así como daños o pérdidas de bienes y equipos de GREEN X PARK causados por imprudencia o por cualquier otra causa.
SEGUNDO: EL PILOTO Y/O PRACTICANTE se hace responsable por la conducta de los miembros de su equipo, tales como mecánicos, invitados personales, consejeros o acompañantes durante el tiempo en que permanezcan en las instalaciones de GREEN X PARK.
TERCERO: Los mecánicos deberán permanecer estrictamente en el sitio asignado para ellos. Los acompañantes e invitados no podrán acceder a las áreas técnicas, mecánicas ni al trazado de la pista.
CUARTO: Serán de cargo del PILOTO Y/O PRACTICANTE toda responsabilidad por daños tanto materiales como personales y/o del establecimiento, debiendo cancelar a favor de GREEN X PARK o del afectado el 100% del costo de reposición o reparación.
QUINTO: En evento en que alguno de los apartes fuese declarado nulo o ineficaz, el resto del contrato permanecerá vigente y las partes se obligan a su estricto cumplimiento.
SEXTO: Este documento contiene la totalidad de los acuerdos entre las partes y deja sin efecto cualquier comunicación previa verbal o escrita.
SÉPTIMO: Vigencia durante todo el tiempo de permanencia y ejecución del servicio.
OCTAVO: DOMICILIO CONTRACTUAL: Municipio de Chía y Bogotá D.C.
NOVENO: NOTIFICACIONES: nellyospina@hotmail.com | Celular / WhatsApp: 320 850 4410.`,
  },
};

