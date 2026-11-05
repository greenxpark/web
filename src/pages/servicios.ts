import { renderFooter } from '../components/footer';
import { initNavbarEvents, renderNavbar } from '../components/navbar';
import type { ParkConfig } from '../types';
import { formatCOP } from '../utils/format';
import { getCachedParkConfigSync, loadParkConfig } from '../utils/storage';

export function initServiciosPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const initialConfig = getCachedParkConfigSync();
  renderView(app, initialConfig);

  void (async () => {
    const fresh = await loadParkConfig({
      onUpdate: (updated) => renderView(app, updated),
    });
    renderView(app, fresh);
  })();
}

function renderView(app: HTMLElement, config: ParkConfig): void {
  const activePackages = config.pitBikePackages.filter((p) => p.active);

  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-track-grid text-white">
      ${renderNavbar('servicios')}

      <main class="flex-1">
        <!-- Encabezado de Servicios -->
        <section class="relative overflow-hidden border-b border-lime-electric/20 py-14 sm:py-20 bg-carbon-deep/80">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div class="inline-flex items-center gap-2 rounded-full border border-lime-electric/40 bg-lime-electric/10 px-4 py-1.5">
              <span class="slash-stripes"><span></span><span></span><span></span></span>
              <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.2em] text-lime-electric">
                PORTAFOLIO OFICIAL GREEN X PARK
              </span>
            </div>
            <h1 class="font-title text-4xl sm:text-6xl font-extrabold uppercase italic tracking-tight text-white">
              EXPERIENCIAS, PISTAS Y <span class="text-lime-electric">TARIFAS</span>
            </h1>
            <p class="mx-auto max-w-2xl font-body text-base sm:text-lg text-white/75">
              Desde tu primera vez sobre una Pit Bike con inducción guiada, hasta entrenamiento libre en moto propia o el alquiler completo de nuestro escenario para tu marca o evento privado.
            </p>
            <!-- Navegación rápida interna -->
            <div class="flex flex-wrap items-center justify-center gap-3 pt-4">
              <a href="#vive-la-experiencia" class="rounded-xl border border-lime-electric/40 bg-graphite/70 px-4 py-2 font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors">
                01. Alquiler Pit Bikes
              </a>
              <a href="#practica-libre" class="rounded-xl border border-white/15 bg-graphite/70 px-4 py-2 font-subtitle text-xs font-semibold uppercase tracking-wider text-white hover:border-lime-electric hover:text-lime-electric transition-colors">
                02. Práctica Libre (Moto Propia)
              </a>
              <a href="#eventos-privados" class="rounded-xl border border-white/15 bg-graphite/70 px-4 py-2 font-subtitle text-xs font-semibold uppercase tracking-wider text-white hover:border-lime-electric hover:text-lime-electric transition-colors">
                03. Eventos Privados y Escenario
              </a>
            </div>
          </div>
        </section>

        <!-- ================= 1. VIVE LA EXPERIENCIA (ALQUILER PIT BIKES) ================= -->
        <section id="vive-la-experiencia" class="py-20 border-b border-white/10">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div class="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
              <!-- Copy Principal -->
              <div class="lg:col-span-6 space-y-6">
                <span class="x-badge-solid">SERVICIO ESTRELLA • SIN MOTO PROPIA</span>
                <h2 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic text-white leading-tight">
                  VIVE LA <span class="text-lime-electric">EXPERIENCIA</span>
                </h2>
                <p class="font-subtitle text-lg sm:text-xl font-semibold text-lime-neon">
                  Tu primera experiencia en motocross comienza aquí.
                </p>
                <div class="space-y-4 font-body text-base sm:text-lg text-white/80 leading-relaxed">
                  <p class="font-semibold text-white">
                    ¿Nunca has manejado una moto de motocross? ¡No importa!
                  </p>
                  <p>
                    En <strong class="text-white">GREEN X PARK</strong> puedes alquilar una motocicleta y disfrutar nuestras instalaciones sin necesidad de tener moto propia ni experiencia previa.
                  </p>
                </div>

                <!-- Nuestro servicio incluye -->
                <div class="x-card p-6 space-y-4">
                  <h3 class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric">
                    Nuestro servicio incluye:
                  </h3>
                  <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/90">
                    <li class="flex items-center gap-3 rounded-xl border border-white/10 bg-carbon/80 p-3.5">
                      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-electric text-carbon font-title font-extrabold">1</span>
                      <span class="font-subtitle font-medium">Alquiler de motocicleta.</span>
                    </li>
                    <li class="flex items-center gap-3 rounded-xl border border-white/10 bg-carbon/80 p-3.5">
                      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-electric text-carbon font-title font-extrabold">2</span>
                      <span class="font-subtitle font-medium">Inducción inicial de 10 minutos.</span>
                    </li>
                    <li class="flex items-center gap-3 rounded-xl border border-white/10 bg-carbon/80 p-3.5">
                      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-electric text-carbon font-title font-extrabold">3</span>
                      <span class="font-subtitle font-medium">Orientación para el uso de la pista.</span>
                    </li>
                    <li class="flex items-center gap-3 rounded-xl border border-white/10 bg-carbon/80 p-3.5">
                      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-electric text-carbon font-title font-extrabold">4</span>
                      <span class="font-subtitle font-medium">Tiempo de conducción según el paquete elegido.</span>
                    </li>
                  </ul>
                </div>

                <!-- Bloque IMPORTANTE -->
                <div class="rounded-2xl border-2 border-lime-electric/60 bg-lime-electric/10 p-6 space-y-2">
                  <div class="flex items-center gap-2 font-title text-lg font-extrabold uppercase text-lime-electric">
                    <svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>IMPORTANTE</span>
                  </div>
                  <p class="font-body text-sm sm:text-base text-white/95">
                    • La inducción inicial de 10 minutos está incluida en el servicio.
                  </p>
                  <p class="font-body text-sm sm:text-base text-white/95">
                    • Debes llegar <strong>30 minutos antes</strong> de la hora de tu reserva para realizar el proceso de inducción y preparación.
                  </p>
                </div>
              </div>

              <!-- Tarifas de Alquiler (Tabla + Tarjetas Interactivas) -->
              <div class="lg:col-span-6 space-y-6">
                <div class="x-card-featured p-6 sm:p-8 space-y-6">
                  <div class="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span class="font-subtitle text-xs font-semibold uppercase tracking-widest text-lime-electric">
                        PIT BIKES • GREEN X PARK
                      </span>
                      <h3 class="font-title text-2xl sm:text-3xl font-extrabold uppercase italic text-white">
                        TARIFAS DE ALQUILER
                      </h3>
                    </div>
                    <span class="x-badge">${config.schedule.pitBikeCapacityPerHour} cupos / hora</span>
                  </div>

                  <!-- Tabla Oficial -->
                  <div class="overflow-hidden rounded-xl border border-white/15 bg-carbon/90">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="border-b border-white/15 bg-graphite/90 font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-electric">
                          <th class="py-3.5 px-5">Tiempo de conducción</th>
                          <th class="py-3.5 px-5 text-right">Precio</th>
                          <th class="py-3.5 px-5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-white/10 text-sm sm:text-base">
                        ${activePackages
                          .map(
                            (pkg) => `
                          <tr class="hover:bg-lime-electric/5 transition-colors">
                            <td class="py-4 px-5">
                              <div class="font-subtitle font-semibold text-white flex items-center gap-2">
                                <span>${pkg.label}</span>
                                ${
                                  pkg.badge
                                    ? `<span class="rounded bg-lime-electric/20 border border-lime-electric/40 px-2 py-0.5 text-[10px] font-subtitle font-semibold text-lime-electric">${pkg.badge}</span>`
                                    : ''
                                }
                              </div>
                              <p class="text-xs text-white/60 mt-0.5">${pkg.description}</p>
                            </td>
                            <td class="py-4 px-5 text-right font-title text-xl font-extrabold text-lime-electric whitespace-nowrap">
                              ${formatCOP(pkg.price)}
                            </td>
                            <td class="py-4 px-5 text-right whitespace-nowrap">
                              <a
                                href="./reservar.html?service=pitbike&package=${encodeURIComponent(pkg.id)}"
                                class="inline-flex items-center gap-1 rounded-lg bg-lime-electric px-3.5 py-2 font-title text-xs font-extrabold uppercase text-carbon hover:bg-lime-neon transition-colors"
                              >
                                Elegir →
                              </a>
                            </td>
                          </tr>
                        `
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </div>

                  <a href="./reservar.html?service=pitbike" class="btn-x-primary w-full justify-center py-4 text-base">
                    RESERVAR MI EXPERIENCIA
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= 2. PRÁCTICA LIBRE ================= -->
        <section id="practica-libre" class="py-20 border-b border-white/10 bg-carbon-deep/70">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
              <div class="lg:col-span-7 space-y-6">
                <span class="x-badge">DERECHO A PISTA • MOTO PROPIA</span>
                <h2 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic text-white">
                  PRÁCTICA <span class="text-lime-electric">LIBRE</span>
                </h2>
                <p class="font-subtitle text-lg sm:text-xl font-semibold text-lime-neon">
                  ¿Tienes moto propia? ¡La pista te espera!
                </p>
                <p class="font-body text-base sm:text-lg text-white/80 leading-relaxed">
                  Si ya practicas motocross o enduro y cuentas con tu propia motocicleta, puedes disfrutar de nuestras instalaciones pagando el derecho a pista.
                </p>

                <div class="space-y-3">
                  <p class="font-subtitle text-sm font-semibold uppercase tracking-wider text-white/90">
                    Tenemos dos escenarios para poner a prueba tus habilidades:
                  </p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${config.freePractice.tracks
                      .map(
                        (track, idx) => `
                      <div class="x-card p-5 border-l-4 border-l-lime-electric">
                        <span class="font-title text-xs font-extrabold uppercase text-lime-electric">ESCENARIO 0${idx + 1}</span>
                        <h3 class="font-subtitle text-lg font-semibold text-white mt-1">${track}</h3>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>

                <p class="font-body text-base text-white/80">
                  Disfruta durante todo el día de nuestras pistas y vive una jornada de entrenamiento, diversión y adrenalina.
                </p>
              </div>

              <div class="lg:col-span-5">
                <div class="x-card-featured p-8 text-center space-y-6">
                  <span class="x-badge-solid">JORNADA COMPLETA</span>
                  <div>
                    <p class="font-subtitle text-sm font-semibold uppercase tracking-widest text-white/70">
                      DERECHO A PISTA
                    </p>
                    <p class="font-title text-5xl sm:text-6xl font-extrabold text-lime-electric mt-2">
                      ${formatCOP(config.freePractice.price)}
                    </p>
                    <p class="text-xs font-subtitle text-white/60 mt-2 uppercase">
                      Por piloto / Día completo en pistas MX y Enduro
                    </p>
                  </div>

                  <div class="rounded-xl border border-white/10 bg-carbon/80 p-4 text-left text-xs text-white/75 space-y-1.5">
                    <p>✓ Acceso a Pista de Motocross (MX) y Pista de Enduro.</p>
                    <p>✓ Cupos diarios controlados (${config.freePractice.maxDailySlots} cupos/día) para garantizar fluidez en pista.</p>
                    <p>✓ Aparta tu cupo en línea subiendo tu comprobante de pago.</p>
                  </div>

                  <a href="./reservar.html?service=practica_libre" class="btn-x-primary w-full justify-center py-4 text-sm sm:text-base">
                    CONSULTAR DISPONIBILIDAD Y RESERVAR
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= 3. EVENTOS PRIVADOS Y ALQUILER DE ESCENARIO ================= -->
        <section id="eventos-privados" class="py-20 border-b border-white/10">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
              <div class="lg:col-span-7 space-y-6">
                <span class="x-badge">EXPERIENCIAS CORPORATIVAS Y MARCAS</span>
                <h2 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic text-white leading-tight">
                  EVENTOS PRIVADOS Y <span class="text-lime-electric">ALQUILER DE ESCENARIO</span>
                </h2>
                <p class="font-subtitle text-lg sm:text-xl font-semibold text-lime-neon">
                  Tu marca. Tu evento. Nuestra adrenalina.
                </p>
                <p class="font-body text-base sm:text-lg text-white/80 leading-relaxed">
                  ¿Quieres organizar una experiencia diferente para tus clientes, colaboradores o invitados?
                </p>
                <p class="font-body text-base sm:text-lg text-white/80 leading-relaxed">
                  En <strong class="text-white">GREEN X PARK</strong> ponemos a tu disposición nuestro escenario para realizar eventos privados, experiencias de marca y actividades empresariales relacionadas con el mundo del motor y los deportes al aire libre.
                </p>

                <div class="space-y-3">
                  <h3 class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric">
                    Ideal para:
                  </h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${config.privateEvents.idealFor
                      .map(
                        (item) => `
                      <div class="rounded-xl border border-white/10 bg-graphite/60 p-4 flex items-start gap-3">
                        <span class="text-lime-electric font-bold text-lg leading-none">▸</span>
                        <span class="text-sm text-white/90 font-body">${item}</span>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>
              </div>

              <div class="lg:col-span-5">
                <div class="x-card-featured p-8 space-y-6">
                  <div>
                    <span class="font-subtitle text-xs font-semibold uppercase tracking-widest text-lime-electric">
                      ESCENARIO EXCLUSIVO
                    </span>
                    <h3 class="font-title text-2xl sm:text-3xl font-extrabold uppercase italic text-white mt-1">
                      TARIFAS DE ALQUILER
                    </h3>
                  </div>

                  <div class="space-y-4">
                    <div class="rounded-2xl border border-white/15 bg-carbon/90 p-5">
                      <span class="block font-subtitle text-xs font-semibold uppercase tracking-wider text-white/70">
                        Entre semana (Martes a Viernes)
                      </span>
                      <span class="block font-title text-3xl sm:text-4xl font-extrabold text-white mt-1">
                        ${formatCOP(config.privateEvents.weekdayPrice)}
                      </span>
                    </div>

                    <div class="rounded-2xl border-2 border-lime-electric/60 bg-carbon/90 p-5 shadow-lime-glow">
                      <span class="block font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-electric">
                        Fines de semana y festivos
                      </span>
                      <span class="block font-title text-3xl sm:text-4xl font-extrabold text-lime-electric mt-1">
                        ${formatCOP(config.privateEvents.weekendHolidayPrice)}
                      </span>
                    </div>
                  </div>

                  <p class="text-sm text-white/80 leading-relaxed">
                    Alquila nuestro escenario y crea una experiencia diferente alrededor de los deportes extremos. Consulta disponibilidad, condiciones de alquiler y servicios adicionales.
                  </p>

                  <a href="./reservar.html?service=evento_privado" class="btn-x-primary w-full justify-center py-4 text-sm sm:text-base">
                    COTIZAR / RESERVAR MI EVENTO
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
}

