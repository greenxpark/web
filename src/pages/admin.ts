import Swal from 'sweetalert2';
import { CONFIG } from '../config';
import { DEFAULT_PARK_CONFIG } from '../content/default-config';
import type { Booking, BookingStatus, ParkConfig, PitBikePackage } from '../types';
import { isApiEnabled } from '../utils/api';
import { exportBookingsToCsv, exportBookingsToExcel } from '../utils/export-bookings';
import {
  escapeHtml,
  formatCOP,
  formatTime12h,
  getTodayISO,
  parseSheetDate,
} from '../utils/format';
import {
  deleteBooking,
  getCachedParkConfigSync,
  loadBookings,
  loadParkConfig,
  saveParkConfig,
  updateBooking,
} from '../utils/storage';

type AdminTab = 'bookings' | 'pricing' | 'schedule' | 'legal';

interface AdminState {
  authenticated: boolean;
  activeTab: AdminTab;
  filterDate: string;
  filterService: string;
  filterStatus: string;
  searchQuery: string;
  scheduleInspectDate: string;
  isSaving: boolean;
}

export function initAdminPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const savedSession =
    sessionStorage.getItem(CONFIG.storageKeys.adminSession) === 'true' &&
    Boolean(sessionStorage.getItem(CONFIG.storageKeys.adminPassword));

  const state: AdminState = {
    authenticated: savedSession,
    activeTab: 'bookings',
    filterDate: '',
    filterService: 'all',
    filterStatus: 'all',
    searchQuery: '',
    scheduleInspectDate: getTodayISO(),
    isSaving: false,
  };

  let config = getCachedParkConfigSync();
  let bookings: Booking[] = [];

  const refreshAllData = async (throwOnError = false) => {
    try {
      const [freshCfg, freshBookings] = await Promise.all([
        loadParkConfig({ forceRefresh: true }),
        loadBookings({ forceRefresh: true, throwOnError: true }),
      ]);
      config = freshCfg;
      bookings = freshBookings;
      render();
    } catch (err) {
      if (err instanceof Error && err.message === 'No autorizado') {
        sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
        sessionStorage.removeItem(CONFIG.storageKeys.adminPassword);
        state.authenticated = false;
        render();
        await Swal.fire({
          icon: 'error',
          title: 'Contraseña incorrecta',
          text: 'La clave ingresada no coincide con ADMIN_PASSWORD configurada en Google Apps Script.',
        });
        return;
      }
      if (throwOnError) throw err;
    }
  };

  const render = () => {
    if (!state.authenticated) {
      renderLoginScreen(app, async (pwd) => {
        sessionStorage.setItem(CONFIG.storageKeys.adminPassword, pwd);
        try {
          void Swal.fire({
            title: 'Verificando credenciales...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading(),
          });
          await refreshAllData(true);
          sessionStorage.setItem(CONFIG.storageKeys.adminSession, 'true');
          state.authenticated = true;
          Swal.close();
          render();
        } catch (err) {
          sessionStorage.removeItem(CONFIG.storageKeys.adminPassword);
          sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
          state.authenticated = false;
          Swal.close();
          await Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text:
              err instanceof Error && err.message === 'No autorizado'
                ? 'Contraseña incorrecta.'
                : err instanceof Error
                ? err.message
                : 'No se pudo verificar la contraseña con el servidor.',
          });
        }
      });
      return;
    }

    renderDashboard(app, config, bookings, state, {
      onRefresh: refreshAllData,
      onConfigSave: async (nextCfg) => {
        state.isSaving = true;
        render();
        try {
          config = await saveParkConfig(nextCfg);
          state.isSaving = false;
          render();
          await Swal.fire({
            icon: 'success',
            title: 'Configuración guardada',
            text: 'Los cambios ya están activos en toda la página web.',
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (err) {
          state.isSaving = false;
          render();
          await Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: err instanceof Error ? err.message : 'No se pudo guardar la configuración.',
          });
        }
      },
      onBookingsChange: async () => {
        bookings = await loadBookings({ forceRefresh: true });
        render();
      },
    });
  };

  render();
  if (state.authenticated) {
    void refreshAllData();
  }
}

function renderLoginScreen(
  app: HTMLElement,
  onLogin: (password: string) => Promise<void>
): void {
  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-track-grid px-4 py-12 text-white">
      <div class="w-full max-w-md x-card-featured p-8 space-y-6">
        <div class="text-center space-y-3">
          <div class="mx-auto inline-block rounded-xl border border-lime-electric/40 bg-black p-3 shadow-lime-glow">
            <img src="./logo-green-x-park.jpeg" alt="GREEN X PARK" class="h-14 w-auto object-contain" />
          </div>
          <h1 class="font-title text-2xl sm:text-3xl font-extrabold uppercase italic text-white">
            PANEL DE <span class="text-lime-electric">ADMINISTRACIÓN</span>
          </h1>
          <p class="text-xs text-white/65 font-body">
            Gestión de reservas, cupos por hora, tarifas, horarios y textos legales de GREEN X PARK.
          </p>
        </div>

        <form id="admin-login-form" class="space-y-4">
          <div>
            <label for="admin-password-input" class="x-label">Contraseña de Administrador</label>
            <input
              type="password"
              id="admin-password-input"
              name="password"
              autocomplete="current-password"
              required
              placeholder="Ingresa tu clave de acceso"
              class="x-input"
            />
          </div>
          <button type="submit" class="btn-x-primary w-full justify-center py-3.5 text-sm">
            INGRESAR AL PANEL
          </button>
        </form>

        <div class="text-center pt-2 border-t border-white/10">
          <a href="./index.html" class="font-subtitle text-xs font-semibold text-white/60 hover:text-lime-electric">
            ← Volver al sitio público
          </a>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('admin-login-form') as HTMLFormElement | null;
  const input = document.getElementById('admin-password-input') as HTMLInputElement | null;
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input?.value.trim() ?? '';
    if (val) void onLogin(val);
  });
}

