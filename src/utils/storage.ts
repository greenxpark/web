import { CONFIG } from '../config';
import { DEFAULT_PARK_CONFIG } from '../content/default-config';
import type {
  Booking,
  BookingCreatePayload,
  BookingStatus,
  DayAvailabilitySummary,
  ParkConfig,
  SlotAvailability,
} from '../types';
import { apiGet, apiPost, isApiEnabled } from './api';
import {
  formatTime12h,
  generateBookingCode,
  generateId,
  parseSheetDate,
  parseSheetTime,
} from './format';

const RESCHEDULE_OVERRIDES_KEY = 'greenxpark_reschedule_overrides_v1';

interface RescheduleOverride {
  date: string;
  timeSlot: string;
  updatedAt: string;
}

function getRescheduleOverrides(): Record<string, RescheduleOverride> {
  return readLocal<Record<string, RescheduleOverride>>(RESCHEDULE_OVERRIDES_KEY) ?? {};
}

function saveRescheduleOverride(codeOrId: string, override: RescheduleOverride): void {
  const current = getRescheduleOverrides();
  current[codeOrId.toUpperCase()] = override;
  writeLocal(RESCHEDULE_OVERRIDES_KEY, current);
}

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

function parseBool(val: unknown, fallback = false): boolean {
  if (val === undefined || val === null || val === '') return fallback;
  return val === true || val === 'TRUE' || val === 'true' || val === 1 || val === '1';
}

