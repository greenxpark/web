import Swal from 'sweetalert2';
import { CONFIG } from '../config';
import { renderFooter } from '../components/footer';
import { initNavbarEvents, renderNavbar } from '../components/navbar';
import type { Booking, DayAvailabilitySummary, ParkConfig, ServiceType } from '../types';
import {
  escapeHtml,
  formatCOP,
  formatDateLong,
  formatTime12h,
  getNextOpenDateISO,
  getTodayISO,
  parseSheetDate,
  readFileAsDataUrl,
} from '../utils/format';
import {
  computeDayAvailability,
  createBooking,
  getCachedParkConfigSync,
  loadBookings,
  loadParkConfig,
} from '../utils/storage';

interface BookingState {
  serviceType: ServiceType;
  packageId: string;
  date: string;
  timeSlot: string;
  quantity: number;
  paymentMethod: string;
  comprobanteDataUrl: string;
  comprobanteFileName: string;
  comprobanteFileType: string;
  acceptedTerms: boolean;
  isSubmitting: boolean;
}

export function initReservarPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  let config = getCachedParkConfigSync();
  let bookings: Booking[] = [];

  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  const packageParam = params.get('package');

  const initialService: ServiceType =
    serviceParam === 'practica_libre' || serviceParam === 'evento_privado'
      ? serviceParam
      : 'pitbike';

  const firstActivePkg =
    config.pitBikePackages.find((p) => p.active && p.id === packageParam) ??
    config.pitBikePackages.find((p) => p.active) ??
    config.pitBikePackages[0];

  const defaultDate = getNextOpenDateISO(
    config.schedule.mondayOpen,
    config.schedule.blockedDates,
    config.schedule.holidays
  );

  const state: BookingState = {
    serviceType: initialService,
    packageId:
      initialService === 'pitbike'
        ? firstActivePkg?.id || 'pitbike-15'
        : initialService === 'practica_libre'
        ? 'derecho-pista'
        : 'evento-privado',
    date: defaultDate,
    timeSlot: '',
    quantity: 1,
    paymentMethod: 'Nequi',
    comprobanteDataUrl: '',
    comprobanteFileName: '',
    comprobanteFileType: '',
    acceptedTerms: false,
    isSubmitting: false,
  };

  const renderAll = () => {
    const dayAvail = computeDayAvailability(state.date, config, bookings);
    ensureValidTimeSlotAndQuantity(state, dayAvail);
    renderReservarView(app, config, state, dayAvail);
  };

  renderAll();

  void (async () => {
    const [freshCfg, freshBookings] = await Promise.all([
      loadParkConfig(),
      loadBookings({ forceRefresh: true }),
    ]);
    config = freshCfg;
    bookings = freshBookings;
    renderAll();
  })();
}

function ensureValidTimeSlotAndQuantity(
  state: BookingState,
  dayAvail: DayAvailabilitySummary
): void {
  if (state.serviceType === 'evento_privado') {
    state.timeSlot = 'DIA_COMPLETO';
    state.quantity = 1;
    return;
  }

  const openSlots = dayAvail.slots.filter((s) => s.isAvailable);
  const currentSlotObj = dayAvail.slots.find((s) => s.timeSlot === state.timeSlot);

  if (!currentSlotObj || !currentSlotObj.isAvailable) {
    state.timeSlot = openSlots[0]?.timeSlot || '';
  }

  if (state.serviceType === 'pitbike') {
    const activeSlot = dayAvail.slots.find((s) => s.timeSlot === state.timeSlot);
    const maxCap = activeSlot?.availableCount ?? 1;
    if (state.quantity > maxCap) state.quantity = Math.max(1, maxCap);
  } else if (state.serviceType === 'practica_libre') {
    const maxFree = Math.max(1, dayAvail.freePracticeAvailable);
    if (state.quantity > maxFree) state.quantity = maxFree;
  }
}

function calculateCurrentPricing(
  config: ParkConfig,
  state: BookingState,
  dayAvail: DayAvailabilitySummary
): {
  serviceLabel: string;
  packageLabel: string;
  unitPrice: number;
  totalPrice: number;
  maxQuantity: number;
} {
  if (state.serviceType === 'pitbike') {
    const pkg =
      config.pitBikePackages.find((p) => p.id === state.packageId) ??
      config.pitBikePackages[0];
    const slot = dayAvail.slots.find((s) => s.timeSlot === state.timeSlot);
    const maxQuantity = Math.max(1, slot?.availableCount ?? config.schedule.pitBikeCapacityPerHour);
    const unitPrice = pkg?.price ?? 45000;
    return {
      serviceLabel: 'Vive la Experiencia (Alquiler Pit Bike)',
      packageLabel: `${pkg?.label ?? '10 minutos'} (+10 min inducción)`,
      unitPrice,
      totalPrice: unitPrice * state.quantity,
      maxQuantity,
    };
  }

  if (state.serviceType === 'practica_libre') {
    const unitPrice = config.freePractice.price;
    const maxQuantity = Math.max(1, dayAvail.freePracticeAvailable);
    return {
      serviceLabel: 'Práctica Libre (Derecho a Pista Moto Propia)',
      packageLabel: 'Derecho a Pista Día Completo (MX + Enduro)',
      unitPrice,
      totalPrice: unitPrice * state.quantity,
      maxQuantity,
    };
  }

  const isWeekendOrHoliday = dayAvail.isWeekend || dayAvail.isHoliday;
  const unitPrice = isWeekendOrHoliday
    ? config.privateEvents.weekendHolidayPrice
    : config.privateEvents.weekdayPrice;

  return {
    serviceLabel: 'Evento Privado y Alquiler de Escenario',
    packageLabel: isWeekendOrHoliday
      ? 'Alquiler Escenario Fin de Semana / Festivo'
      : 'Alquiler Escenario Entre Semana',
    unitPrice,
    totalPrice: unitPrice,
    maxQuantity: 1,
  };
}