function renderDashboard(
  app: HTMLElement,
  config: ParkConfig,
  bookings: Booking[],
  state: AdminState,
  handlers: {
    onRefresh: () => Promise<void>;
    onConfigSave: (cfg: ParkConfig) => Promise<void>;
    onBookingsChange: () => Promise<void>;
  }
): void {
  const activeBookings = bookings.filter((b) => b.status !== 'cancelada');
  const pendingCount = bookings.filter((b) => b.status === 'pendiente').length;
  const confirmedRevenue = activeBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const todayISO = getTodayISO();
  const todayBookingsCount = activeBookings.filter((b) => parseSheetDate(b.date) === todayISO).length;

  const tabBtnClass = (tab: AdminTab) =>
    state.activeTab === tab
      ? 'rounded-xl border-2 border-lime-electric bg-lime-electric text-carbon font-title font-extrabold uppercase text-xs sm:text-sm px-4 py-2.5 shadow-lime-glow'
      : 'rounded-xl border border-white/15 bg-graphite/70 text-white/80 font-subtitle font-semibold uppercase text-xs sm:text-sm px-4 py-2.5 hover:border-lime-electric/50 hover:text-white transition-colors';

  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-track-grid text-white">
      <!-- Top Bar Admin -->
      <header class="sticky top-0 z-30 border-b border-lime-electric/30 bg-carbon/95 backdrop-blur-xl px-4 py-3.5 sm:px-6 lg:px-8">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <a href="./index.html" class="rounded-lg border border-lime-electric/40 bg-black px-2 py-1">
              <img src="./logo-green-x-park.jpeg" alt="GREEN X PARK" class="h-9 w-auto object-contain" />
            </a>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="font-title text-lg sm:text-xl font-extrabold uppercase text-white">
                  COMMAND CENTER • <span class="text-lime-electric">GREEN X PARK</span>
                </h1>
                <span class="rounded-full px-2.5 py-0.5 text-[10px] font-subtitle font-semibold uppercase ${
                  isApiEnabled()
                    ? 'bg-lime-electric/20 text-lime-electric border border-lime-electric/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }">
                  ${isApiEnabled() ? 'Google Sheets Conectado' : 'Modo Local (localStorage)'}
                </span>
              </div>
              <p class="text-xs text-white/60">Administración de Reservas, Costos, Horarios y Exoneración</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            ${
              CONFIG.spreadsheetUrl
                ? `<a href="${escapeHtml(CONFIG.spreadsheetUrl)}" target="_blank" rel="noopener noreferrer" class="rounded-xl border border-lime-electric/40 bg-lime-electric/10 px-3.5 py-2 font-subtitle text-xs font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon">
                    Abrir Google Sheet ↗
                  </a>`
                : ''
            }
            <button
              type="button"
              id="admin-refresh-btn"
              class="rounded-xl border border-white/20 bg-graphite px-3.5 py-2 font-subtitle text-xs font-semibold text-white hover:border-lime-electric"
            >
              ↻ Sincronizar
            </button>
            <a
              href="./reservar.html"
              class="rounded-xl border border-white/20 bg-graphite px-3.5 py-2 font-subtitle text-xs font-semibold text-lime-neon hover:border-lime-electric"
            >
              Ver Página Reservas
            </a>
            <button
              type="button"
              id="admin-logout-btn"
              class="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 font-subtitle text-xs font-semibold text-red-300 hover:bg-red-500/20"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <!-- KPIs Rápidos -->
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="x-card p-5 border-l-4 border-l-lime-electric">
            <span class="font-subtitle text-xs uppercase text-white/60">Reservas Activas</span>
            <p class="font-title text-3xl font-extrabold text-white mt-1">${activeBookings.length}</p>
            <span class="text-[11px] text-lime-electric">${todayBookingsCount} programadas para hoy (${todayISO})</span>
          </div>

          <div class="x-card p-5 border-l-4 border-l-amber-400">
            <span class="font-subtitle text-xs uppercase text-white/60">Por Verificar Pago</span>
            <p class="font-title text-3xl font-extrabold text-amber-300 mt-1">${pendingCount}</p>
            <span class="text-[11px] text-white/60">El cupo ya está apartado</span>
          </div>

          <div class="x-card p-5 border-l-4 border-l-lime-racing">
            <span class="font-subtitle text-xs uppercase text-white/60">Total Recaudado Activo</span>
            <p class="font-title text-2xl sm:text-3xl font-extrabold text-lime-electric mt-1">${formatCOP(confirmedRevenue)}</p>
            <span class="text-[11px] text-white/60">Suma de reservas confirmadas + pendientes</span>
          </div>

          <div class="x-card p-5 border-l-4 border-l-white">
            <span class="font-subtitle text-xs uppercase text-white/60">Capacidad Pit Bikes</span>
            <p class="font-title text-3xl font-extrabold text-white mt-1">${config.schedule.pitBikeCapacityPerHour} <span class="text-base font-subtitle text-lime-electric">motos/hora</span></p>
            <span class="text-[11px] text-white/60">Editable en la pestaña Horarios</span>
          </div>
        </section>

        <!-- Selector de Pestañas -->
        <nav class="flex flex-wrap items-center gap-2.5 border-b border-white/10 pb-4" aria-label="Secciones del panel">
          <button type="button" data-tab="bookings" class="admin-tab-btn ${tabBtnClass('bookings')}">
            1. Reservas (${bookings.length})
          </button>
          <button type="button" data-tab="pricing" class="admin-tab-btn ${tabBtnClass('pricing')}">
            2. Costos y Tarifas
          </button>
          <button type="button" data-tab="schedule" class="admin-tab-btn ${tabBtnClass('schedule')}">
            3. Horarios Disponibles y Cupos
          </button>
          <button type="button" data-tab="legal" class="admin-tab-btn ${tabBtnClass('legal')}">
            4. Medios de Pago y Exoneración
          </button>
        </nav>

        <!-- Contenido de la Pestaña Activa -->
        <div id="admin-tab-content">
          ${
            state.activeTab === 'bookings'
              ? renderBookingsTab(bookings, config, state)
              : state.activeTab === 'pricing'
              ? renderPricingTab(config, state)
              : state.activeTab === 'schedule'
              ? renderScheduleTab(config, bookings, state)
              : renderLegalAndPaymentsTab(config, state)
          }
        </div>
      </main>
    </div>
  `;

  // Eventos Globales del Header y Pestañas
  document.getElementById('admin-refresh-btn')?.addEventListener('click', () => {
    void handlers.onRefresh();
  });

  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
    sessionStorage.removeItem(CONFIG.storageKeys.adminPassword);
    state.authenticated = false;
    initAdminPage();
  });

  app.querySelectorAll<HTMLButtonElement>('.admin-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = btn.getAttribute('data-tab') as AdminTab;
      if (nextTab && nextTab !== state.activeTab) {
        state.activeTab = nextTab;
        renderDashboard(app, config, bookings, state, handlers);
      }
    });
  });

  // Bind específico de la pestaña activa
  if (state.activeTab === 'bookings') {
    bindBookingsTabEvents(app, bookings, config, state, () =>
      renderDashboard(app, config, bookings, state, handlers),
      handlers.onBookingsChange
    );
  } else if (state.activeTab === 'pricing') {
    bindPricingTabEvents(app, config, handlers.onConfigSave);
  } else if (state.activeTab === 'schedule') {
    bindScheduleTabEvents(app, config, bookings, state, () =>
      renderDashboard(app, config, bookings, state, handlers),
      handlers.onConfigSave
    );
  } else if (state.activeTab === 'legal') {
    bindLegalAndPaymentsEvents(app, config, handlers.onConfigSave);
  }
}

// ─── PESTAÑA 1: GESTIÓN DE RESERVAS ──────────────────────────────────────────

function renderBookingsTab(
  bookings: Booking[],
  _config: ParkConfig,
  state: AdminState
): string {
  const filtered = bookings.filter((b) => {
    if (state.filterDate && parseSheetDate(b.date) !== state.filterDate) return false;
    if (state.filterService !== 'all' && b.serviceType !== state.filterService) return false;
    if (state.filterStatus !== 'all' && b.status !== state.filterStatus) return false;
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const hay = `${b.code} ${b.customerName} ${b.customerDocument} ${b.customerPhone} ${b.customerEmail} ${b.packageLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return `
    <div class="space-y-6">
      <!-- Barra de Filtros y Exportación -->
      <div class="x-card p-5 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="lg:col-span-2">
            <label for="filter-search" class="x-label">Buscar cliente / código / cédula</label>
            <input
              type="search"
              id="filter-search"
              value="${escapeHtml(state.searchQuery)}"
              placeholder="Ej. GXP-, nombre, cédula o celular..."
              class="x-input text-sm"
            />
          </div>
          <div>
            <label for="filter-date" class="x-label">Filtrar por Fecha</label>
            <input
              type="date"
              id="filter-date"
              value="${escapeHtml(state.filterDate)}"
              class="x-input text-sm"
            />
          </div>
          <div>
            <label for="filter-service" class="x-label">Servicio</label>
            <select id="filter-service" class="x-input text-sm">
              <option value="all" ${state.filterService === 'all' ? 'selected' : ''}>Todos los servicios</option>
              <option value="pitbike" ${state.filterService === 'pitbike' ? 'selected' : ''}>Alquiler Pit Bikes</option>
              <option value="practica_libre" ${state.filterService === 'practica_libre' ? 'selected' : ''}>Práctica Libre</option>
              <option value="evento_privado" ${state.filterService === 'evento_privado' ? 'selected' : ''}>Eventos Privados</option>
            </select>
          </div>
          <div>
            <label for="filter-status" class="x-label">Estado</label>
            <select id="filter-status" class="x-input text-sm">
              <option value="all" ${state.filterStatus === 'all' ? 'selected' : ''}>Todos los estados</option>
              <option value="pendiente" ${state.filterStatus === 'pendiente' ? 'selected' : ''}>Pendiente de revisión</option>
              <option value="confirmada" ${state.filterStatus === 'confirmada' ? 'selected' : ''}>Confirmada</option>
              <option value="cancelada" ${state.filterStatus === 'cancelada' ? 'selected' : ''}>Cancelada (Cupo libre)</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div class="flex items-center gap-2 text-xs text-white/70">
            <span>Mostrando <strong>${filtered.length}</strong> de ${bookings.length} reservas</span>
            ${
              state.filterDate || state.filterService !== 'all' || state.filterStatus !== 'all' || state.searchQuery
                ? `<button type="button" id="clear-filters-btn" class="text-lime-electric underline ml-2">Limpiar filtros</button>`
                : ''
            }
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              id="export-excel-btn"
              class="rounded-xl border border-lime-electric/40 bg-lime-electric/15 px-3.5 py-2 font-subtitle text-xs font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
            >
              ⬇ Exportar Excel (.xlsx)
            </button>
            <button
              type="button"
              id="export-csv-btn"
              class="rounded-xl border border-white/20 bg-carbon px-3.5 py-2 font-subtitle text-xs font-semibold text-white hover:border-lime-electric"
            >
              ⬇ Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla de Reservas -->
      ${
        filtered.length === 0
          ? `
        <div class="x-card p-12 text-center space-y-3">
          <p class="font-title text-2xl font-extrabold uppercase text-white/60">No hay reservas que coincidan</p>
          <p class="text-sm text-white/50">Las reservas realizadas desde la página aparecerán aquí automáticamente.</p>
        </div>
      `
          : `
        <div class="x-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-white/15 bg-carbon/90 font-subtitle text-xs font-semibold uppercase tracking-wider text-lime-electric">
                  <th class="py-3.5 px-4">Código / Estado</th>
                  <th class="py-3.5 px-4">Fecha y Hora</th>
                  <th class="py-3.5 px-4">Servicio y Cupos</th>
                  <th class="py-3.5 px-4">Cliente y Contacto</th>
                  <th class="py-3.5 px-4">Pago / Comprobante</th>
                  <th class="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                ${filtered
                  .map((b) => {
                    const statusBadge =
                      b.status === 'confirmada'
                        ? 'bg-lime-electric/20 text-lime-electric border-lime-electric/40'
                        : b.status === 'cancelada'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/40';

                    const wppPhone = b.customerPhone.replace(/\D/g, '');
                    const wppMsg = encodeURIComponent(
                      `¡Hola ${b.customerName}! Te escribimos de GREEN X PARK sobre tu reserva ${b.code} (${b.packageLabel}) para el día ${b.date} a las ${formatTime12h(b.timeSlot)}. ¡Tu cupo está confirmado! Recuerda llegar 30 minutos antes.`
                    );

                    return `
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-4 px-4 align-top">
                          <span class="font-title text-base font-extrabold text-white block">${escapeHtml(b.code)}</span>
                          <select
                            data-status-id="${escapeHtml(b.id)}"
                            class="booking-status-select mt-1.5 rounded-lg border px-2.5 py-1 font-subtitle text-xs font-semibold uppercase ${statusBadge} bg-carbon cursor-pointer"
                          >
                            <option value="pendiente" ${b.status === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                            <option value="confirmada" ${b.status === 'confirmada' ? 'selected' : ''}>✓ Confirmada</option>
                            <option value="cancelada" ${b.status === 'cancelada' ? 'selected' : ''}>✕ Cancelada</option>
                          </select>
                        </td>

                        <td class="py-4 px-4 align-top whitespace-nowrap">
                          <span class="font-subtitle font-semibold text-white block">${escapeHtml(b.date)}</span>
                          <span class="font-title text-base font-extrabold text-lime-electric">${escapeHtml(formatTime12h(b.timeSlot))}</span>
                        </td>

                        <td class="py-4 px-4 align-top">
                          <span class="font-subtitle font-semibold text-white block">${escapeHtml(b.packageLabel)}</span>
                          <span class="text-xs text-lime-neon font-subtitle">
                            ${b.quantity} ${b.quantity === 1 ? 'cupo/moto' : 'cupos/motos'} • <strong>${formatCOP(b.totalPrice)}</strong>
                          </span>
                          ${
                            b.riderNotes
                              ? `<p class="text-xs text-white/60 mt-1">Nota: ${escapeHtml(b.riderNotes)}</p>`
                              : ''
                          }
                        </td>

                        <td class="py-4 px-4 align-top">
                          <span class="font-subtitle font-semibold text-white block">${escapeHtml(b.customerName)}</span>
                          <span class="text-xs text-white/70 block">ID: ${escapeHtml(b.customerDocument)}</span>
                          <span class="text-xs text-white/70 block">${escapeHtml(b.customerEmail)}</span>
                          <div class="mt-1.5 flex items-center gap-2">
                            <a
                              href="https://wa.me/57${wppPhone}?text=${wppMsg}"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 rounded bg-[#25D366]/20 border border-[#25D366]/40 px-2 py-0.5 text-[11px] font-subtitle font-semibold text-[#25D366] hover:bg-[#25D366] hover:text-white"
                            >
                              WhatsApp: ${escapeHtml(b.customerPhone)}
                            </a>
                          </div>
                        </td>

                        <td class="py-4 px-4 align-top">
                          <span class="font-subtitle text-xs uppercase text-white/80 block">
                            Vía: <strong>${escapeHtml(b.paymentMethod)}</strong>
                          </span>
                          ${
                            b.comprobanteUrl
                              ? b.comprobanteUrl.startsWith('http')
                                ? `<a
                                    href="${escapeHtml(b.comprobanteUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-3 py-1.5 font-subtitle text-xs font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon"
                                  >
                                    Ver Comprobante Drive ↗
                                  </a>`
                                : `<button
                                    type="button"
                                    data-preview-id="${escapeHtml(b.id)}"
                                    class="preview-comprobante-btn mt-1.5 inline-flex items-center gap-1 rounded-lg border border-lime-electric/40 bg-lime-electric/15 px-3 py-1.5 font-subtitle text-xs font-semibold text-lime-electric hover:bg-lime-electric hover:text-carbon"
                                  >
                                    Ver Comprobante
                                  </button>`
                              : `<span class="text-xs text-white/40">Sin archivo</span>`
                          }
                        </td>

                        <td class="py-4 px-4 align-top text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            data-edit-id="${escapeHtml(b.id)}"
                            class="edit-booking-btn rounded-lg border border-white/20 bg-carbon px-3 py-1.5 font-subtitle text-xs font-semibold text-white hover:border-lime-electric hover:text-lime-electric"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            data-delete-id="${escapeHtml(b.id)}"
                            class="delete-booking-btn rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-subtitle text-xs font-semibold text-red-300 hover:bg-red-500/25"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
      }
    </div>
  `;
}

function bindBookingsTabEvents(
  app: HTMLElement,
  bookings: Booking[],
  _config: ParkConfig,
  state: AdminState,
  rerender: () => void,
  onBookingsChange: () => Promise<void>
): void {
  const searchInput = document.getElementById('filter-search') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    rerender();
    const nextSearch = document.getElementById('filter-search') as HTMLInputElement | null;
    if (nextSearch) {
      nextSearch.focus();
      nextSearch.setSelectionRange(nextSearch.value.length, nextSearch.value.length);
    }
  });

  const dateFilter = document.getElementById('filter-date') as HTMLInputElement | null;
  dateFilter?.addEventListener('change', () => {
    state.filterDate = dateFilter.value;
    rerender();
  });

  const serviceFilter = document.getElementById('filter-service') as HTMLSelectElement | null;
  serviceFilter?.addEventListener('change', () => {
    state.filterService = serviceFilter.value;
    rerender();
  });

  const statusFilter = document.getElementById('filter-status') as HTMLSelectElement | null;
  statusFilter?.addEventListener('change', () => {
    state.filterStatus = statusFilter.value;
    rerender();
  });

  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    state.filterDate = '';
    state.filterService = 'all';
    state.filterStatus = 'all';
    state.searchQuery = '';
    rerender();
  });

  document.getElementById('export-excel-btn')?.addEventListener('click', () => {
    exportBookingsToExcel(bookings);
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    exportBookingsToCsv(bookings);
  });

  // Cambio rápido de estado
  app.querySelectorAll<HTMLSelectElement>('.booking-status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.getAttribute('data-status-id');
      const nextStatus = sel.value as BookingStatus;
      if (!id) return;
      try {
        await updateBooking(id, { status: nextStatus });
        await onBookingsChange();
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Estado actualizado a ${nextStatus.toUpperCase()}`,
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar estado',
          text: err instanceof Error ? err.message : '',
        });
      }
    });
  });

  // Previsualizar comprobante Base64 en modo local
  app.querySelectorAll<HTMLButtonElement>('.preview-comprobante-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-preview-id');
      const booking = bookings.find((b) => b.id === id);
      if (!booking || !booking.comprobanteUrl) return;

      const isPdf =
        booking.comprobanteFileType.includes('pdf') ||
        booking.comprobanteUrl.startsWith('data:application/pdf');

      void Swal.fire({
        title: `Comprobante • ${booking.code}`,
        html: isPdf
          ? `<iframe src="${booking.comprobanteUrl}" class="w-full h-96 rounded-lg border border-white/20"></iframe>`
          : `<img src="${booking.comprobanteUrl}" alt="Comprobante" class="max-h-[70vh] mx-auto rounded-lg border border-white/20 object-contain" />`,
        width: 680,
        confirmButtonText: 'Cerrar',
      });
    });
  });

  // Editar Reserva (Modal)
  app.querySelectorAll<HTMLButtonElement>('.edit-booking-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit-id');
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      const { value: formValues } = await Swal.fire({
        title: `Editar Reserva ${booking.code}`,
        html: `
          <div class="text-left space-y-3 text-sm">
            <div>
              <label class="block text-xs uppercase text-gray-400 mb-1">Fecha (YYYY-MM-DD)</label>
              <input id="swal-edit-date" type="date" value="${escapeHtml(booking.date)}" class="x-input" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs uppercase text-gray-400 mb-1">Hora (Ej. 09:00)</label>
                <input id="swal-edit-time" type="text" value="${escapeHtml(booking.timeSlot)}" class="x-input" />
              </div>
              <div>
                <label class="block text-xs uppercase text-gray-400 mb-1">Cupos / Motos</label>
                <input id="swal-edit-qty" type="number" min="1" max="50" value="${booking.quantity}" class="x-input" />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase text-gray-400 mb-1">Total Pagado (COP)</label>
              <input id="swal-edit-total" type="number" min="0" step="1000" value="${booking.totalPrice}" class="x-input" />
            </div>
            <div>
              <label class="block text-xs uppercase text-gray-400 mb-1">Notas de Administración</label>
              <input id="swal-edit-notes" type="text" value="${escapeHtml(booking.adminNotes || '')}" class="x-input" placeholder="Ej. Pago verificado en Nequi" />
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          return {
            date: (document.getElementById('swal-edit-date') as HTMLInputElement).value,
            timeSlot: (document.getElementById('swal-edit-time') as HTMLInputElement).value.trim(),
            quantity: Number((document.getElementById('swal-edit-qty') as HTMLInputElement).value) || 1,
            totalPrice: Number((document.getElementById('swal-edit-total') as HTMLInputElement).value) || 0,
            adminNotes: (document.getElementById('swal-edit-notes') as HTMLInputElement).value.trim(),
          };
        },
      });

      if (formValues) {
        await updateBooking(booking.id, formValues);
        await onBookingsChange();
      }
    });
  });

  // Eliminar Reserva
  app.querySelectorAll<HTMLButtonElement>('.delete-booking-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-id');
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      const res = await Swal.fire({
        icon: 'warning',
        title: `¿Eliminar reserva ${booking.code}?`,
        text: `Se liberarán los ${booking.quantity} cupo(s) del día ${booking.date} (${formatTime12h(booking.timeSlot)}).`,
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (res.isConfirmed) {
        await deleteBooking(booking.id);
        await onBookingsChange();
      }
    });
  });
}