export function normalizeParkConfig(raw?: Partial<ParkConfig> | null): ParkConfig {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(DEFAULT_PARK_CONFIG);
  }

  const def = DEFAULT_PARK_CONFIG;

  const pitBikePackages =
    Array.isArray(raw.pitBikePackages) && raw.pitBikePackages.length > 0
      ? raw.pitBikePackages.map((p, idx) => ({
          id: String(p.id || `pitbike-${idx + 1}`),
          durationMinutes: Number(p.durationMinutes) || 10,
          label: String(p.label || `${p.durationMinutes || 10} minutos`),
          price: Number(p.price) || 45000,
          description: String(p.description || ''),
          badge: p.badge ? String(p.badge) : undefined,
          active: parseBool(p.active, true),
        }))
      : structuredClone(def.pitBikePackages);

  const freePractice = {
    price: Number(raw.freePractice?.price ?? def.freePractice.price),
    maxDailySlots: Number(raw.freePractice?.maxDailySlots ?? def.freePractice.maxDailySlots) || 25,
    active: parseBool(raw.freePractice?.active, def.freePractice.active),
    tracks:
      Array.isArray(raw.freePractice?.tracks) && raw.freePractice.tracks.length > 0
        ? raw.freePractice.tracks.map(String)
        : structuredClone(def.freePractice.tracks),
    description: String(raw.freePractice?.description ?? def.freePractice.description),
  };

  const privateEvents = {
    weekdayPrice: Number(raw.privateEvents?.weekdayPrice ?? def.privateEvents.weekdayPrice),
    weekendHolidayPrice: Number(
      raw.privateEvents?.weekendHolidayPrice ?? def.privateEvents.weekendHolidayPrice
    ),
    blocksEntireDay: parseBool(raw.privateEvents?.blocksEntireDay, def.privateEvents.blocksEntireDay),
    active: parseBool(raw.privateEvents?.active, def.privateEvents.active),
    idealFor:
      Array.isArray(raw.privateEvents?.idealFor) && raw.privateEvents.idealFor.length > 0
        ? raw.privateEvents.idealFor.map(String)
        : structuredClone(def.privateEvents.idealFor),
  };

  const schedule = {
    pitBikeCapacityPerHour:
      Number(raw.schedule?.pitBikeCapacityPerHour ?? def.schedule.pitBikeCapacityPerHour) || 5,
    weekdayHours:
      Array.isArray(raw.schedule?.weekdayHours) && raw.schedule.weekdayHours.length > 0
        ? raw.schedule.weekdayHours.map(String)
        : structuredClone(def.schedule.weekdayHours),
    weekendHolidayHours:
      Array.isArray(raw.schedule?.weekendHolidayHours) && raw.schedule.weekendHolidayHours.length > 0
        ? raw.schedule.weekendHolidayHours.map(String)
        : structuredClone(def.schedule.weekendHolidayHours),
    mondayOpen: parseBool(raw.schedule?.mondayOpen, def.schedule.mondayOpen),
    weekdayScheduleLabel: String(
      raw.schedule?.weekdayScheduleLabel ?? def.schedule.weekdayScheduleLabel
    ),
    weekendScheduleLabel: String(
      raw.schedule?.weekendScheduleLabel ?? def.schedule.weekendScheduleLabel
    ),
    holidays: Array.isArray(raw.schedule?.holidays)
      ? raw.schedule.holidays.map((d) => parseSheetDate(d)).filter(Boolean)
      : structuredClone(def.schedule.holidays),
    blockedDates: Array.isArray(raw.schedule?.blockedDates)
      ? raw.schedule.blockedDates.map((d) => parseSheetDate(d)).filter(Boolean)
      : [],
    blockedSlots:
      raw.schedule?.blockedSlots && typeof raw.schedule.blockedSlots === 'object'
        ? (raw.schedule.blockedSlots as Record<string, string[]>)
        : {},
  };

  const paymentInfo = {
    whatsappNumber: String(raw.paymentInfo?.whatsappNumber ?? def.paymentInfo.whatsappNumber),
    whatsappDisplay: String(raw.paymentInfo?.whatsappDisplay ?? def.paymentInfo.whatsappDisplay),
    nequi: {
      enabled: parseBool(raw.paymentInfo?.nequi?.enabled, def.paymentInfo.nequi.enabled),
      number: String(raw.paymentInfo?.nequi?.number ?? def.paymentInfo.nequi.number),
      holderName: String(raw.paymentInfo?.nequi?.holderName ?? def.paymentInfo.nequi.holderName),
    },
    daviplata: {
      enabled: parseBool(raw.paymentInfo?.daviplata?.enabled, def.paymentInfo.daviplata.enabled),
      number: String(raw.paymentInfo?.daviplata?.number ?? def.paymentInfo.daviplata.number),
      holderName: String(
        raw.paymentInfo?.daviplata?.holderName ?? def.paymentInfo.daviplata.holderName
      ),
    },
    bankAccount: {
      enabled: parseBool(raw.paymentInfo?.bankAccount?.enabled, def.paymentInfo.bankAccount.enabled),
      bank: String(raw.paymentInfo?.bankAccount?.bank ?? def.paymentInfo.bankAccount.bank),
      accountType: String(
        raw.paymentInfo?.bankAccount?.accountType ?? def.paymentInfo.bankAccount.accountType
      ),
      accountNumber: String(
        raw.paymentInfo?.bankAccount?.accountNumber ?? def.paymentInfo.bankAccount.accountNumber
      ),
      holderName: String(
        raw.paymentInfo?.bankAccount?.holderName ?? def.paymentInfo.bankAccount.holderName
      ),
      document: String(
        raw.paymentInfo?.bankAccount?.document ?? def.paymentInfo.bankAccount.document
      ),
    },
    breB: {
      enabled: parseBool(raw.paymentInfo?.breB?.enabled, def.paymentInfo.breB.enabled),
      key: String(raw.paymentInfo?.breB?.key ?? def.paymentInfo.breB.key),
      holderName: String(raw.paymentInfo?.breB?.holderName ?? def.paymentInfo.breB.holderName),
    },
  };

  const legalTexts = {
    modalTitle: String(raw.legalTexts?.modalTitle ?? def.legalTexts.modalTitle),
    arrivalNoticeText: String(raw.legalTexts?.arrivalNoticeText ?? def.legalTexts.arrivalNoticeText),
    dataTreatmentText: String(raw.legalTexts?.dataTreatmentText ?? def.legalTexts.dataTreatmentText),
    waiverText: String(raw.legalTexts?.waiverText ?? def.legalTexts.waiverText),
  };

  return {
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    pitBikePackages,
    freePractice,
    privateEvents,
    schedule,
    paymentInfo,
    legalTexts,
  };
}

