import Swal from 'sweetalert2';
import { renderFooter } from '../components/footer';
import { initNavbarEvents, renderNavbar } from '../components/navbar';
import type { ParkConfig } from '../types';
import { formatCOP, getNextOpenDateISO } from '../utils/format';
import {
  computeDayAvailability,
  getCachedParkConfigSync,
  loadBookings,
  loadParkConfig,
} from '../utils/storage';

export function initHomePage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const initialConfig = getCachedParkConfigSync();
  renderView(app, initialConfig);

  void (async () => {
    const [freshConfig, bookings] = await Promise.all([
      loadParkConfig({
        onUpdate: (updated) => renderView(app, updated),
      }),
      loadBookings(),
    ]);
    renderView(app, freshConfig, bookings.length);
    updateLiveTelemetryWidget(freshConfig, bookings);
  })();
}

function updateLiveTelemetryWidget(
  config: ParkConfig,
  bookings: Awaited<ReturnType<typeof loadBookings>>
): void {
  const nextDate = getNextOpenDateISO(
    config.schedule.mondayOpen,
    config.schedule.blockedDates,
    config.schedule.holidays
  );
  const avail = computeDayAvailability(nextDate, config, bookings);
  const openSlots = avail.slots.filter((s) => s.isAvailable);
  const totalSpotsLeft = openSlots.reduce((sum, s) => sum + s.availableCount, 0);

  const badgeEl = document.getElementById('live-telemetry-spots');
  const nextSlotEl = document.getElementById('live-telemetry-next-slot');
  if (badgeEl) {
    badgeEl.textContent = `${totalSpotsLeft} cupos disponibles (${nextDate})`;
  }
  if (nextSlotEl) {
    nextSlotEl.textContent = openSlots[0]
      ? `Próximo turno: ${openSlots[0].formattedTime} (${openSlots[0].availableCount} motos libres)`
      : 'Consulta fechas disponibles en el calendario';
  }
}