// ─── PESTAÑA 2: COSTOS, TARIFAS Y PAQUETES ───────────────────────────────────

function renderPricingTab(config: ParkConfig, state: AdminState): string {
  return `
    <div class="space-y-8">
      <!-- 1. Paquetes de Alquiler de Pit Bikes -->
      <section class="x-card p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span class="x-badge-solid">VIVE LA EXPERIENCIA</span>
            <h2 class="font-title text-2xl font-extrabold uppercase italic text-white mt-1">
              TARIFAS DE ALQUILER DE PIT BIKES
            </h2>
            <p class="text-xs text-white/60">Modifica los tiempos de conducción, precios en COP o agrega nuevos paquetes.</p>
          </div>
          <button
            type="button"
            id="add-package-btn"
            class="rounded-xl border border-lime-electric bg-lime-electric/15 px-4 py-2.5 font-subtitle text-xs font-semibold uppercase text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
          >
            + Añadir Paquete de Tiempo
          </button>
        </div>

        <div id="packages-editor-list" class="space-y-4">
          ${config.pitBikePackages
            .map(
              (pkg, idx) => `
            <div class="pkg-row rounded-xl border border-white/15 bg-carbon/90 p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center" data-pkg-index="${idx}">
              <div class="md:col-span-2">
                <label class="x-label">Etiqueta Tiempo</label>
                <input type="text" class="pkg-label x-input text-sm" value="${escapeHtml(pkg.label)}" placeholder="Ej. 15 minutos" />
              </div>
              <div class="md:col-span-2">
                <label class="x-label">Minutos</label>
                <input type="number" class="pkg-minutes x-input text-sm" value="${pkg.durationMinutes}" min="5" step="5" />
              </div>
              <div class="md:col-span-2">
                <label class="x-label">Precio (COP)</label>
                <input type="number" class="pkg-price x-input text-sm font-bold text-lime-electric" value="${pkg.price}" min="0" step="1000" />
              </div>
              <div class="md:col-span-2">
                <label class="x-label">Insignia / Badge</label>
                <input type="text" class="pkg-badge x-input text-sm" value="${escapeHtml(pkg.badge || '')}" placeholder="Ej. MÁS POPULAR" />
              </div>
              <div class="md:col-span-3">
                <label class="x-label">Descripción breve</label>
                <input type="text" class="pkg-desc x-input text-sm" value="${escapeHtml(pkg.description)}" />
              </div>
              <div class="md:col-span-1 flex items-center justify-end gap-2 pt-4">
                <label class="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" class="pkg-active h-4 w-4 accent-[#B6FF00]" ${pkg.active ? 'checked' : ''} />
                  <span>Activo</span>
                </label>
                <button
                  type="button"
                  data-remove-pkg="${idx}"
                  class="remove-pkg-btn text-red-400 hover:text-red-300 p-1"
                  title="Eliminar paquete"
                >
                  ✕
                </button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- 2. Práctica Libre y Eventos Privados -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section class="x-card p-6 sm:p-7 space-y-4">
          <span class="x-badge">MOTO PROPIA</span>
          <h3 class="font-title text-xl font-extrabold uppercase italic text-white">
            PRÁCTICA LIBRE (DERECHO A PISTA)
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="free-practice-price" class="x-label">Valor Derecho a Pista (COP)</label>
              <input
                type="number"
                id="free-practice-price"
                value="${config.freePractice.price}"
                step="1000"
                class="x-input font-bold text-lime-electric"
              />
            </div>
            <div>
              <label for="free-practice-slots" class="x-label">Cupos Máximos por Día</label>
              <input
                type="number"
                id="free-practice-slots"
                value="${config.freePractice.maxDailySlots}"
                min="1"
                class="x-input"
              />
            </div>
          </div>
          <div>
            <label for="free-practice-desc" class="x-label">Descripción Práctica Libre</label>
            <textarea id="free-practice-desc" rows="2" class="x-input text-sm">${escapeHtml(config.freePractice.description)}</textarea>
          </div>
        </section>

        <section class="x-card p-6 sm:p-7 space-y-4">
          <span class="x-badge">ESCENARIO COMPLETO</span>
          <h3 class="font-title text-xl font-extrabold uppercase italic text-white">
            EVENTOS PRIVADOS Y ALQUILER DE ESCENARIO
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="private-weekday-price" class="x-label">Tarifa Entre Semana (COP)</label>
              <input
                type="number"
                id="private-weekday-price"
                value="${config.privateEvents.weekdayPrice}"
                step="50000"
                class="x-input font-bold text-white"
              />
            </div>
            <div>
              <label for="private-weekend-price" class="x-label">Tarifa Fines de Semana y Festivos (COP)</label>
              <input
                type="number"
                id="private-weekend-price"
                value="${config.privateEvents.weekendHolidayPrice}"
                step="50000"
                class="x-input font-bold text-lime-electric"
              />
            </div>
          </div>
          <div class="pt-2">
            <label class="inline-flex items-center gap-2.5 text-sm text-white/85 cursor-pointer">
              <input
                type="checkbox"
                id="private-blocks-day"
                class="h-5 w-5 accent-[#B6FF00]"
                ${config.privateEvents.blocksEntireDay ? 'checked' : ''}
              />
              <span>Cuando se reserve un Evento Privado, bloquear el escenario completo para ese día.</span>
            </label>
          </div>
        </section>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          id="save-pricing-btn"
          ${state.isSaving ? 'disabled' : ''}
          class="btn-x-primary py-4 px-10 text-sm sm:text-base"
        >
          ${state.isSaving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR TODOS LOS COSTOS Y TARIFAS'}
        </button>
      </div>
    </div>
  `;
}

function bindPricingTabEvents(
  app: HTMLElement,
  config: ParkConfig,
  onSave: (cfg: ParkConfig) => Promise<void>
): void {
  const collectPackagesFromDOM = (): PitBikePackage[] => {
    const rows = Array.from(app.querySelectorAll<HTMLElement>('.pkg-row'));
    return rows.map((row, idx) => {
      const existing = config.pitBikePackages[idx];
      const label = (row.querySelector('.pkg-label') as HTMLInputElement)?.value.trim() || '10 minutos';
      const durationMinutes = Number((row.querySelector('.pkg-minutes') as HTMLInputElement)?.value) || 10;
      const price = Number((row.querySelector('.pkg-price') as HTMLInputElement)?.value) || 45000;
      const badge = (row.querySelector('.pkg-badge') as HTMLInputElement)?.value.trim() || undefined;
      const description = (row.querySelector('.pkg-desc') as HTMLInputElement)?.value.trim() || '';
      const active = (row.querySelector('.pkg-active') as HTMLInputElement)?.checked ?? true;
      return {
        id: existing?.id || `pitbike-${durationMinutes}-${Date.now()}`,
        durationMinutes,
        label,
        price,
        badge,
        description,
        active,
      };
    });
  };

  document.getElementById('add-package-btn')?.addEventListener('click', async () => {
    const currentPkgs = collectPackagesFromDOM();
    currentPkgs.push({
      id: `pitbike-custom-${Date.now()}`,
      durationMinutes: 45,
      label: '45 minutos',
      price: 135000,
      description: 'Sesión extendida de alquiler Pit Bike con inducción incluida.',
      badge: 'NUEVO',
      active: true,
    });
    await onSave({
      ...config,
      pitBikePackages: currentPkgs,
    });
  });

  app.querySelectorAll<HTMLButtonElement>('.remove-pkg-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.getAttribute('data-remove-pkg'));
      const currentPkgs = collectPackagesFromDOM();
      if (currentPkgs.length <= 1) {
        await Swal.fire({
          icon: 'warning',
          title: 'Debe existir al menos un paquete',
        });
        return;
      }
      currentPkgs.splice(idx, 1);
      await onSave({
        ...config,
        pitBikePackages: currentPkgs,
      });
    });
  });

  document.getElementById('save-pricing-btn')?.addEventListener('click', async () => {
    const updatedPackages = collectPackagesFromDOM();
    const freePrice = Number((document.getElementById('free-practice-price') as HTMLInputElement)?.value) || 50000;
    const freeSlots = Number((document.getElementById('free-practice-slots') as HTMLInputElement)?.value) || 25;
    const freeDesc = (document.getElementById('free-practice-desc') as HTMLTextAreaElement)?.value.trim() || '';

    const weekdayPrice = Number((document.getElementById('private-weekday-price') as HTMLInputElement)?.value) || 2500000;
    const weekendHolidayPrice = Number((document.getElementById('private-weekend-price') as HTMLInputElement)?.value) || 3500000;
    const blocksEntireDay = (document.getElementById('private-blocks-day') as HTMLInputElement)?.checked ?? true;

    await onSave({
      ...config,
      pitBikePackages: updatedPackages,
      freePractice: {
        ...config.freePractice,
        price: freePrice,
        maxDailySlots: freeSlots,
        description: freeDesc,
      },
      privateEvents: {
        ...config.privateEvents,
        weekdayPrice,
        weekendHolidayPrice,
        blocksEntireDay,
      },
    });
  });
}

// ─── PESTAÑA 3: HORARIOS DISPONIBLES, CUPOS POR HORA Y BLOQUEOS ─────────────

function renderScheduleTab(
  config: ParkConfig,
  bookings: Booking[],
  state: AdminState
): string {
  const inspectDate = state.scheduleInspectDate || getTodayISO();
  const isDateBlocked = config.schedule.blockedDates.includes(inspectDate);
  const blockedSlotsForDate = config.schedule.blockedSlots[inspectDate] || [];

  const dt = new Date(`${inspectDate}T12:00:00`);
  const isWeekendOrHoliday =
    dt.getDay() === 0 || dt.getDay() === 6 || config.schedule.holidays.includes(inspectDate);
  const hoursForInspectDate = isWeekendOrHoliday
    ? config.schedule.weekendHolidayHours
    : config.schedule.weekdayHours;

  return `
    <div class="space-y-8">
      <!-- 1. Configuración General de Horarios y Cupos por Hora -->
      <section class="x-card p-6 sm:p-8 space-y-6">
        <div>
          <span class="x-badge-solid">CAPACIDAD Y BLOQUES HORARIOS</span>
          <h2 class="font-title text-2xl font-extrabold uppercase italic text-white mt-1">
            CUPOS POR HORA Y HORARIOS DE ATENCIÓN
          </h2>
          <p class="text-xs text-white/60">
            Define cuántas motos/cupos se pueden reservar por hora y los bloques horarios de entre semana y fines de semana/festivos.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="rounded-xl border border-lime-electric/40 bg-carbon/90 p-4">
            <label for="sched-capacity" class="x-label text-lime-electric">
              Cupos / Motos Disponibles por Hora
            </label>
            <input
              type="number"
              id="sched-capacity"
              min="1"
              max="50"
              value="${config.schedule.pitBikeCapacityPerHour}"
              class="x-input font-title text-2xl font-extrabold text-lime-electric"
            />
            <p class="text-[11px] text-white/60 mt-1">
              Cuando se completen estos cupos en una misma hora, esa hora quedará marcada como APARTADA/AGOTADA.
            </p>
          </div>

          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4">
            <label for="sched-weekday-label" class="x-label">Texto Visible Martes a Viernes</label>
            <input
              type="text"
              id="sched-weekday-label"
              value="${escapeHtml(config.schedule.weekdayScheduleLabel)}"
              class="x-input text-sm"
            />
            <label for="sched-weekday-hours" class="x-label mt-3">
              Horas Martes a Viernes (formato 24h separadas por coma)
            </label>
            <input
              type="text"
              id="sched-weekday-hours"
              value="${escapeHtml(config.schedule.weekdayHours.join(', '))}"
              class="x-input text-sm font-mono"
            />
          </div>

          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4">
            <label for="sched-weekend-label" class="x-label">Texto Visible Sáb, Dom y Festivos</label>
            <input
              type="text"
              id="sched-weekend-label"
              value="${escapeHtml(config.schedule.weekendScheduleLabel)}"
              class="x-input text-sm"
            />
            <label for="sched-weekend-hours" class="x-label mt-3">
              Horas Sáb, Dom y Festivos (separadas por coma)
            </label>
            <input
              type="text"
              id="sched-weekend-hours"
              value="${escapeHtml(config.schedule.weekendHolidayHours.join(', '))}"
              class="x-input text-sm font-mono"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4 space-y-2">
            <label for="sched-holidays" class="x-label">
              Fechas Festivas (YYYY-MM-DD separadas por coma)
            </label>
            <textarea id="sched-holidays" rows="2" class="x-input text-xs font-mono">${escapeHtml(config.schedule.holidays.join(', '))}</textarea>
            <label class="inline-flex items-center gap-2 text-xs text-white/85 cursor-pointer pt-1">
              <input
                type="checkbox"
                id="sched-monday-open"
                class="h-4 w-4 accent-[#B6FF00]"
                ${config.schedule.mondayOpen ? 'checked' : ''}
              />
              <span>Habilitar reservas también los lunes no festivos</span>
            </label>
          </div>

          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4 space-y-2">
            <label for="sched-blocked-dates" class="x-label text-red-300">
              Fechas Cerradas Completas (Mantenimiento / Clima - YYYY-MM-DD)
            </label>
            <textarea id="sched-blocked-dates" rows="2" class="x-input text-xs font-mono" placeholder="Ej. 2026-11-24, 2026-12-25">${escapeHtml(config.schedule.blockedDates.join(', '))}</textarea>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="button" id="save-schedule-btn" class="btn-x-primary py-3.5 px-8 text-sm">
            GUARDAR HORARIOS Y CAPACIDAD
          </button>
        </div>
      </section>

      <!-- 2. Control Interactivo de Horas por Día Específico -->
      <section class="x-card p-6 sm:p-8 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span class="x-badge">CONTROL EN VIVO POR FECHA</span>
            <h3 class="font-title text-xl font-extrabold uppercase italic text-white mt-1">
              BLOQUEAR O HABILITAR HORAS EN UN DÍA ESPECÍFICO
            </h3>
            <p class="text-xs text-white/60">
              Selecciona una fecha y haz clic sobre cualquier hora para bloquearla o desbloquearla manualmente.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="date"
              id="inspect-date-picker"
              value="${inspectDate}"
              class="x-input text-sm font-semibold"
            />
            <button
              type="button"
              id="toggle-entire-date-btn"
              class="rounded-xl border px-4 py-3 font-subtitle text-xs font-semibold uppercase whitespace-nowrap ${
                isDateBlocked
                  ? 'border-lime-electric bg-lime-electric/20 text-lime-electric'
                  : 'border-red-500/40 bg-red-500/15 text-red-300'
              }"
            >
              ${isDateBlocked ? '✓ Reabrir Fecha Completa' : '✕ Cerrar Fecha Completa'}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          ${hoursForInspectDate
            .map((hour) => {
              const isSlotBlocked = isDateBlocked || blockedSlotsForDate.includes(hour);
              const bookedInSlot = bookings
                .filter(
                  (b) =>
                    parseSheetDate(b.date) === inspectDate &&
                    b.status !== 'cancelada' &&
                    b.serviceType === 'pitbike' &&
                    b.timeSlot === hour
                )
                .reduce((s, b) => s + (Number(b.quantity) || 1), 0);

              return `
                <button
                  type="button"
                  data-toggle-slot="${hour}"
                  class="toggle-slot-btn rounded-xl border p-4 text-left transition-all ${
                    isSlotBlocked
                      ? 'border-red-500/40 bg-red-500/15 text-red-200'
                      : 'border-lime-electric/40 bg-carbon/90 text-white hover:border-lime-electric'
                  }"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-title text-lg font-extrabold">${formatTime12h(hour)}</span>
                    <span class="text-[10px] font-subtitle font-semibold uppercase px-2 py-0.5 rounded ${
                      isSlotBlocked ? 'bg-red-500/30 text-red-200' : 'bg-lime-electric/20 text-lime-electric'
                    }">
                      ${isSlotBlocked ? 'Bloqueado' : 'Activo'}
                    </span>
                  </div>
                  <p class="text-xs text-white/70 mt-1.5">
                    Reservas activas: <strong>${bookedInSlot} / ${config.schedule.pitBikeCapacityPerHour}</strong>
                  </p>
                  <p class="text-[10px] text-white/50 mt-1">Clic para ${isSlotBlocked ? 'habilitar' : 'bloquear'}</p>
                </button>
              `;
            })
            .join('')}
        </div>
      </section>
    </div>
  `;
}

function bindScheduleTabEvents(
  app: HTMLElement,
  config: ParkConfig,
  _bookings: Booking[],
  state: AdminState,
  rerender: () => void,
  onSave: (cfg: ParkConfig) => Promise<void>
): void {
  const parseList = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  document.getElementById('save-schedule-btn')?.addEventListener('click', async () => {
    const capacity = Number((document.getElementById('sched-capacity') as HTMLInputElement)?.value) || 5;
    const weekdayScheduleLabel =
      (document.getElementById('sched-weekday-label') as HTMLInputElement)?.value.trim() ||
      '8:00 a. m. – 5:00 p. m.';
    const weekendScheduleLabel =
      (document.getElementById('sched-weekend-label') as HTMLInputElement)?.value.trim() ||
      '9:00 a. m. – 6:00 p. m.';
    const weekdayHours = parseList(
      (document.getElementById('sched-weekday-hours') as HTMLInputElement)?.value || ''
    );
    const weekendHolidayHours = parseList(
      (document.getElementById('sched-weekend-hours') as HTMLInputElement)?.value || ''
    );
    const holidays = parseList(
      (document.getElementById('sched-holidays') as HTMLTextAreaElement)?.value || ''
    );
    const blockedDates = parseList(
      (document.getElementById('sched-blocked-dates') as HTMLTextAreaElement)?.value || ''
    );
    const mondayOpen =
      (document.getElementById('sched-monday-open') as HTMLInputElement)?.checked ?? false;

    await onSave({
      ...config,
      schedule: {
        ...config.schedule,
        pitBikeCapacityPerHour: Math.max(1, capacity),
        weekdayScheduleLabel,
        weekendScheduleLabel,
        weekdayHours: weekdayHours.length ? weekdayHours : config.schedule.weekdayHours,
        weekendHolidayHours: weekendHolidayHours.length
          ? weekendHolidayHours
          : config.schedule.weekendHolidayHours,
        holidays,
        blockedDates,
        mondayOpen,
      },
    });
  });

  const inspectPicker = document.getElementById('inspect-date-picker') as HTMLInputElement | null;
  inspectPicker?.addEventListener('change', () => {
    if (inspectPicker.value) {
      state.scheduleInspectDate = parseSheetDate(inspectPicker.value);
      rerender();
    }
  });

  document.getElementById('toggle-entire-date-btn')?.addEventListener('click', async () => {
    const d = state.scheduleInspectDate;
    const currentBlocked = new Set(config.schedule.blockedDates);
    if (currentBlocked.has(d)) {
      currentBlocked.delete(d);
    } else {
      currentBlocked.add(d);
    }
    await onSave({
      ...config,
      schedule: {
        ...config.schedule,
        blockedDates: Array.from(currentBlocked),
      },
    });
  });

  app.querySelectorAll<HTMLButtonElement>('.toggle-slot-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const slot = btn.getAttribute('data-toggle-slot');
      if (!slot) return;
      const d = state.scheduleInspectDate;
      const map = { ...config.schedule.blockedSlots };
      const set = new Set(map[d] || []);
      if (set.has(slot)) {
        set.delete(slot);
      } else {
        set.add(slot);
      }
      map[d] = Array.from(set);
      await onSave({
        ...config,
        schedule: {
          ...config.schedule,
          blockedSlots: map,
        },
      });
    });
  });
}

// ─── PESTAÑA 4: MEDIOS DE PAGO Y TEXTOS LEGALES (EXONERACIÓN / DATOS) ────────

function renderLegalAndPaymentsTab(config: ParkConfig, state: AdminState): string {
  return `
    <div class="space-y-8">
      <!-- Medios de Pago y Contacto -->
      <section class="x-card p-6 sm:p-8 space-y-5">
        <div>
          <span class="x-badge-solid">RECAUDO Y SOPORTE</span>
          <h2 class="font-title text-2xl font-extrabold uppercase italic text-white mt-1">
            MEDIOS DE PAGO Y WHATSAPP OFICIAL
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4 space-y-3">
            <span class="font-subtitle text-xs font-semibold uppercase text-lime-electric">WhatsApp de Soporte</span>
            <div>
              <label for="pay-wpp-num" class="x-label">Número (Sin +57)</label>
              <input type="text" id="pay-wpp-num" value="${escapeHtml(config.paymentInfo.whatsappNumber)}" class="x-input text-sm" />
            </div>
            <div>
              <label for="pay-wpp-display" class="x-label">Formato Visible</label>
              <input type="text" id="pay-wpp-display" value="${escapeHtml(config.paymentInfo.whatsappDisplay)}" class="x-input text-sm" />
            </div>
          </div>

          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-subtitle text-xs font-semibold uppercase text-lime-electric">Cuenta Nequi</span>
              <input type="checkbox" id="pay-nequi-enabled" class="h-4 w-4 accent-[#B6FF00]" ${config.paymentInfo.nequi.enabled ? 'checked' : ''} />
            </div>
            <div>
              <label for="pay-nequi-num" class="x-label">Número Nequi</label>
              <input type="text" id="pay-nequi-num" value="${escapeHtml(config.paymentInfo.nequi.number)}" class="x-input text-sm font-bold" />
            </div>
            <div>
              <label for="pay-nequi-holder" class="x-label">Titular</label>
              <input type="text" id="pay-nequi-holder" value="${escapeHtml(config.paymentInfo.nequi.holderName)}" class="x-input text-sm" />
            </div>
          </div>

          <div class="rounded-xl border border-white/15 bg-carbon/90 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-subtitle text-xs font-semibold uppercase text-lime-neon">Cuenta DaviPlata</span>
              <input type="checkbox" id="pay-davi-enabled" class="h-4 w-4 accent-[#B6FF00]" ${config.paymentInfo.daviplata.enabled ? 'checked' : ''} />
            </div>
            <div>
              <label for="pay-davi-num" class="x-label">Número DaviPlata</label>
              <input type="text" id="pay-davi-num" value="${escapeHtml(config.paymentInfo.daviplata.number)}" class="x-input text-sm font-bold" />
            </div>
            <div>
              <label for="pay-davi-holder" class="x-label">Titular</label>
              <input type="text" id="pay-davi-holder" value="${escapeHtml(config.paymentInfo.daviplata.holderName)}" class="x-input text-sm" />
            </div>
          </div>
        </div>
      </section>

      <!-- Editor del Modal de Tratamiento de Datos y Exoneración de Responsabilidad -->
      <section class="x-card p-6 sm:p-8 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span class="x-badge-solid">DOCUMENTO LEGAL DEL MODAL</span>
            <h2 class="font-title text-2xl font-extrabold uppercase italic text-white mt-1">
              TRATAMIENTO DE DATOS Y EXONERACIÓN DE RESPONSABILIDAD
            </h2>
            <p class="text-xs text-white/60">
              Este texto se abre cuando el cliente hace clic en el enlace del checkbox antes de confirmar su reserva.
            </p>
          </div>
          <button
            type="button"
            id="restore-default-legal-btn"
            class="rounded-xl border border-white/20 bg-carbon px-3.5 py-2 font-subtitle text-xs font-semibold text-white/75 hover:text-lime-electric"
          >
            Restaurar texto por defecto
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label for="legal-modal-title-input" class="x-label">Título del Modal Legal</label>
            <input
              type="text"
              id="legal-modal-title-input"
              value="${escapeHtml(config.legalTexts.modalTitle)}"
              class="x-input text-sm font-semibold"
            />
          </div>

          <div>
            <label for="legal-arrival-notice-input" class="x-label">Aviso Destacado de Puntualidad e Inducción</label>
            <input
              type="text"
              id="legal-arrival-notice-input"
              value="${escapeHtml(config.legalTexts.arrivalNoticeText)}"
              class="x-input text-sm"
            />
          </div>

          <div>
            <label for="legal-data-treatment-input" class="x-label">
              1. Texto de Autorización de Tratamiento de Datos Personales
            </label>
            <textarea
              id="legal-data-treatment-input"
              rows="8"
              class="x-input text-sm leading-relaxed"
            >${escapeHtml(config.legalTexts.dataTreatmentText)}</textarea>
          </div>

          <div>
            <label for="legal-waiver-input" class="x-label">
              2. Texto de Asunción de Riesgos y Exoneración de Responsabilidad
            </label>
            <textarea
              id="legal-waiver-input"
              rows="9"
              class="x-input text-sm leading-relaxed"
            >${escapeHtml(config.legalTexts.waiverText)}</textarea>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            id="save-legal-btn"
            ${state.isSaving ? 'disabled' : ''}
            class="btn-x-primary py-4 px-10 text-sm sm:text-base"
          >
            ${state.isSaving ? 'GUARDANDO...' : 'GUARDAR MEDIOS DE PAGO Y TEXTOS LEGALES'}
          </button>
        </div>
      </section>
    </div>
  `;
}

function bindLegalAndPaymentsEvents(
  _app: HTMLElement,
  config: ParkConfig,
  onSave: (cfg: ParkConfig) => Promise<void>
): void {
  document.getElementById('restore-default-legal-btn')?.addEventListener('click', () => {
    const titleEl = document.getElementById('legal-modal-title-input') as HTMLInputElement | null;
    const noticeEl = document.getElementById('legal-arrival-notice-input') as HTMLInputElement | null;
    const dataEl = document.getElementById('legal-data-treatment-input') as HTMLTextAreaElement | null;
    const waiverEl = document.getElementById('legal-waiver-input') as HTMLTextAreaElement | null;

    if (titleEl) titleEl.value = DEFAULT_PARK_CONFIG.legalTexts.modalTitle;
    if (noticeEl) noticeEl.value = DEFAULT_PARK_CONFIG.legalTexts.arrivalNoticeText;
    if (dataEl) dataEl.value = DEFAULT_PARK_CONFIG.legalTexts.dataTreatmentText;
    if (waiverEl) waiverEl.value = DEFAULT_PARK_CONFIG.legalTexts.waiverText;
  });

  document.getElementById('save-legal-btn')?.addEventListener('click', async () => {
    const whatsappNumber = (document.getElementById('pay-wpp-num') as HTMLInputElement)?.value.trim() || '3208504410';
    const whatsappDisplay = (document.getElementById('pay-wpp-display') as HTMLInputElement)?.value.trim() || '320 850 4410';
    const nequiEnabled = (document.getElementById('pay-nequi-enabled') as HTMLInputElement)?.checked ?? true;
    const nequiNumber = (document.getElementById('pay-nequi-num') as HTMLInputElement)?.value.trim() || '3208504410';
    const nequiHolder = (document.getElementById('pay-nequi-holder') as HTMLInputElement)?.value.trim() || 'GREEN X PARK';
    const daviEnabled = (document.getElementById('pay-davi-enabled') as HTMLInputElement)?.checked ?? true;
    const daviNumber = (document.getElementById('pay-davi-num') as HTMLInputElement)?.value.trim() || '3208504410';
    const daviHolder = (document.getElementById('pay-davi-holder') as HTMLInputElement)?.value.trim() || 'GREEN X PARK';

    const modalTitle = (document.getElementById('legal-modal-title-input') as HTMLInputElement)?.value.trim() || '';
    const arrivalNoticeText = (document.getElementById('legal-arrival-notice-input') as HTMLInputElement)?.value.trim() || '';
    const dataTreatmentText = (document.getElementById('legal-data-treatment-input') as HTMLTextAreaElement)?.value.trim() || '';
    const waiverText = (document.getElementById('legal-waiver-input') as HTMLTextAreaElement)?.value.trim() || '';

    await onSave({
      ...config,
      paymentInfo: {
        ...config.paymentInfo,
        whatsappNumber,
        whatsappDisplay,
        nequi: {
          enabled: nequiEnabled,
          number: nequiNumber,
          holderName: nequiHolder,
        },
        daviplata: {
          enabled: daviEnabled,
          number: daviNumber,
          holderName: daviHolder,
        },
      },
      legalTexts: {
        modalTitle,
        arrivalNoticeText,
        dataTreatmentText,
        waiverText,
      },
    });
  });
}