export function normalizeBooking(raw: Record<string, unknown>): Booking {
  const statusRaw = String(raw.status ?? 'pendiente').toLowerCase();
  const status: BookingStatus =
    statusRaw === 'confirmada' || statusRaw === 'cancelada' ? statusRaw : 'pendiente';

  const serviceRaw = String(raw.serviceType ?? 'pitbike');
  const serviceType =
    serviceRaw === 'practica_libre' || serviceRaw === 'evento_privado' ? serviceRaw : 'pitbike';

  const id = String(raw.id ?? '');
  const code = String(raw.code ?? 'GXP-0000').toUpperCase();
  const overrides = getRescheduleOverrides();
  const override = overrides[code] || (id ? overrides[id.toUpperCase()] : undefined);

  const normalizedDate = override?.date ? parseSheetDate(override.date) : parseSheetDate(raw.date);
  const normalizedTime = override?.timeSlot
    ? parseSheetTime(override.timeSlot)
    : parseSheetTime(raw.timeSlot);

  return {
    id,
    code,
    serviceType,
    serviceLabel: String(raw.serviceLabel ?? ''),
    packageId: String(raw.packageId ?? ''),
    packageLabel: String(raw.packageLabel ?? ''),
    date: normalizedDate,
    timeSlot: normalizedTime,
    quantity: Math.max(1, Number(raw.quantity ?? 1) || 1),
    unitPrice: Number(raw.unitPrice ?? 0) || 0,
    totalPrice: Number(raw.totalPrice ?? 0) || 0,
    customerName: String(raw.customerName ?? ''),
    customerDocument: String(raw.customerDocument ?? ''),
    customerPhone: String(raw.customerPhone ?? ''),
    customerEmail: String(raw.customerEmail ?? ''),
    experienceLevel: String(raw.experienceLevel ?? 'Primera vez (Principiante)'),
    riderNotes: String(raw.riderNotes ?? ''),
    paymentMethod: String(raw.paymentMethod ?? 'Nequi'),
    comprobanteUrl: String(raw.comprobanteUrl ?? raw.comprobanteArchivo ?? ''),
    comprobanteFileName: String(raw.comprobanteFileName ?? ''),
    comprobanteFileType: String(raw.comprobanteFileType ?? ''),
    acceptedTerms: parseBool(raw.acceptedTerms, true),
    acceptedTermsAt: String(raw.acceptedTermsAt ?? raw.createdAt ?? ''),
    status,
    adminNotes: raw.adminNotes ? String(raw.adminNotes) : '',
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(override?.updatedAt ?? raw.updatedAt ?? ''),
  };
}

// ─── Caché en memoria + SWR para ParkConfig ──────────────────────────────────

let inMemoryConfig: ParkConfig | null = null;
let lastConfigFetchTime = 0;
const CONFIG_CACHE_TTL_MS = 60 * 1000;

export function getCachedParkConfigSync(): ParkConfig {
  if (inMemoryConfig) return inMemoryConfig;
  const fromLocal = readLocal<ParkConfig>(CONFIG.storageKeys.parkConfig);
  if (fromLocal) {
    inMemoryConfig = normalizeParkConfig(fromLocal);
    return inMemoryConfig;
  }
  inMemoryConfig = normalizeParkConfig(DEFAULT_PARK_CONFIG);
  return inMemoryConfig;
}

export async function loadParkConfig(options: {
  forceRefresh?: boolean;
  onUpdate?: (cfg: ParkConfig) => void;
} = {}): Promise<ParkConfig> {
  const cached = getCachedParkConfigSync();
  const now = Date.now();
  const isFresh = lastConfigFetchTime > 0 && now - lastConfigFetchTime < CONFIG_CACHE_TTL_MS;

  if (!options.forceRefresh && isFresh) {
    return cached;
  }

  if (!options.forceRefresh && isApiEnabled() && lastConfigFetchTime > 0) {
    // Revalidación SWR en segundo plano
    void (async () => {
      try {
        const data = await apiGet<{ config?: Partial<ParkConfig> }>({ action: 'config' });
        if (data.config) {
          const fresh = normalizeParkConfig(data.config);
          lastConfigFetchTime = Date.now();
          inMemoryConfig = fresh;
          writeLocal(CONFIG.storageKeys.parkConfig, fresh);
          if (options.onUpdate) options.onUpdate(fresh);
          window.dispatchEvent(new CustomEvent('greenxpark:config-updated', { detail: fresh }));
        }
      } catch {
        /* silencioso */
      }
    })();
    return cached;
  }

  if (isApiEnabled()) {
    try {
      const data = await apiGet<{ config?: Partial<ParkConfig> }>({ action: 'config' });
      if (data.config) {
        const fresh = normalizeParkConfig(data.config);
        lastConfigFetchTime = Date.now();
        inMemoryConfig = fresh;
        writeLocal(CONFIG.storageKeys.parkConfig, fresh);
        return fresh;
      }
    } catch {
      /* fallback local */
    }
  }

  lastConfigFetchTime = Date.now();
  return cached;
}