function renderView(app: HTMLElement, config: ParkConfig, _bookingsCount = 0): void {
  const activePackages = config.pitBikePackages.filter((p) => p.active);

  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-track-grid text-white">
      ${renderNavbar('home')}

      <main class="flex-1">
        <!-- ================= HERO PRINCIPAL ================= -->
        <section class="relative overflow-hidden border-b border-lime-electric/20 pt-10 pb-20 lg:py-24">
          <!-- Efectos diagonales de velocidad inspirados en el logo X -->
          <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div class="absolute -top-28 -right-24 h-[520px] w-[520px] rounded-full bg-lime-electric/10 blur-[130px]"></div>
            <div class="absolute bottom-0 left-1/4 h-[320px] w-[420px] rounded-full bg-lime-racing/10 blur-[110px]"></div>
            <div class="absolute inset-y-0 right-[8%] hidden lg:block w-1 bg-gradient-to-b from-transparent via-lime-electric/25 to-transparent -skew-x-[22deg]"></div>
            <div class="absolute inset-y-0 right-[9.2%] hidden lg:block w-0.5 bg-gradient-to-b from-transparent via-white/15 to-transparent -skew-x-[22deg]"></div>
          </div>

          <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <!-- Columna Izquierda: Copy Oficial GREEN X PARK -->
              <div class="lg:col-span-7 space-y-6">
                <div class="inline-flex items-center gap-3 rounded-full border border-lime-electric/40 bg-lime-electric/10 px-4 py-1.5">
                  <span class="slash-stripes"><span></span><span></span><span></span></span>
                  <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.2em] text-lime-electric">
                    GREEN X PARK • EXTREME SPORTS
                  </span>
                </div>

                <h1 class="font-title text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase italic tracking-tight leading-[1.03] text-white">
                  VIVE EL <span class="text-lime-electric drop-shadow-[0_0_25px_rgba(182,255,0,0.35)]">MOTOCROSS.</span><br />
                  SÉ PARTE DE LA EXPERIENCIA.
                </h1>

                <p class="font-subtitle text-lg sm:text-xl font-semibold text-lime-neon border-l-4 border-lime-electric pl-4 py-1">
                  No necesitas tener moto para vivir la adrenalina.
                </p>

                <p class="font-body text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl">
                  En <strong class="text-white font-semibold">GREEN X PARK</strong> encuentras una experiencia recreativa de motocross para niños, jóvenes y adultos. Disfruta nuestras pistas, conoce el mundo del motociclismo y vive la emoción de conducir una moto en un entorno diseñado para la diversión y la aventura.
                </p>

                <!-- Botones principales -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <a href="./reservar.html" class="btn-x-primary text-sm sm:text-base py-4 px-8">
                    <span>RESERVA TU EXPERIENCIA</span>
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <a href="./servicios.html" class="btn-x-outline text-sm sm:text-base py-4 px-8">
                    <span>CONOCE NUESTROS SERVICIOS</span>
                  </a>
                </div>

                <!-- Indicadores rápidos -->
                <div class="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  <div class="rounded-xl border border-white/10 bg-graphite/40 p-3">
                    <span class="block font-title text-xl sm:text-2xl font-extrabold text-lime-electric">10 MIN</span>
                    <span class="block font-subtitle text-[11px] font-semibold uppercase text-white/70">Inducción Incluida</span>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-graphite/40 p-3">
                    <span class="block font-title text-xl sm:text-2xl font-extrabold text-white">MX & ENDURO</span>
                    <span class="block font-subtitle text-[11px] font-semibold uppercase text-white/70">2 Escenarios Pro</span>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-graphite/40 p-3">
                    <span class="block font-title text-xl sm:text-2xl font-extrabold text-lime-neon">${formatCOP(activePackages[0]?.price ?? 45000)}</span>
                    <span class="block font-subtitle text-[11px] font-semibold uppercase text-white/70">Tarifa Desde</span>
                  </div>
                </div>
              </div>

              <!-- Columna Derecha: Chasis de Telemetría y Acceso Rápido a Reserva -->
              <div class="lg:col-span-5">
                <div class="x-card-featured p-6 sm:p-8 space-y-6">
                  <!-- Logo Oficial Destacado -->
                  <div class="relative overflow-hidden rounded-xl border border-lime-electric/30 bg-black p-6 text-center shadow-inner">
                    <div class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-lime-electric/15 border border-lime-electric/40 px-2.5 py-0.5 text-[10px] font-subtitle font-semibold uppercase text-lime-electric">
                      <span class="h-1.5 w-1.5 rounded-full bg-lime-electric animate-ping"></span>
                      RESERVA ONLINE
                    </div>
                    <img
                      src="./logo-green-x-park.jpeg"
                      alt="Logo Oficial GREEN X PARK"
                      class="mx-auto max-h-36 w-auto object-contain"
                    />
                  </div>

                  <!-- Estado en vivo de la pista -->
                  <div class="space-y-3 rounded-xl border border-white/10 bg-carbon/80 p-4">
                    <div class="flex items-center justify-between">
                      <span class="font-subtitle text-xs font-semibold uppercase tracking-wider text-white/60">
                        TELEMETRÍA DE RESERVAS
                      </span>
                      <span id="live-telemetry-spots" class="font-subtitle text-xs font-semibold text-lime-electric">
                        Cupos por hora: ${config.schedule.pitBikeCapacityPerHour} motos
                      </span>
                    </div>
                    <p id="live-telemetry-next-slot" class="font-title text-sm sm:text-base font-extrabold text-white">
                      Selecciona tu día y aparta tu hora al instante
                    </p>
                  </div>

                  <!-- Mini Tarifario Interactivo -->
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between text-xs font-subtitle font-semibold uppercase tracking-wider text-white/70">
                      <span>Paquetes Pit Bike (+10 min inducción)</span>
                      <span class="text-lime-electric">Reserva directa</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2.5">
                      ${activePackages
                        .slice(0, 4)
                        .map(
                          (pkg) => `
                        <a
                          href="./reservar.html?service=pitbike&package=${encodeURIComponent(pkg.id)}"
                          class="group rounded-xl border border-white/15 bg-carbon/90 p-3 hover:border-lime-electric hover:bg-lime-electric/10 transition-all"
                        >
                          <div class="flex items-center justify-between">
                            <span class="font-subtitle text-xs font-semibold uppercase text-white/80 group-hover:text-white">
                              ${pkg.label}
                            </span>
                            <span class="text-[10px] font-title font-extrabold text-lime-electric">→</span>
                          </div>
                          <p class="font-title text-lg font-extrabold text-lime-electric mt-0.5">
                            ${formatCOP(pkg.price)}
                          </p>
                        </a>
                      `
                        )
                        .join('')}
                    </div>
                  </div>

                  <a href="./reservar.html" class="btn-x-primary w-full justify-center py-3.5 text-sm">
                    APARTAR MI DÍA Y HORA AHORA
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= NUESTRA HISTORIA ================= -->
        <section id="nuestra-historia" class="relative py-20 border-b border-white/10 bg-carbon-deep/80">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
              <!-- Texto íntegro de NUESTRA HISTORIA -->
              <div class="lg:col-span-7 space-y-5">
                <div class="inline-flex items-center gap-2">
                  <span class="slash-stripes"><span></span><span></span><span></span></span>
                  <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.22em] text-lime-electric">
                    NUESTRA HISTORIA
                  </span>
                </div>

                <h2 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic tracking-tight text-white">
                  Pioneros en experiencias recreativas de <span class="text-lime-electric">motocross.</span>
                </h2>

                <div class="space-y-4 font-body text-base sm:text-lg text-white/80 leading-relaxed">
                  <p>
                    <strong class="text-white font-semibold">GREEN X PARK</strong> nace con el propósito de acercar el motocross a todas las personas, convirtiéndolo en una experiencia recreativa, familiar y accesible.
                  </p>
                  <p>
                    Somos una pista pionera en ofrecer experiencias de motocross para niños y adultos, permitiendo que personas sin experiencia previa puedan conocer y disfrutar este deporte.
                  </p>
                  <p>
                    Contamos con alquiler de motocicletas, inducción inicial y acompañamiento para que cada visitante pueda vivir la experiencia de conducir en nuestras instalaciones.
                  </p>
                  <p>
                    Nuestra propuesta es sencilla: tú vienes con las ganas de vivir una nueva aventura y nosotros ponemos las motos, el escenario y la experiencia.
                  </p>
                </div>

                <div class="rounded-2xl border-l-4 border-lime-electric bg-graphite/60 p-5">
                  <p class="font-subtitle text-base sm:text-lg font-semibold text-lime-neon">
                    “En GREEN X PARK, el motocross está al alcance de todos.”
                  </p>
                </div>
              </div>

              <!-- Tarjetas Bento de ADN Green X Park -->
              <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="x-card p-6 sm:col-span-2 border-l-4 border-l-lime-electric">
                  <span class="x-badge-solid mb-3">01 • SIN EXPERIENCIA PREVIA</span>
                  <h3 class="font-subtitle text-lg font-semibold text-white">Para Niños, Jóvenes y Adultos</h3>
                  <p class="mt-2 text-sm text-white/75 leading-relaxed">
                    No necesitas saber manejar moto de cambios ni tener equipo propio. Te guiamos paso a paso desde el primer minuto.
                  </p>
                </div>

                <div class="x-card p-5">
                  <span class="font-title text-3xl font-extrabold text-lime-electric">02</span>
                  <h3 class="font-subtitle text-base font-semibold text-white mt-2">Flota Pit Bikes</h3>
                  <p class="mt-1.5 text-xs text-white/70 leading-relaxed">
                    Motocicletas listas y calibradas para brindarte emoción, control y diversión segura en pista.
                  </p>
                </div>

                <div class="x-card p-5">
                  <span class="font-title text-3xl font-extrabold text-lime-neon">03</span>
                  <h3 class="font-subtitle text-base font-semibold text-white mt-2">Inducción y Pista</h3>
                  <p class="mt-1.5 text-xs text-white/70 leading-relaxed">
                    10 minutos de inducción inicial incluidos en tu paquete + acompañamiento permanente.
                  </p>
                </div>

                <div class="x-card p-6 sm:col-span-2 bg-gradient-to-r from-graphite/90 to-carbon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p class="font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-electric">¿Listo para acelerar?</p>
                    <p class="font-title text-lg font-extrabold text-white">Aparta tu turno en menos de 2 minutos</p>
                  </div>
                  <a href="./reservar.html" class="btn-x-primary text-xs py-2.5 px-5 shrink-0">
                    RESERVAR
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= LAS 3 EXPERIENCIAS GREEN X PARK ================= -->
        <section id="experiencias" class="py-20 border-b border-white/10">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div class="space-y-3">
                <div class="inline-flex items-center gap-2">
                  <span class="slash-stripes"><span></span><span></span><span></span></span>
                  <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.22em] text-lime-electric">
                    NUESTROS SERVICIOS Y MODALIDADES
                  </span>
                </div>
                <h2 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic tracking-tight text-white">
                  ELIGE TU <span class="text-lime-electric">EXPERIENCIA</span> EN PISTA
                </h2>
              </div>
              <a href="./servicios.html" class="btn-x-outline text-xs sm:text-sm py-3 px-6 self-start md:self-auto">
                VER DETALLE COMPLETO DE SERVICIOS
              </a>
            </div>

            <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <!-- Modalidad 1: VIVE LA EXPERIENCIA (Alquiler de Pit Bikes) -->
              <article class="x-card-featured flex flex-col justify-between p-7">
                <div class="space-y-5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="x-badge-solid">ALQUILER DE PIT BIKES</span>
                    <span class="font-subtitle text-xs font-semibold text-lime-neon">Sin moto propia</span>
                  </div>

                  <div>
                    <h3 class="font-title text-2xl sm:text-3xl font-extrabold uppercase italic text-white">
                      VIVE LA EXPERIENCIA
                    </h3>
                    <p class="font-subtitle text-sm font-semibold text-lime-electric mt-1">
                      Tu primera experiencia en motocross comienza aquí.
                    </p>
                  </div>

                  <p class="text-sm text-white/80 leading-relaxed">
                    ¿Nunca has manejado una moto de motocross? ¡No importa! Alquila una motocicleta y disfruta nuestras instalaciones sin experiencia previa.
                  </p>

                  <ul class="space-y-2 text-sm text-white/85">
                    <li class="flex items-center gap-2">
                      <span class="text-lime-electric font-bold">✓</span> Alquiler de motocicleta.
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="text-lime-electric font-bold">✓</span> Inducción inicial de 10 minutos.
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="text-lime-electric font-bold">✓</span> Orientación para el uso de la pista.
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="text-lime-electric font-bold">✓</span> Tiempo de conducción según paquete.
                    </li>
                  </ul>

                  <!-- Tabla compacta de tarifas -->
                  <div class="rounded-xl border border-white/10 bg-carbon/90 overflow-hidden">
                    <div class="bg-graphite/80 px-4 py-2 flex justify-between font-subtitle text-xs font-semibold uppercase text-lime-electric">
                      <span>Tiempo de conducción</span>
                      <span>Precio</span>
                    </div>
                    <div class="divide-y divide-white/10 text-sm">
                      ${activePackages
                        .map(
                          (pkg) => `
                        <div class="px-4 py-2.5 flex items-center justify-between hover:bg-white/5">
                          <span class="font-subtitle font-medium text-white">${pkg.label}</span>
                          <span class="font-title font-extrabold text-lime-electric">${formatCOP(pkg.price)}</span>
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  </div>

                  <div class="rounded-xl border border-lime-electric/30 bg-lime-electric/10 p-3 text-xs text-white/90 space-y-1">
                    <p class="font-subtitle font-semibold text-lime-electric uppercase">IMPORTANTE:</p>
                    <p>• La inducción inicial de 10 minutos está incluida en el servicio.</p>
                    <p>• Debes llegar 30 minutos antes de la hora de tu reserva para realizar el proceso de inducción y preparación.</p>
                  </div>
                </div>

                <div class="pt-6 mt-6 border-t border-white/10">
                  <a href="./reservar.html?service=pitbike" class="btn-x-primary w-full justify-center text-sm py-3.5">
                    RESERVAR MI EXPERIENCIA
                  </a>
                </div>
              </article>

              <!-- Modalidad 2: PRÁCTICA LIBRE -->
              <article class="x-card flex flex-col justify-between p-7">
                <div class="space-y-5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="x-badge">MOTO PROPIA</span>
                    <span class="font-subtitle text-xs font-semibold text-white/60">Todo el día</span>
                  </div>

                  <div>
                    <h3 class="font-title text-2xl sm:text-3xl font-extrabold uppercase italic text-white">
                      PRÁCTICA LIBRE
                    </h3>
                    <p class="font-subtitle text-sm font-semibold text-lime-electric mt-1">
                      ¿Tienes moto propia? ¡La pista te espera!
                    </p>
                  </div>

                  <p class="text-sm text-white/80 leading-relaxed">
                    Si ya practicas motocross o enduro y cuentas con tu propia motocicleta, puedes disfrutar de nuestras instalaciones pagando el derecho a pista.
                  </p>

                  <div class="space-y-2">
                    <p class="font-subtitle text-xs font-semibold uppercase tracking-wider text-white/70">
                      Dos escenarios para poner a prueba tus habilidades:
                    </p>
                    <ul class="space-y-2 text-sm text-white/90">
                      ${config.freePractice.tracks
                        .map(
                          (track) => `
                        <li class="flex items-center gap-2.5 rounded-lg border border-white/10 bg-carbon/70 px-3.5 py-2.5">
                          <span class="h-2 w-2 rounded-full bg-lime-electric"></span>
                          <span class="font-subtitle font-semibold">${track}</span>
                        </li>
                      `
                        )
                        .join('')}
                    </ul>
                  </div>

                  <div class="rounded-xl border border-lime-electric/40 bg-carbon/90 p-5 text-center">
                    <span class="block font-subtitle text-xs font-semibold uppercase tracking-widest text-white/70">
                      DERECHO A PISTA
                    </span>
                    <span class="block font-title text-4xl font-extrabold text-lime-electric mt-1">
                      ${formatCOP(config.freePractice.price)}
                    </span>
                    <span class="block text-xs text-white/70 mt-2">
                      Disfruta durante todo el día de nuestras pistas y vive una jornada de entrenamiento, diversión y adrenalina.
                    </span>
                  </div>
                </div>

                <div class="pt-6 mt-6 border-t border-white/10">
                  <a href="./reservar.html?service=practica_libre" class="btn-x-outline w-full justify-center text-sm py-3.5">
                    CONSULTAR DISPONIBILIDAD Y RESERVAR
                  </a>
                </div>
              </article>

              <!-- Modalidad 3: EVENTOS PRIVADOS Y ALQUILER DE ESCENARIO -->
              <article class="x-card flex flex-col justify-between p-7">
                <div class="space-y-5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="x-badge">CORPORATIVO Y GRUPOS</span>
                    <span class="font-subtitle text-xs font-semibold text-white/60">Escenario exclusivo</span>
                  </div>

                  <div>
                    <h3 class="font-title text-2xl sm:text-3xl font-extrabold uppercase italic text-white">
                      EVENTOS PRIVADOS Y ALQUILER DE ESCENARIO
                    </h3>
                    <p class="font-subtitle text-sm font-semibold text-lime-electric mt-1">
                      Tu marca. Tu evento. Nuestra adrenalina.
                    </p>
                  </div>

                  <p class="text-sm text-white/80 leading-relaxed">
                    ¿Quieres organizar una experiencia diferente para tus clientes, colaboradores o invitados? Ponemos a tu disposición nuestro escenario para eventos privados y actividades empresariales.
                  </p>

                  <div class="space-y-1.5">
                    <p class="font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-neon">
                      Ideal para:
                    </p>
                    <ul class="space-y-1.5 text-xs sm:text-sm text-white/80">
                      ${config.privateEvents.idealFor
                        .map(
                          (item) => `
                        <li class="flex items-start gap-2">
                          <span class="text-lime-electric font-bold">▸</span>
                          <span>${item}</span>
                        </li>
                      `
                        )
                        .join('')}
                    </ul>
                  </div>

                  <div class="grid grid-cols-1 gap-2.5 rounded-xl border border-white/10 bg-carbon/90 p-4">
                    <p class="font-subtitle text-xs font-semibold uppercase text-lime-electric">
                      TARIFAS DE ALQUILER
                    </p>
                    <div class="flex items-center justify-between border-b border-white/10 pb-2">
                      <span class="text-xs text-white/75 font-subtitle">Entre semana:</span>
                      <span class="font-title text-lg font-extrabold text-white">${formatCOP(config.privateEvents.weekdayPrice)}</span>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                      <span class="text-xs text-white/75 font-subtitle">Fines de semana y festivos:</span>
                      <span class="font-title text-lg font-extrabold text-lime-electric">${formatCOP(config.privateEvents.weekendHolidayPrice)}</span>
                    </div>
                  </div>
                </div>

                <div class="pt-6 mt-6 border-t border-white/10">
                  <a href="./reservar.html?service=evento_privado" class="btn-x-outline w-full justify-center text-sm py-3.5">
                    RESERVAR / COTIZAR MI EVENTO
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- ================= HORARIOS DE ATENCIÓN Y RESERVA ================= -->
        <section id="horarios" class="py-20 bg-carbon-deep/90">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-10 lg:grid-cols-12 items-stretch">
              <!-- Columna Horarios de Atención -->
              <div class="lg:col-span-5 x-card p-8 flex flex-col justify-between">
                <div class="space-y-6">
                  <div class="inline-flex items-center gap-2">
                    <span class="slash-stripes"><span></span><span></span><span></span></span>
                    <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.2em] text-lime-electric">
                      CRONOGRAMA SEMANAL
                    </span>
                  </div>

                  <h2 class="font-title text-3xl sm:text-4xl font-extrabold uppercase italic text-white">
                    HORARIOS DE <span class="text-lime-electric">ATENCIÓN</span>
                  </h2>

                  <div class="space-y-4">
                    <div class="rounded-2xl border border-lime-electric/30 bg-carbon/90 p-5">
                      <p class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-neon">
                        Martes a viernes
                      </p>
                      <p class="font-title text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        ${config.schedule.weekdayScheduleLabel}
                      </p>
                    </div>

                    <div class="rounded-2xl border border-lime-electric/50 bg-carbon/90 p-5 shadow-lime-glow">
                      <p class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric">
                        Sábados, domingos y festivos
                      </p>
                      <p class="font-title text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        ${config.schedule.weekendScheduleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-6 rounded-xl border border-white/10 bg-graphite/50 p-4 text-xs text-white/75">
                  <strong class="text-lime-electric font-subtitle uppercase">Recuerda:</strong> Debes llegar 30 minutos antes de la hora de tu reserva para realizar el proceso de inducción (10 min incluidos) y preparación.
                </div>
              </div>

              <!-- Columna RESERVA TU EXPERIENCIA + Medios de Pago -->
              <div class="lg:col-span-7 x-card-featured p-8 sm:p-10 flex flex-col justify-between">
                <div class="space-y-6">
                  <div class="inline-flex items-center gap-2">
                    <span class="slash-stripes"><span></span><span></span><span></span></span>
                    <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.2em] text-lime-electric">
                      AGENDA EN LÍNEA
                    </span>
                  </div>

                  <h2 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic text-white leading-tight">
                    RESERVA TU <span class="text-lime-electric">EXPERIENCIA</span>
                  </h2>

                  <p class="font-subtitle text-lg font-semibold text-lime-neon">
                    La próxima aventura comienza con una reserva.
                  </p>

                  <p class="font-body text-base text-white/80 leading-relaxed">
                    Ven con tu familia, amigos o compañeros y descubre una nueva forma de disfrutar el motocross. Selecciona tu día y hora en nuestro sistema en línea, realiza el pago por Nequi o DaviPlata y sube tu comprobante para dejar tu cupo apartado de inmediato.
                  </p>

                  <!-- Medios de pago oficiales con botón copiar -->
                  <div class="space-y-3">
                    <p class="font-subtitle text-xs font-semibold uppercase tracking-wider text-white/70">
                      Medios de pago oficiales (haz clic para copiar el número):
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="rounded-xl border border-lime-electric/40 bg-carbon/90 p-4 flex items-center justify-between">
                        <div>
                          <span class="block font-subtitle text-xs font-semibold uppercase text-lime-electric">Nequi</span>
                          <span class="font-title text-xl font-extrabold text-white tracking-wider">${config.paymentInfo.nequi.number}</span>
                        </div>
                        <button
                          type="button"
                          data-copy="${config.paymentInfo.nequi.number}"
                          data-label="Nequi"
                          class="copy-payment-btn rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-3 py-2 font-subtitle text-xs font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
                        >
                          Copiar
                        </button>
                      </div>

                      <div class="rounded-xl border border-lime-electric/40 bg-carbon/90 p-4 flex items-center justify-between">
                        <div>
                          <span class="block font-subtitle text-xs font-semibold uppercase text-lime-neon">DaviPlata</span>
                          <span class="font-title text-xl font-extrabold text-white tracking-wider">${config.paymentInfo.daviplata.number}</span>
                        </div>
                        <button
                          type="button"
                          data-copy="${config.paymentInfo.daviplata.number}"
                          data-label="DaviPlata"
                          class="copy-payment-btn rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-3 py-2 font-subtitle text-xs font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pt-8 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <span class="block font-subtitle text-xs uppercase text-white/60">Contáctanos / Soporte:</span>
                    <span class="font-title text-xl font-extrabold text-white">${config.paymentInfo.whatsappDisplay}</span>
                  </div>
                  <a href="./reservar.html" class="btn-x-primary text-sm sm:text-base py-4 px-9">
                    <span>RESERVAR MI HORA EN LÍNEA</span>
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      ${renderFooter(config, true)}
    </div>
  `;

  initNavbarEvents();

  app.querySelectorAll<HTMLButtonElement>('.copy-payment-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const num = btn.getAttribute('data-copy') || '';
      const label = btn.getAttribute('data-label') || 'Cuenta';
      try {
        await navigator.clipboard.writeText(num);
        const original = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => {
          btn.textContent = original;
        }, 1800);
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Número de ${label} copiado: ${num}`,
          showConfirmButton: false,
          timer: 2200,
        });
      } catch {
        /* fallback */
      }
    });
  });
}