function getQuickDates(config: ParkConfig): { iso: string; dayName: string; dayNum: string; month: string }[] {
  const result: { iso: string; dayName: string; dayNum: string; month: string }[] = [];
  const dt = new Date();
  for (let i = 0; i < 14 && result.length < 7; i++) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const dayOfWeek = dt.getDay();
    const isHoliday = config.schedule.holidays.includes(iso);
    const isBlocked = config.schedule.blockedDates.includes(iso);

    if (!isBlocked && (dayOfWeek !== 1 || config.schedule.mondayOpen || isHoliday)) {
      result.push({
        iso,
        dayName: dt.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
        dayNum: String(dt.getDate()),
        month: dt.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
      });
    }
    dt.setDate(dt.getDate() + 1);
  }
  return result;
}

function renderReservarView(
  app: HTMLElement,
  config: ParkConfig,
  state: BookingState,
  dayAvail: DayAvailabilitySummary
): void {
  const activePackages = config.pitBikePackages.filter((p) => p.active);
  const pricing = calculateCurrentPricing(config, state, dayAvail);
  const quickDates = getQuickDates(config);

  // Preserve current form input values if re-rendering
  const prevName = (document.getElementById('customerName') as HTMLInputElement | null)?.value ?? '';
  const prevDoc = (document.getElementById('customerDocument') as HTMLInputElement | null)?.value ?? '';
  const prevPhone = (document.getElementById('customerPhone') as HTMLInputElement | null)?.value ?? '';
  const prevEmail = (document.getElementById('customerEmail') as HTMLInputElement | null)?.value ?? '';
  const prevLevel = (document.getElementById('experienceLevel') as HTMLSelectElement | null)?.value ?? 'Primera vez (Principiante)';
  const prevNotes = (document.getElementById('riderNotes') as HTMLTextAreaElement | null)?.value ?? '';

  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-track-grid text-white">
      ${renderNavbar('reservar')}

      <main class="flex-1 py-10 sm:py-14">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <!-- Cabecera de Reserva -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2">
                <span class="slash-stripes"><span></span><span></span><span></span></span>
                <span class="font-subtitle text-xs font-semibold uppercase tracking-[0.2em] text-lime-electric">
                  PIT LANE BOOKING SYSTEM • RESERVA EN LÍNEA
                </span>
              </div>
              <h1 class="font-title text-3xl sm:text-5xl font-extrabold uppercase italic text-white">
                APARTA TU <span class="text-lime-electric">EXPERIENCIA</span>
              </h1>
              <p class="font-body text-sm sm:text-base text-white/75 max-w-2xl">
                Selecciona tu servicio, elige el día y la hora exacta en tiempo real, transfiere por Nequi o DaviPlata y sube tu comprobante para bloquear tu cupo de inmediato.
              </p>
            </div>
            <div class="rounded-xl border border-lime-electric/40 bg-lime-electric/10 px-4 py-3 text-xs sm:text-sm max-w-sm">
              <p class="font-subtitle font-semibold text-lime-electric uppercase">⚡ Inducción 10 min incluida</p>
              <p class="text-white/85 mt-0.5">Recuerda llegar <strong>30 minutos antes</strong> de la hora seleccionada.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            <!-- ================= COLUMNA IZQUIERDA: CONFIGURADOR DE RESERVA (7 COLS) ================= -->
            <div class="lg:col-span-7 space-y-8">
              <!-- PASO 1: MODALIDAD / SERVICIO -->
              <section class="x-card p-6 sm:p-7 space-y-5">
                <div class="flex items-center gap-3">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-electric font-title text-base font-extrabold text-carbon">1</span>
                  <div>
                    <h2 class="font-title text-xl sm:text-2xl font-extrabold uppercase italic text-white">
                      ELIGE TU MODALIDAD Y PAQUETE
                    </h2>
                    <p class="text-xs text-white/60 font-body">Selecciona el tipo de experiencia que deseas reservar</p>
                  </div>
                </div>

                <!-- Pestañas de Servicio -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Tipo de experiencia">
                  <button
                    type="button"
                    data-service="pitbike"
                    class="service-tab-btn text-left rounded-xl border p-4 transition-all ${
                      state.serviceType === 'pitbike'
                        ? 'border-2 border-lime-electric bg-lime-electric/15 shadow-lime-glow'
                        : 'border-white/15 bg-carbon/80 hover:border-white/35'
                    }"
                  >
                    <span class="block font-subtitle text-[11px] font-semibold uppercase tracking-wider text-lime-electric">
                      SIN MOTO PROPIA
                    </span>
                    <span class="block font-title text-lg font-extrabold uppercase text-white mt-0.5">
                      Alquiler Pit Bikes
                    </span>
                    <span class="block text-xs text-white/70 mt-1">
                      Desde ${formatCOP(activePackages[0]?.price ?? 45000)}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-service="practica_libre"
                    class="service-tab-btn text-left rounded-xl border p-4 transition-all ${
                      state.serviceType === 'practica_libre'
                        ? 'border-2 border-lime-electric bg-lime-electric/15 shadow-lime-glow'
                        : 'border-white/15 bg-carbon/80 hover:border-white/35'
                    }"
                  >
                    <span class="block font-subtitle text-[11px] font-semibold uppercase tracking-wider text-lime-neon">
                      MOTO PROPIA
                    </span>
                    <span class="block font-title text-lg font-extrabold uppercase text-white mt-0.5">
                      Práctica Libre
                    </span>
                    <span class="block text-xs text-white/70 mt-1">
                      Derecho a pista ${formatCOP(config.freePractice.price)}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-service="evento_privado"
                    class="service-tab-btn text-left rounded-xl border p-4 transition-all ${
                      state.serviceType === 'evento_privado'
                        ? 'border-2 border-lime-electric bg-lime-electric/15 shadow-lime-glow'
                        : 'border-white/15 bg-carbon/80 hover:border-white/35'
                    }"
                  >
                    <span class="block font-subtitle text-[11px] font-semibold uppercase tracking-wider text-lime-electric">
                      EMPRESAS Y GRUPOS
                    </span>
                    <span class="block font-title text-lg font-extrabold uppercase text-white mt-0.5">
                      Evento Privado
                    </span>
                    <span class="block text-xs text-white/70 mt-1">
                      Escenario exclusivo
                    </span>
                  </button>
                </div>

                <!-- Sub-selector de Paquete según servicio -->
                ${
                  state.serviceType === 'pitbike'
                    ? `
                  <div class="space-y-3 pt-2">
                    <label class="x-label">Selecciona tu tiempo de conducción (+10 min de inducción incluidos):</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      ${activePackages
                        .map((pkg) => {
                          const isSelected = pkg.id === state.packageId;
                          return `
                            <button
                              type="button"
                              data-package="${escapeHtml(pkg.id)}"
                              class="package-select-btn text-left rounded-xl border p-4 transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-2 border-lime-electric bg-lime-electric/15'
                                  : 'border-white/15 bg-carbon/90 hover:border-lime-electric/50'
                              }"
                            >
                              <div>
                                <div class="flex items-center gap-2">
                                  <span class="font-title text-lg font-extrabold text-white">${escapeHtml(pkg.label)}</span>
                                  ${
                                    pkg.badge
                                      ? `<span class="rounded bg-lime-electric text-carbon px-2 py-0.5 font-title text-[10px] font-extrabold uppercase">${escapeHtml(pkg.badge)}</span>`
                                      : ''
                                  }
                                </div>
                                <p class="text-xs text-white/65 mt-1">${escapeHtml(pkg.description)}</p>
                              </div>
                              <div class="text-right pl-3">
                                <span class="font-title text-xl font-extrabold text-lime-electric">${formatCOP(pkg.price)}</span>
                                <span class="block text-[10px] text-white/60 font-subtitle uppercase">por moto</span>
                              </div>
                            </button>
                          `;
                        })
                        .join('')}
                    </div>
                  </div>
                `
                    : state.serviceType === 'practica_libre'
                    ? `
                  <div class="rounded-xl border border-lime-electric/40 bg-carbon/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="space-y-1">
                      <span class="x-badge-solid">DERECHO A PISTA DÍA COMPLETO</span>
                      <h3 class="font-subtitle text-base font-semibold text-white pt-1">
                        Pista de Motocross (MX) + Pista de Enduro
                      </h3>
                      <p class="text-xs text-white/75">${escapeHtml(config.freePractice.description)}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="font-title text-3xl font-extrabold text-lime-electric">${formatCOP(config.freePractice.price)}</span>
                      <span class="block text-xs text-white/60 font-subtitle">Por piloto / Todo el día</span>
                    </div>
                  </div>
                `
                    : `
                  <div class="rounded-xl border border-lime-electric/40 bg-carbon/90 p-5 space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="x-badge-solid">ALQUILER DE ESCENARIO COMPLETO</span>
                      <span class="font-subtitle text-xs font-semibold text-lime-neon">
                        ${
                          dayAvail.isWeekend || dayAvail.isHoliday
                            ? 'Tarifa Fin de Semana / Festivo aplicada'
                            : 'Tarifa Entre Semana aplicada'
                        }
                      </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div class="rounded-lg border ${
                        !dayAvail.isWeekend && !dayAvail.isHoliday
                          ? 'border-lime-electric bg-lime-electric/10'
                          : 'border-white/10 bg-graphite/40'
                      } p-3">
                        <span class="block font-subtitle text-xs uppercase text-white/70">Entre semana (Mar–Vie)</span>
                        <span class="font-title text-xl font-extrabold text-white">${formatCOP(config.privateEvents.weekdayPrice)}</span>
                      </div>
                      <div class="rounded-lg border ${
                        dayAvail.isWeekend || dayAvail.isHoliday
                          ? 'border-lime-electric bg-lime-electric/10'
                          : 'border-white/10 bg-graphite/40'
                      } p-3">
                        <span class="block font-subtitle text-xs uppercase text-lime-electric">Fines de semana y festivos</span>
                        <span class="font-title text-xl font-extrabold text-lime-electric">${formatCOP(config.privateEvents.weekendHolidayPrice)}</span>
                      </div>
                    </div>
                  </div>
                `
                }
              </section>

              <!-- PASO 2: FECHA, HORARIO Y CUPOS -->
              <section class="x-card p-6 sm:p-7 space-y-6">
                <div class="flex items-center gap-3">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-electric font-title text-base font-extrabold text-carbon">2</span>
                  <div>
                    <h2 class="font-title text-xl sm:text-2xl font-extrabold uppercase italic text-white">
                      SELECCIONA EL DÍA Y LA HORA EXACTA
                    </h2>
                    <p class="text-xs text-white/60 font-body">
                      La hora elegida quedará apartada inmediatamente al enviar tu reserva
                    </p>
                  </div>
                </div>

                <!-- Selector Rápido de Próximos Días + Calendario -->
                <div class="space-y-3">
                  <label for="booking-date-input" class="x-label">Selecciona la fecha de tu visita:</label>
                  <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    ${quickDates
                      .map((qd) => {
                        const isSelected = qd.iso === state.date;
                        return `
                          <button
                            type="button"
                            data-quick-date="${qd.iso}"
                            class="quick-date-btn rounded-xl border py-2.5 px-2 text-center transition-all ${
                              isSelected
                                ? 'border-2 border-lime-electric bg-lime-electric text-carbon font-bold shadow-lime-glow'
                                : 'border-white/15 bg-carbon/90 text-white hover:border-lime-electric/50'
                            }"
                          >
                            <span class="block font-subtitle text-[10px] uppercase ${isSelected ? 'text-carbon' : 'text-white/60'}">${qd.dayName}</span>
                            <span class="block font-title text-xl font-extrabold leading-tight">${qd.dayNum}</span>
                            <span class="block font-subtitle text-[10px] uppercase ${isSelected ? 'text-carbon/80' : 'text-lime-electric'}">${qd.month}</span>
                          </button>
                        `;
                      })
                      .join('')}
                  </div>

                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div class="flex-1">
                      <input
                        type="date"
                        id="booking-date-input"
                        name="bookingDate"
                        min="${getTodayISO()}"
                        value="${state.date}"
                        class="x-input font-subtitle font-semibold"
                      />
                    </div>
                    <div class="rounded-xl border border-white/10 bg-carbon/80 px-4 py-3 text-xs text-white/80">
                      <span class="block font-subtitle font-semibold text-lime-electric uppercase">
                        ${formatDateLong(state.date)}
                      </span>
                      <span>
                        Horario del parque: <strong>${
                          dayAvail.isWeekend || dayAvail.isHoliday
                            ? config.schedule.weekendScheduleLabel
                            : config.schedule.weekdayScheduleLabel
                        }</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Grilla de Horarios Disponibles -->
                ${
                  !dayAvail.isOpen
                    ? `
                  <div class="rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-6 text-center space-y-2">
                    <p class="font-title text-xl font-extrabold uppercase text-red-400">
                      FECHA NO DISPONIBLE
                    </p>
                    <p class="text-sm text-white/85">${escapeHtml(dayAvail.reasonClosed || 'El parque se encuentra cerrado en esta fecha.')}</p>
                    <p class="text-xs text-lime-electric font-subtitle pt-1">Por favor selecciona otro día en el calendario superior.</p>
                  </div>
                `
                    : state.serviceType === 'evento_privado'
                    ? `
                  <div class="rounded-2xl border-2 border-lime-electric/60 bg-lime-electric/10 p-5 flex items-center justify-between">
                    <div>
                      <span class="x-badge-solid">JORNADA COMPLETA DISPONIBLE</span>
                      <p class="font-title text-lg font-extrabold text-white mt-2">
                        Reserva exclusiva del escenario para el ${formatDateLong(state.date)}
                      </p>
                      <p class="text-xs text-white/75 mt-1">
                        Horario habilitado: ${
                          dayAvail.isWeekend || dayAvail.isHoliday
                            ? config.schedule.weekendScheduleLabel
                            : config.schedule.weekdayScheduleLabel
                        }
                      </p>
                    </div>
                    <span class="font-title text-2xl font-extrabold text-lime-electric">✓ LIBRE</span>
                  </div>
                `
                    : `
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="x-label mb-0">
                        ${
                          state.serviceType === 'pitbike'
                            ? 'Selecciona la hora exacta de tu turno:'
                            : 'Selecciona tu hora estimada de llegada a pista:'
                        }
                      </label>
                      <span class="text-xs font-subtitle text-lime-neon">
                        ${
                          state.serviceType === 'pitbike'
                            ? `Máx. ${config.schedule.pitBikeCapacityPerHour} cupos por hora`
                            : `${dayAvail.freePracticeAvailable} cupos disponibles hoy`
                        }
                      </span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      ${dayAvail.slots
                        .map((slot) => {
                          const isSelected = slot.timeSlot === state.timeSlot;
                          const canPick =
                            state.serviceType === 'practica_libre'
                              ? !slot.isBlocked && dayAvail.freePracticeAvailable > 0
                              : slot.isAvailable;

                          if (!canPick) {
                            return `
                              <button
                                type="button"
                                disabled
                                class="rounded-xl border border-red-500/30 bg-carbon/50 p-3.5 text-left opacity-60 cursor-not-allowed"
                              >
                                <span class="block font-title text-base font-extrabold text-white/50 line-through">
                                  ${slot.formattedTime}
                                </span>
                                <span class="mt-1 inline-block rounded bg-red-500/20 px-2 py-0.5 font-subtitle text-[10px] font-semibold uppercase text-red-300">
                                  APARTADO / LLENO
                                </span>
                              </button>
                            `;
                          }

                          return `
                            <button
                              type="button"
                              data-slot="${slot.timeSlot}"
                              class="slot-select-btn rounded-xl border p-3.5 text-left transition-all ${
                                isSelected
                                  ? 'border-2 border-lime-electric bg-lime-electric text-carbon shadow-lime-glow'
                                  : 'border-white/15 bg-carbon/90 text-white hover:border-lime-electric/60'
                              }"
                            >
                              <div class="flex items-center justify-between">
                                <span class="font-title text-base font-extrabold ${isSelected ? 'text-carbon' : 'text-white'}">
                                  ${slot.formattedTime}
                                </span>
                                ${
                                  isSelected
                                    ? `<span class="font-title text-xs font-extrabold text-carbon">✓</span>`
                                    : ''
                                }
                              </div>
                              <span class="mt-1 block font-subtitle text-[11px] font-semibold ${
                                isSelected ? 'text-carbon/85' : 'text-lime-electric'
                              }">
                                ${
                                  state.serviceType === 'pitbike'
                                    ? `${slot.availableCount} ${slot.availableCount === 1 ? 'cupo libre' : 'cupos libres'}`
                                    : 'Disponible'
                                }
                              </span>
                            </button>
                          `;
                        })
                        .join('')}
                    </div>
                  </div>
                `
                }

                <!-- Selector de Cantidad de Motos / Cupos -->
                ${
                  dayAvail.isOpen && state.serviceType !== 'evento_privado'
                    ? `
                  <div class="rounded-xl border border-white/15 bg-carbon/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span class="font-subtitle text-sm font-semibold text-white">
                        ${
                          state.serviceType === 'pitbike'
                            ? 'Cantidad de motos / personas en este turno:'
                            : 'Cantidad de pilotos (Derecho a pista):'
                        }
                      </span>
                      <p class="text-xs text-white/60">
                        Puedes apartar desde 1 hasta ${pricing.maxQuantity} cupo(s) disponibles en este horario.
                      </p>
                    </div>
                    <div class="flex items-center gap-3 self-start sm:self-auto">
                      <button
                        type="button"
                        id="qty-minus-btn"
                        class="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-graphite text-xl font-title font-extrabold text-white hover:border-lime-electric hover:text-lime-electric transition-colors"
                        aria-label="Disminuir cupos"
                      >
                        −
                      </button>
                      <span class="min-w-[3rem] text-center font-title text-2xl font-extrabold text-lime-electric">
                        ${state.quantity}
                      </span>
                      <button
                        type="button"
                        id="qty-plus-btn"
                        class="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-graphite text-xl font-title font-extrabold text-white hover:border-lime-electric hover:text-lime-electric transition-colors"
                        aria-label="Aumentar cupos"
                      >
                        +
                      </button>
                    </div>
                  </div>
                `
                    : ''
                }
              </section>
            </div>

            <!-- ================= COLUMNA DERECHA: PAGO Y FORMULARIO SENCILLO (5 COLS) ================= -->
            <div class="lg:col-span-5 space-y-6">
              <div class="x-card-featured p-6 sm:p-7 space-y-6">
                <!-- Resumen de Liquidación en Vivo -->
                <div class="border-b border-white/10 pb-5 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="x-badge-solid">RESUMEN DE TU RESERVA</span>
                    <span class="font-subtitle text-xs font-semibold text-lime-neon">Cupo inmediato</span>
                  </div>

                  <div class="space-y-1.5 text-sm pt-1">
                    <div class="flex justify-between text-white/80">
                      <span>Experiencia:</span>
                      <strong class="text-white text-right">${escapeHtml(pricing.serviceLabel)}</strong>
                    </div>
                    <div class="flex justify-between text-white/80">
                      <span>Paquete:</span>
                      <strong class="text-lime-neon text-right">${escapeHtml(pricing.packageLabel)}</strong>
                    </div>
                    <div class="flex justify-between text-white/80">
                      <span>Fecha y Hora:</span>
                      <strong class="text-white text-right">
                        ${state.date} • ${state.timeSlot ? formatTime12h(state.timeSlot) : 'Sin hora'}
                      </strong>
                    </div>
                    <div class="flex justify-between text-white/80">
                      <span>Cupos / Motos:</span>
                      <strong class="text-white">${state.quantity}</strong>
                    </div>
                  </div>

                  <div class="rounded-xl border border-lime-electric/50 bg-carbon p-4 flex items-center justify-between">
                    <div>
                      <span class="block font-subtitle text-xs font-semibold uppercase text-white/70">Total a Pagar</span>
                      <span class="text-[11px] text-lime-neon">Inducción 10 min incluida</span>
                    </div>
                    <span class="font-title text-3xl sm:text-4xl font-extrabold text-lime-electric">
                      ${formatCOP(pricing.totalPrice)}
                    </span>
                  </div>
                </div>

                <!-- Medios de Pago Oficiales -->
                <div class="space-y-3">
                  <p class="font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-electric">
                    Paso 3: Transfiere a nuestras cuentas oficiales
                  </p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    ${
                      config.paymentInfo.nequi.enabled
                        ? `
                      <div class="rounded-xl border border-white/15 bg-carbon/90 p-3 flex items-center justify-between">
                        <div>
                          <span class="block font-subtitle text-[11px] font-semibold uppercase text-lime-electric">Nequi</span>
                          <span class="font-title text-base font-extrabold text-white">${escapeHtml(config.paymentInfo.nequi.number)}</span>
                        </div>
                        <button
                          type="button"
                          data-copy="${escapeHtml(config.paymentInfo.nequi.number)}"
                          class="copy-acc-btn rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-2.5 py-1.5 font-subtitle text-[11px] font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    `
                        : ''
                    }
                    ${
                      config.paymentInfo.daviplata.enabled
                        ? `
                      <div class="rounded-xl border border-white/15 bg-carbon/90 p-3 flex items-center justify-between">
                        <div>
                          <span class="block font-subtitle text-[11px] font-semibold uppercase text-lime-neon">DaviPlata</span>
                          <span class="font-title text-base font-extrabold text-white">${escapeHtml(config.paymentInfo.daviplata.number)}</span>
                        </div>
                        <button
                          type="button"
                          data-copy="${escapeHtml(config.paymentInfo.daviplata.number)}"
                          class="copy-acc-btn rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-2.5 py-1.5 font-subtitle text-[11px] font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    `
                        : ''
                    }
                  </div>
                  ${
                    config.paymentInfo.bankAccount.enabled && config.paymentInfo.bankAccount.accountNumber
                      ? `
                    <div class="rounded-xl border border-white/15 bg-carbon/90 p-3 flex items-center justify-between">
                      <div>
                        <span class="block font-subtitle text-[11px] font-semibold uppercase text-lime-electric">
                          ${escapeHtml(config.paymentInfo.bankAccount.bank)} (${escapeHtml(config.paymentInfo.bankAccount.accountType)})
                        </span>
                        <span class="font-title text-sm font-extrabold text-white">${escapeHtml(config.paymentInfo.bankAccount.accountNumber)}</span>
                        <span class="block text-[11px] text-white/60">${escapeHtml(config.paymentInfo.bankAccount.holderName)}</span>
                      </div>
                      <button
                        type="button"
                        data-copy="${escapeHtml(config.paymentInfo.bankAccount.accountNumber)}"
                        class="copy-acc-btn rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-2.5 py-1.5 font-subtitle text-[11px] font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  `
                      : ''
                  }
                </div>

                <!-- FORMULARIO SENCILLO DE RESERVA -->
                <form id="booking-form" method="POST" action="#reservar" class="space-y-4" novalidate>
                  <div>
                    <label for="customerName" class="x-label">Nombre Completo *</label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      autocomplete="name"
                      required
                      value="${escapeHtml(prevName)}"
                      placeholder="Ej. Sebastián Morales"
                      class="x-input"
                    />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label for="customerDocument" class="x-label">Cédula / Documento *</label>
                      <input
                        type="text"
                        id="customerDocument"
                        name="customerDocument"
                        inputmode="numeric"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                        required
                        value="${escapeHtml(prevDoc)}"
                        placeholder="Ej. 1020304050"
                        class="x-input"
                      />
                    </div>
                    <div>
                      <label for="customerPhone" class="x-label">Celular (WhatsApp) *</label>
                      <input
                        type="tel"
                        id="customerPhone"
                        name="customerPhone"
                        autocomplete="tel"
                        inputmode="tel"
                        required
                        value="${escapeHtml(prevPhone)}"
                        placeholder="Ej. 320 850 4410"
                        class="x-input"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label for="customerEmail" class="x-label">Correo Electrónico *</label>
                      <input
                        type="email"
                        id="customerEmail"
                        name="customerEmail"
                        autocomplete="email"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                        required
                        value="${escapeHtml(prevEmail)}"
                        placeholder="tu@correo.com"
                        class="x-input"
                      />
                    </div>
                    <div>
                      <label for="experienceLevel" class="x-label">Nivel / Experiencia</label>
                      <select id="experienceLevel" name="experienceLevel" class="x-input">
                        <option value="Primera vez (Principiante)" ${prevLevel === 'Primera vez (Principiante)' ? 'selected' : ''}>Primera vez (Principiante)</option>
                        <option value="Básico / Recreativo" ${prevLevel === 'Básico / Recreativo' ? 'selected' : ''}>Básico / Recreativo</option>
                        <option value="Intermedio / Avanzado" ${prevLevel === 'Intermedio / Avanzado' ? 'selected' : ''}>Intermedio / Avanzado</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label for="paymentMethod" class="x-label">Medio de Pago Usado *</label>
                      <select id="paymentMethod" name="paymentMethod" class="x-input">
                        <option value="Nequi" ${state.paymentMethod === 'Nequi' ? 'selected' : ''}>Nequi (3208504410)</option>
                        <option value="DaviPlata" ${state.paymentMethod === 'DaviPlata' ? 'selected' : ''}>DaviPlata (3208504410)</option>
                        ${
                          config.paymentInfo.bankAccount.enabled
                            ? `<option value="Transferencia Bancaria" ${state.paymentMethod === 'Transferencia Bancaria' ? 'selected' : ''}>Transferencia Bancaria</option>`
                            : ''
                        }
                      </select>
                    </div>
                    <div>
                      <label for="riderNotes" class="x-label">Edades / Notas (Opcional)</label>
                      <input
                        type="text"
                        id="riderNotes"
                        name="riderNotes"
                        value="${escapeHtml(prevNotes)}"
                        placeholder="Ej. Adulto y niño de 11 años"
                        class="x-input"
                      />
                    </div>
                  </div>

                  <!-- Subida de Comprobante de Pago -->
                  <div>
                    <label for="comprobante-file" class="x-label">
                      Subir Comprobante de Pago (Imagen o PDF - Máx. ${CONFIG.maxFileSizeMB} MB) *
                    </label>
                    <label
                      for="comprobante-file"
                      class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${
                        state.comprobanteFileName
                          ? 'border-lime-electric bg-lime-electric/10'
                          : 'border-white/25 bg-carbon/80 hover:border-lime-electric/60'
                      } p-4 text-center cursor-pointer transition-all"
                    >
                      <input
                        type="file"
                        id="comprobante-file"
                        name="comprobanteFile"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        class="sr-only"
                      />
                      ${
                        state.comprobanteFileName
                          ? `
                        <div class="flex items-center gap-2 text-lime-electric font-subtitle text-sm font-semibold">
                          <span>✓ Archivo cargado: ${escapeHtml(state.comprobanteFileName)}</span>
                        </div>
                        <span class="text-xs text-white/65 mt-1">Haz clic si deseas cambiar el comprobante</span>
                      `
                          : `
                        <svg class="h-8 w-8 text-lime-electric mb-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span class="font-subtitle text-xs font-semibold text-white">
                          Haz clic para adjuntar captura de Nequi / DaviPlata o PDF
                        </span>
                        <span class="text-[11px] text-white/50 mt-0.5">Formatos permitidos: JPG, PNG, WEBP o PDF</span>
                      `
                      }
                    </label>
                  </div>

                  <!-- Checkbox Tratamiento de Datos y Exoneración de Responsabilidad -->
                  <div class="rounded-xl border border-white/15 bg-carbon/90 p-3.5">
                    <div class="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptedTerms"
                        name="acceptedTerms"
                        ${state.acceptedTerms ? 'checked' : ''}
                        required
                        class="mt-1 h-5 w-5 rounded border-white/30 bg-carbon accent-[#B6FF00] cursor-pointer shrink-0"
                      />
                      <div class="text-xs text-white/85 leading-relaxed">
                        <label for="acceptedTerms" class="cursor-pointer">
                          He leído y acepto la
                        </label>
                        <button
                          type="button"
                          id="open-legal-modal-btn"
                          class="font-subtitle font-semibold text-lime-electric underline hover:text-lime-neon focus:outline-none ml-1"
                        >
                          Autorización de Tratamiento de Datos Personales y Exoneración de Responsabilidad
                        </button>
                        <span> de GREEN X PARK, y me comprometo a llegar 30 minutos antes de mi turno. *</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="submit-booking-btn"
                    ${!dayAvail.isOpen || state.isSubmitting ? 'disabled' : ''}
                    class="btn-x-primary w-full justify-center py-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>${
                      state.isSubmitting
                        ? 'PROCESANDO Y APARTANDO CUPO...'
                        : `CONFIRMAR Y APARTAR POR ${formatCOP(pricing.totalPrice)}`
                    }</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- MODAL NATIVO <dialog> DE TRATAMIENTO DE DATOS Y EXONERACIÓN DE RESPONSABILIDAD -->
      <dialog
        id="legal-modal"
        closedby="any"
        aria-labelledby="legal-modal-title"
        class="w-full max-w-2xl rounded-2xl border border-lime-electric/40 bg-carbon-card p-0 text-white shadow-2xl"
      >
        <div class="border-b border-white/10 bg-graphite/80 px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2.5">
            <span class="slash-stripes"><span></span><span></span><span></span></span>
            <h2 id="legal-modal-title" class="font-title text-lg sm:text-xl font-extrabold uppercase text-white">
              ${escapeHtml(config.legalTexts.modalTitle)}
            </h2>
          </div>
          <form method="dialog">
            <button
              type="submit"
              value="cancel"
              class="rounded-lg border border-white/15 bg-carbon/70 p-2 text-white/70 hover:text-white hover:border-lime-electric"
              aria-label="Cerrar ventana legal"
            >
              ✕
            </button>
          </form>
        </div>

        <div class="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-5 text-sm text-white/85 leading-relaxed">
          <div class="rounded-xl border border-lime-electric/30 bg-lime-electric/10 p-4 text-xs text-white/95">
            <strong class="text-lime-electric font-subtitle uppercase block mb-1">Puntualidad e Inducción:</strong>
            ${escapeHtml(config.legalTexts.arrivalNoticeText)}
          </div>

          <div class="space-y-2 whitespace-pre-line font-body">
            ${escapeHtml(config.legalTexts.dataTreatmentText)}
          </div>

          <div class="border-t border-white/10 pt-4 space-y-2 whitespace-pre-line font-body">
            ${escapeHtml(config.legalTexts.waiverText)}
          </div>
        </div>

        <div class="border-t border-white/10 bg-graphite/60 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <form method="dialog">
            <button
              type="submit"
              value="close"
              class="w-full sm:w-auto rounded-xl border border-white/20 bg-carbon px-5 py-2.5 font-subtitle text-xs font-semibold uppercase text-white/80 hover:text-white"
            >
              Cerrar
            </button>
          </form>
          <button
            type="button"
            id="accept-legal-modal-btn"
            autofocus
            class="btn-x-primary text-xs py-2.5 px-6"
          >
            ACEPTAR Y CONTINUAR CON MI RESERVA
          </button>
        </div>
      </dialog>

      ${renderFooter(config, true)}
    </div>
  `;

  initNavbarEvents();
  bindReservarInteractions(app, config, state, dayAvail, pricing, () => {
    const nextDayAvail = computeDayAvailability(state.date, config, []);
    void loadBookings().then((bks) => {
      const updatedAvail = computeDayAvailability(state.date, config, bks);
      ensureValidTimeSlotAndQuantity(state, updatedAvail);
      renderReservarView(app, config, state, updatedAvail);
    });
    void nextDayAvail;
  });
}

function bindReservarInteractions(
  app: HTMLElement,
  config: ParkConfig,
  state: BookingState,
  dayAvail: DayAvailabilitySummary,
  pricing: ReturnType<typeof calculateCurrentPricing>,
  triggerRerender: () => void
): void {
  // 1. Cambio de tipo de servicio
  app.querySelectorAll<HTMLButtonElement>('.service-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextService = btn.getAttribute('data-service') as ServiceType;
      if (!nextService || nextService === state.serviceType) return;
      state.serviceType = nextService;
      if (nextService === 'pitbike') {
        const firstPkg = config.pitBikePackages.find((p) => p.active) ?? config.pitBikePackages[0];
        state.packageId = firstPkg?.id || 'pitbike-15';
      } else if (nextService === 'practica_libre') {
        state.packageId = 'derecho-pista';
      } else {
        state.packageId = 'evento-privado';
      }
      state.quantity = 1;
      triggerRerender();
    });
  });

  // 2. Cambio de paquete de Pit Bike
  app.querySelectorAll<HTMLButtonElement>('.package-select-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.getAttribute('data-package');
      if (!pkgId || pkgId === state.packageId) return;
      state.packageId = pkgId;
      triggerRerender();
    });
  });

  // 3. Botones de fecha rápida y Datepicker
  app.querySelectorAll<HTMLButtonElement>('.quick-date-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const iso = btn.getAttribute('data-quick-date');
      if (!iso || iso === state.date) return;
      state.date = iso;
      triggerRerender();
    });
  });

  const dateInput = document.getElementById('booking-date-input') as HTMLInputElement | null;
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      if (dateInput.value) {
        state.date = parseSheetDate(dateInput.value);
        triggerRerender();
      }
    });
  }

  // 4. Selección de bloque horario
  app.querySelectorAll<HTMLButtonElement>('.slot-select-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = btn.getAttribute('data-slot');
      if (!slot || slot === state.timeSlot) return;
      state.timeSlot = slot;
      triggerRerender();
    });
  });

  // 5. Cantidad de cupos (- / +)
  const minusBtn = document.getElementById('qty-minus-btn');
  const plusBtn = document.getElementById('qty-plus-btn');
  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      if (state.quantity > 1) {
        state.quantity--;
        triggerRerender();
      }
    });
  }
  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      if (state.quantity < pricing.maxQuantity) {
        state.quantity++;
        triggerRerender();
      } else {
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: `Máximo ${pricing.maxQuantity} cupo(s) disponibles en este horario`,
          showConfirmButton: false,
          timer: 2200,
        });
      }
    });
  }

  // 6. Copiar cuentas Nequi / DaviPlata
  app.querySelectorAll<HTMLButtonElement>('.copy-acc-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const num = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(num);
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Número copiado: ${num}`,
          showConfirmButton: false,
          timer: 2000,
        });
      } catch {
        /* ignore */
      }
    });
  });

  // 7. Cambio de medio de pago y archivo comprobante
  const paySelect = document.getElementById('paymentMethod') as HTMLSelectElement | null;
  if (paySelect) {
    paySelect.addEventListener('change', () => {
      state.paymentMethod = paySelect.value;
    });
  }

  const fileInput = document.getElementById('comprobante-file') as HTMLInputElement | null;
  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const maxBytes = CONFIG.maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo demasiado grande',
          text: `El comprobante no debe superar los ${CONFIG.maxFileSizeMB} MB.`,
        });
        fileInput.value = '';
        return;
      }
      try {
        state.comprobanteDataUrl = await readFileAsDataUrl(file);
        state.comprobanteFileName = file.name;
        state.comprobanteFileType = file.type || 'image/jpeg';
        triggerRerender();
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al leer el archivo',
          text: err instanceof Error ? err.message : 'Intenta con otra imagen o PDF.',
        });
      }
    });
  }

  // 8. Modal <dialog> de Tratamiento de Datos y Exoneración (con fallback light-dismiss per modern-web-guidance)
  const legalDialog = document.getElementById('legal-modal') as HTMLDialogElement | null;
  const openLegalBtn = document.getElementById('open-legal-modal-btn');
  const acceptLegalBtn = document.getElementById('accept-legal-modal-btn');
  const termsCheckbox = document.getElementById('acceptedTerms') as HTMLInputElement | null;

  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', () => {
      state.acceptedTerms = termsCheckbox.checked;
    });
  }

  if (legalDialog && openLegalBtn) {
    openLegalBtn.addEventListener('click', () => {
      legalDialog.showModal();
    });

    // Fallback para closedby="any" en navegadores sin soporte nativo de closedBy
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (e: PointerEvent, dialog: HTMLDialogElement) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      let pressedOutside = false;
      legalDialog.addEventListener('pointerdown', (e) => {
        pressedOutside = isOutside(e, legalDialog);
      });
      legalDialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && isOutside(e, legalDialog)) {
          legalDialog.close();
        }
      });
    }
  }

  if (legalDialog && acceptLegalBtn) {
    acceptLegalBtn.addEventListener('click', () => {
      state.acceptedTerms = true;
      if (termsCheckbox) termsCheckbox.checked = true;
      legalDialog.close('accepted');
    });
  }

  // 9. Envío del formulario de reserva
  const form = document.getElementById('booking-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (state.isSubmitting) return;

      const customerName =
        (document.getElementById('customerName') as HTMLInputElement | null)?.value.trim() ?? '';
      const customerDocument =
        (document.getElementById('customerDocument') as HTMLInputElement | null)?.value.trim() ?? '';
      const customerPhone =
        (document.getElementById('customerPhone') as HTMLInputElement | null)?.value.trim() ?? '';
      const customerEmail =
        (document.getElementById('customerEmail') as HTMLInputElement | null)?.value.trim() ?? '';
      const experienceLevel =
        (document.getElementById('experienceLevel') as HTMLSelectElement | null)?.value ??
        'Primera vez (Principiante)';
      const riderNotes =
        (document.getElementById('riderNotes') as HTMLInputElement | null)?.value.trim() ?? '';
      const paymentMethod =
        (document.getElementById('paymentMethod') as HTMLSelectElement | null)?.value ?? 'Nequi';

      if (!dayAvail.isOpen || !state.timeSlot) {
        await Swal.fire({
          icon: 'warning',
          title: 'Selecciona un horario disponible',
          text: 'Por favor elige una fecha y una hora con cupos libres antes de continuar.',
        });
        return;
      }

      if (!customerName || !customerDocument || !customerPhone || !customerEmail) {
        await Swal.fire({
          icon: 'warning',
          title: 'Datos incompletos',
          text: 'Por favor completa tu nombre, documento, celular (WhatsApp) y correo electrónico.',
        });
        return;
      }

      if (!state.comprobanteDataUrl) {
        await Swal.fire({
          icon: 'warning',
          title: 'Falta el comprobante de pago',
          text: 'Por favor adjunta la captura o PDF de tu transferencia a Nequi o DaviPlata para apartar tu hora.',
        });
        return;
      }

      if (!state.acceptedTerms) {
        await Swal.fire({
          icon: 'warning',
          title: 'Autorización requerida',
          text: 'Debes aceptar la Autorización de Tratamiento de Datos y Exoneración de Responsabilidad para continuar.',
        });
        return;
      }

      try {
        state.isSubmitting = true;
        triggerRerender();

        const created = await createBooking({
          serviceType: state.serviceType,
          serviceLabel: pricing.serviceLabel,
          packageId: state.packageId,
          packageLabel: pricing.packageLabel,
          date: state.date,
          timeSlot: state.timeSlot,
          quantity: state.quantity,
          unitPrice: pricing.unitPrice,
          totalPrice: pricing.totalPrice,
          customerName,
          customerDocument,
          customerPhone,
          customerEmail,
          experienceLevel,
          riderNotes,
          paymentMethod,
          comprobanteArchivo: state.comprobanteDataUrl,
          comprobanteFileName: state.comprobanteFileName,
          comprobanteFileType: state.comprobanteFileType,
          acceptedTerms: true,
        });

        state.isSubmitting = false;
        state.comprobanteDataUrl = '';
        state.comprobanteFileName = '';
        state.comprobanteFileType = '';

        const wppClean = config.paymentInfo.whatsappNumber.replace(/\D/g, '') || '3208504410';
        const wppText = encodeURIComponent(
          `¡Hola GREEN X PARK! Acabo de realizar mi reserva en línea:\n` +
            `• Código: ${created.code}\n` +
            `• Servicio: ${created.packageLabel}\n` +
            `• Fecha: ${created.date} a las ${formatTime12h(created.timeSlot)}\n` +
            `• Cupos: ${created.quantity}\n` +
            `• Total: ${formatCOP(created.totalPrice)}\n` +
            `• Titular: ${created.customerName}`
        );

        await Swal.fire({
          icon: 'success',
          title: '¡TU HORA HA QUEDADO APARTADA!',
          html: `
            <div class="text-left space-y-3 text-sm">
              <div class="rounded-xl border border-[#B6FF00]/50 bg-black/60 p-4 text-center">
                <span class="block text-xs uppercase text-gray-400">Código Oficial de Reserva</span>
                <span class="font-bold text-2xl text-[#B6FF00] tracking-widest">${escapeHtml(created.code)}</span>
              </div>
              <p><strong>Cliente:</strong> ${escapeHtml(created.customerName)}</p>
              <p><strong>Experiencia:</strong> ${escapeHtml(created.packageLabel)}</p>
              <p><strong>Fecha y Hora:</strong> ${escapeHtml(created.date)} — ${escapeHtml(formatTime12h(created.timeSlot))}</p>
              <p><strong>Cupos apartados:</strong> ${created.quantity} (${formatCOP(created.totalPrice)})</p>
              <div class="rounded-lg bg-[#B6FF00]/15 border border-[#B6FF00]/40 p-3 text-xs text-white">
                <strong>IMPORTANTE:</strong> Recuerda llegar <strong>30 minutos antes</strong> de la hora de tu reserva para realizar tu inducción de 10 minutos y preparación.
              </div>
              <div class="pt-2 text-center">
                <a
                  href="https://wa.me/57${wppClean}?text=${wppText}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 font-semibold text-white text-xs hover:opacity-90"
                >
                  Enviar copia de mi código por WhatsApp (Opcional)
                </a>
              </div>
            </div>
          `,
          confirmButtonText: 'ENTENDIDO',
        });

        triggerRerender();
      } catch (err) {
        state.isSubmitting = false;
        triggerRerender();
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo completar la reserva',
          text: err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
        });
      }
    });
  }
}