export async function saveParkConfig(config: ParkConfig): Promise<ParkConfig> {
  const normalized = normalizeParkConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });
  inMemoryConfig = normalized;
  lastConfigFetchTime = Date.now();
  writeLocal(CONFIG.storageKeys.parkConfig, normalized);

  if (isApiEnabled()) {
    await apiPost({
      action: 'saveConfig',
      config: normalized,
    });
  }
  window.dispatchEvent(new CustomEvent('greenxpark:config-updated', { detail: normalized }));
  return normalized;
}

// ─── Reservas (Bookings) con Caché en Memoria + SWR (0 ms en UI) ─────────────

let inMemoryBookings: Booking[] | null = null;
let lastBookingsFetchTime = 0;
const BOOKINGS_CACHE_TTL_MS = 45 * 1000;

export function getCachedBookingsSync(): Booking[] {
  if (inMemoryBookings) return inMemoryBookings;
  const fromLocal = readLocal<Record<string, unknown>[]>(CONFIG.storageKeys.bookings);
  if (Array.isArray(fromLocal)) {
    inMemoryBookings = fromLocal.map(normalizeBooking);
    return inMemoryBookings;
  }
  return [];
}

export async function loadBookings(options: {
  forceRefresh?: boolean;
  throwOnError?: boolean;
  onUpdate?: (bookings: Booking[]) => void;
} = {}): Promise<Booking[]> {
  const cached = getCachedBookingsSync();
  const now = Date.now();
  const isAdmin = Boolean(sessionStorage.getItem(CONFIG.storageKeys.adminPassword));
  const isFresh =
    !isAdmin && lastBookingsFetchTime > 0 && now - lastBookingsFetchTime < BOOKINGS_CACHE_TTL_MS;

  if (!options.forceRefresh && isFresh) {
    return cached;
  }

  // SWR: si ya tenemos caché y no es forzado, devolver en 0 ms y actualizar en background
  if (!options.forceRefresh && !isAdmin && lastBookingsFetchTime > 0 && isApiEnabled()) {
    void (async () => {
      try {
        const data = await apiGet<{ bookings: Record<string, unknown>[] }>({
          action: 'publicBookings',
        });
        if (Array.isArray(data.bookings)) {
          const fresh = data.bookings.map(normalizeBooking);
          lastBookingsFetchTime = Date.now();
          inMemoryBookings = fresh;
          writeLocal(CONFIG.storageKeys.bookings, fresh);
          if (options.onUpdate) options.onUpdate(fresh);
        }
      } catch {
        /* silencioso en background */
      }
    })();
    return cached;
  }

  if (isApiEnabled()) {
    try {
      const action = isAdmin ? 'bookings' : 'publicBookings';
      const data = await apiGet<{ bookings: Record<string, unknown>[] }>({ action });
      if (Array.isArray(data.bookings)) {
        const list = data.bookings.map(normalizeBooking);
        lastBookingsFetchTime = Date.now();
        inMemoryBookings = list;
        writeLocal(CONFIG.storageKeys.bookings, list);
        return list;
      }
    } catch (err) {
      if (options.throwOnError || (err instanceof Error && err.message === 'No autorizado')) {
        throw err;
      }
    }
  }

  lastBookingsFetchTime = Date.now();
  return cached;
}

export function computeDayAvailability(
  dateStr: string,
  config: ParkConfig,
  bookings: Booking[]
): DayAvailabilitySummary {
  const cleanDate = parseSheetDate(dateStr);
  const dt = new Date(`${cleanDate}T12:00:00`);
  const dayOfWeek = dt.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = config.schedule.holidays.includes(cleanDate);
  const isBlockedDate = config.schedule.blockedDates.includes(cleanDate);

  // Reservas activas de ese día (no canceladas)
  const activeDayBookings = bookings.filter(
    (b) => parseSheetDate(b.date) === cleanDate && b.status !== 'cancelada'
  );

  // Verificar si hay un Evento Privado que bloquee todo el escenario ese día
  const hasPrivateEvent =
    config.privateEvents.blocksEntireDay &&
    activeDayBookings.some((b) => b.serviceType === 'evento_privado');

  let isOpen = true;
  let reasonClosed: string | undefined;

  if (isBlockedDate) {
    isOpen = false;
    reasonClosed = 'Fecha cerrada por mantenimiento o actividad especial del parque.';
  } else if (dayOfWeek === 1 && !config.schedule.mondayOpen && !isHoliday) {
    isOpen = false;
    reasonClosed =
      'Los lunes no festivos el parque permanece cerrado por mantenimiento de pista y motos. ¡Te esperamos de martes a domingo y festivos!';
  } else if (hasPrivateEvent) {
    isOpen = false;
    reasonClosed = 'Escenario reservado en su totalidad para un Evento Privado en esta fecha.';
  }

  const baseHours =
    isWeekend || isHoliday
      ? config.schedule.weekendHolidayHours
      : config.schedule.weekdayHours;

  const blockedForDate = config.schedule.blockedSlots?.[cleanDate] ?? [];
  const totalCapacity = Math.max(1, config.schedule.pitBikeCapacityPerHour);

  const slots: SlotAvailability[] = baseHours.map((timeSlot) => {
    const cleanSlot = parseSheetTime(timeSlot);
    const isSlotBlocked = !isOpen || blockedForDate.includes(cleanSlot);
    const bookedCount = activeDayBookings
      .filter((b) => b.serviceType === 'pitbike' && parseSheetTime(b.timeSlot) === cleanSlot)
      .reduce((acc, b) => acc + (Number(b.quantity) || 1), 0);

    const availableCount = isSlotBlocked ? 0 : Math.max(0, totalCapacity - bookedCount);

    let reason: string | undefined;
    if (!isOpen) {
      reason = reasonClosed;
    } else if (blockedForDate.includes(timeSlot)) {
      reason = 'Horario bloqueado por administración';
    } else if (availableCount === 0) {
      reason = 'Cupos agotados en esta hora';
    }

    return {
      timeSlot,
      formattedTime: formatTime12h(timeSlot),
      totalCapacity,
      bookedCount,
      availableCount,
      isBlocked: isSlotBlocked,
      isAvailable: isOpen && !isSlotBlocked && availableCount > 0,
      reason,
    };
  });

  const freePracticeBooked = activeDayBookings
    .filter((b) => b.serviceType === 'practica_libre')
    .reduce((acc, b) => acc + (Number(b.quantity) || 1), 0);

  const freePracticeTotal = Math.max(1, config.freePractice.maxDailySlots);
  const freePracticeAvailable = isOpen ? Math.max(0, freePracticeTotal - freePracticeBooked) : 0;

  return {
    date: cleanDate,
    isOpen,
    isHoliday,
    isWeekend,
    isBlockedDate,
    hasPrivateEvent,
    reasonClosed,
    slots,
    freePracticeAvailable,
    freePracticeTotal,
  };
}

export async function createBooking(payload: BookingCreatePayload): Promise<Booking> {
  const [config, bookings] = await Promise.all([
    loadParkConfig(),
    loadBookings({ forceRefresh: true }),
  ]);

  const dayAvail = computeDayAvailability(payload.date, config, bookings);

  if (!dayAvail.isOpen) {
    throw new Error(dayAvail.reasonClosed || 'La fecha seleccionada no está disponible.');
  }

  if (payload.serviceType === 'pitbike') {
    const slot = dayAvail.slots.find((s) => s.timeSlot === payload.timeSlot);
    if (!slot || !slot.isAvailable) {
      throw new Error(`El horario ${formatTime12h(payload.timeSlot)} ya no se encuentra disponible.`);
    }
    if (payload.quantity > slot.availableCount) {
      throw new Error(
        `Solo quedan ${slot.availableCount} cupo(s) disponibles a las ${slot.formattedTime}.`
      );
    }
  } else if (payload.serviceType === 'practica_libre') {
    if (payload.quantity > dayAvail.freePracticeAvailable) {
      throw new Error(
        `Solo quedan ${dayAvail.freePracticeAvailable} cupo(s) de Práctica Libre para esta fecha.`
      );
    }
  } else if (payload.serviceType === 'evento_privado') {
    const existingAny = bookings.some(
      (b) => parseSheetDate(b.date) === parseSheetDate(payload.date) && b.status !== 'cancelada'
    );
    if (existingAny && config.privateEvents.blocksEntireDay) {
      throw new Error(
        'Esta fecha ya cuenta con reservas activas en pista. Elige otra fecha o contáctanos por WhatsApp.'
      );
    }
  }

  const now = new Date().toISOString();
  const newBooking: Booking = {
    id: generateId(),
    code: generateBookingCode(),
    serviceType: payload.serviceType,
    serviceLabel: payload.serviceLabel,
    packageId: payload.packageId,
    packageLabel: payload.packageLabel,
    date: parseSheetDate(payload.date),
    timeSlot: payload.timeSlot,
    quantity: Math.max(1, Number(payload.quantity) || 1),
    unitPrice: Number(payload.unitPrice) || 0,
    totalPrice: Number(payload.totalPrice) || 0,
    customerName: payload.customerName.trim(),
    customerDocument: payload.customerDocument.trim(),
    customerPhone: payload.customerPhone.trim(),
    customerEmail: payload.customerEmail.trim(),
    experienceLevel: payload.experienceLevel,
    riderNotes: payload.riderNotes.trim(),
    paymentMethod: payload.paymentMethod,
    comprobanteUrl: payload.comprobanteArchivo,
    comprobanteArchivo: payload.comprobanteArchivo,
    comprobanteFileName: payload.comprobanteFileName,
    comprobanteFileType: payload.comprobanteFileType,
    acceptedTerms: payload.acceptedTerms,
    acceptedTermsAt: now,
    status: 'pendiente',
    adminNotes: '',
    createdAt: now,
    updatedAt: now,
  };

  if (isApiEnabled()) {
    const res = await apiPost<{ success: boolean; booking?: Record<string, unknown> }>({
      action: 'createBooking',
      data: newBooking,
    });
    const saved = res.booking ? normalizeBooking(res.booking) : newBooking;
    const updatedList = [saved, ...bookings.filter((b) => b.id !== saved.id)];
    inMemoryBookings = updatedList;
    lastBookingsFetchTime = Date.now();
    writeLocal(CONFIG.storageKeys.bookings, updatedList);
    return saved;
  }

  // Modo Local (localStorage)
  const updatedList = [newBooking, ...bookings];
  inMemoryBookings = updatedList;
  lastBookingsFetchTime = Date.now();
  writeLocal(CONFIG.storageKeys.bookings, updatedList);
  return newBooking;
}

export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking> {
  if (isApiEnabled()) {
    const res = await apiPost<{ booking: Record<string, unknown> }>({
      action: 'updateBooking',
      id,
      data: updates,
    });
    const saved = normalizeBooking(res.booking);
    const current = getCachedBookingsSync();
    const next = current.map((b) => (b.id === id ? saved : b));
    inMemoryBookings = next;
    writeLocal(CONFIG.storageKeys.bookings, next);
    return saved;
  }

  const bookings = await loadBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error('Reserva no encontrada.');

  const merged: Booking = {
    ...bookings[idx],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  bookings[idx] = merged;
  inMemoryBookings = bookings;
  writeLocal(CONFIG.storageKeys.bookings, bookings);
  return merged;
}

export async function deleteBooking(id: string): Promise<void> {
  if (isApiEnabled()) {
    await apiPost({ action: 'deleteBooking', id });
  }
  const bookings = await loadBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  inMemoryBookings = filtered;
  writeLocal(CONFIG.storageKeys.bookings, filtered);
}

/**
 * Consulta pública de reserva por Código (ej. GXP-Q98W) y Documento (Cédula).
 * Permite al cliente ver su estado y reprogramar fecha/hora, sin permitir cancelación.
 */
export async function lookupCustomerBooking(
  code: string,
  customerDocument: string
): Promise<Booking | null> {
  const cleanCode = code.trim().toUpperCase();
  const cleanDoc = customerDocument.replace(/\D/g, '');
  if (!cleanCode) return null;

  if (isApiEnabled()) {
    try {
      const res = await apiGet<{
        success?: boolean;
        booking?: Record<string, unknown>;
        error?: string;
      }>({
        action: 'lookupBooking',
        code: cleanCode,
        document: cleanDoc,
      });
      if (res.booking) {
        return normalizeBooking(res.booking);
      }
      if (res.error && res.error === 'No encontramos ninguna reserva con ese código y documento.') {
        return null;
      }
    } catch {
      /* Fallback a búsqueda sobre publicBookings + caché local si el script aún no tiene lookupBooking */
    }
  }

  const bookings = await loadBookings({ forceRefresh: true });
  const match = bookings.find((b) => {
    const sameCode = b.code.trim().toUpperCase() === cleanCode;
    if (!sameCode) return false;
    // Si la reserva viene de caché local y tiene customerDocument, validarlo también
    if (b.customerDocument && cleanDoc) {
      return b.customerDocument.replace(/\D/g, '') === cleanDoc;
    }
    return true;
  });

  return match ?? null;
}

/**
 * Reprograma únicamente la fecha y/o la hora de una reserva existente (previa validación de cupos).
 * La cancelación está restringida exclusivamente al administrador.
 */
export async function rescheduleCustomerBooking(params: {
  id: string;
  code: string;
  customerDocument: string;
  newDate: string;
  newTimeSlot: string;
}): Promise<Booking> {
  const cleanCode = params.code.trim().toUpperCase();
  const cleanDoc = params.customerDocument.trim();
  const cleanDate = parseSheetDate(params.newDate);
  const cleanTime = parseSheetTime(params.newTimeSlot);

  const [config, allBookings] = await Promise.all([
    loadParkConfig(),
    loadBookings({ forceRefresh: true }),
  ]);

  const currentBooking =
    allBookings.find(
      (b) =>
        (params.id && b.id === params.id) || b.code.trim().toUpperCase() === cleanCode
    ) ?? (await lookupCustomerBooking(cleanCode, cleanDoc));

  if (!currentBooking) {
    throw new Error('No se encontró la reserva para reprogramar.');
  }

  if (currentBooking.status === 'cancelada') {
    throw new Error(
      'Esta reserva se encuentra cancelada. Comunícate con el administrador si necesitas asistencia.'
    );
  }

  // Excluir la reserva actual al calcular disponibilidad de la nueva fecha/hora
  const otherBookings = allBookings.filter(
    (b) => b.id !== currentBooking.id && b.code.toUpperCase() !== cleanCode
  );
  const dayAvail = computeDayAvailability(cleanDate, config, otherBookings);

  if (!dayAvail.isOpen) {
    throw new Error(dayAvail.reasonClosed || 'La nueva fecha seleccionada no está disponible.');
  }

  if (currentBooking.serviceType === 'pitbike') {
    const slot = dayAvail.slots.find((s) => parseSheetTime(s.timeSlot) === cleanTime);
    if (!slot || !slot.isAvailable) {
      throw new Error(`El horario ${formatTime12h(cleanTime)} no está disponible en esa fecha.`);
    }
    if (currentBooking.quantity > slot.availableCount) {
      throw new Error(
        `Tu reserva es de ${currentBooking.quantity} cupo(s), pero solo quedan ${slot.availableCount} disponible(s) a las ${slot.formattedTime}.`
      );
    }
  } else if (currentBooking.serviceType === 'practica_libre') {
    if (currentBooking.quantity > dayAvail.freePracticeAvailable) {
      throw new Error(
        `Solo quedan ${dayAvail.freePracticeAvailable} cupo(s) de Práctica Libre para esa fecha.`
      );
    }
  }

  const now = new Date().toISOString();

  // Guardar override local inmediato para que la UI refleje el cambio en 0 ms
  saveRescheduleOverride(cleanCode, {
    date: cleanDate,
    timeSlot: cleanTime,
    updatedAt: now,
  });
  if (currentBooking.id) {
    saveRescheduleOverride(currentBooking.id, {
      date: cleanDate,
      timeSlot: cleanTime,
      updatedAt: now,
    });
  }

  let updatedBooking: Booking = {
    ...currentBooking,
    date: cleanDate,
    timeSlot: cleanTime,
    updatedAt: now,
  };

  if (isApiEnabled()) {
    try {
      const res = await apiPost<{
        success?: boolean;
        booking?: Record<string, unknown>;
        error?: string;
      }>({
        action: 'rescheduleBooking',
        id: currentBooking.id,
        code: cleanCode,
        customerDocument: cleanDoc,
        date: cleanDate,
        timeSlot: cleanTime,
      });
      if (res.booking) {
        updatedBooking = normalizeBooking(res.booking);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // Si el error viene por validación de cupos o documento en el servidor, propagarlo
      if (msg && !msg.includes('Accion no reconocida')) {
        throw err;
      }
    }
  }

  const nextList = allBookings.map((b) =>
    b.id === currentBooking.id || b.code.toUpperCase() === cleanCode ? updatedBooking : b
  );
  inMemoryBookings = nextList;
  lastBookingsFetchTime = Date.now();
  writeLocal(CONFIG.storageKeys.bookings, nextList);

  return updatedBooking;
}

