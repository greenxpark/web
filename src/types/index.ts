export type ServiceType = 'pitbike' | 'practica_libre' | 'evento_privado';

export type BookingStatus = 'pendiente' | 'confirmada' | 'cancelada';

export interface PitBikePackage {
  id: string;
  durationMinutes: number;
  label: string;
  price: number;
  description: string;
  badge?: string;
  active: boolean;
}

export interface FreePracticeConfig {
  price: number;
  maxDailySlots: number;
  active: boolean;
  tracks: string[];
  description: string;
}

export interface PrivateEventsConfig {
  weekdayPrice: number;
  weekendHolidayPrice: number;
  blocksEntireDay: boolean;
  active: boolean;
  idealFor: string[];
}

export interface ScheduleConfig {
  pitBikeCapacityPerHour: number;
  weekdayHours: string[];
  weekendHolidayHours: string[];
  mondayOpen: boolean;
  weekdayScheduleLabel: string;
  weekendScheduleLabel: string;
  holidays: string[];
  blockedDates: string[];
  /** Mapa fecha YYYY-MM-DD -> lista de horas bloqueadas ej. { "2026-11-15": ["10:00", "11:00"] } */
  blockedSlots: Record<string, string[]>;
}

export interface PaymentInfoConfig {
  whatsappNumber: string;
  whatsappDisplay: string;
  nequi: {
    enabled: boolean;
    number: string;
    holderName: string;
  };
  daviplata: {
    enabled: boolean;
    number: string;
    holderName: string;
  };
  bankAccount: {
    enabled: boolean;
    bank: string;
    accountType: string;
    accountNumber: string;
    holderName: string;
    document: string;
  };
  breB: {
    enabled: boolean;
    key: string;
    holderName: string;
  };
}

export interface LegalTextsConfig {
  modalTitle: string;
  dataTreatmentText: string;
  waiverText: string;
  arrivalNoticeText: string;
  contractConvenioText?: string;
}

export interface ParkConfig {
  updatedAt: string;
  pitBikePackages: PitBikePackage[];
  freePractice: FreePracticeConfig;
  privateEvents: PrivateEventsConfig;
  schedule: ScheduleConfig;
  paymentInfo: PaymentInfoConfig;
  legalTexts: LegalTextsConfig;
}

export interface Booking {
  id: string;
  code: string;
  serviceType: ServiceType;
  serviceLabel: string;
  packageId: string;
  packageLabel: string;
  date: string;
  timeSlot: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  documentType?: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  riderAge?: number | string;
  guardianName?: string;
  emergencyPhone?: string;
  eps?: string;
  bloodType?: string;
  address?: string;
  ownBike?: string;
  experienceLevel: string;
  riderNotes: string;
  paymentMethod: string;
  comprobanteUrl: string;
  comprobanteArchivo?: string;
  comprobanteFileName: string;
  comprobanteFileType: string;
  acceptedTerms: boolean;
  acceptedTermsAt: string;
  status: BookingStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreatePayload {
  serviceType: ServiceType;
  serviceLabel: string;
  packageId: string;
  packageLabel: string;
  date: string;
  timeSlot: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  documentType?: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  riderAge?: number | string;
  guardianName?: string;
  emergencyPhone?: string;
  eps?: string;
  bloodType?: string;
  address?: string;
  ownBike?: string;
  experienceLevel: string;
  riderNotes: string;
  paymentMethod: string;
  comprobanteArchivo: string;
  comprobanteFileName: string;
  comprobanteFileType: string;
  acceptedTerms: boolean;
}

export interface SlotAvailability {
  timeSlot: string;
  formattedTime: string;
  totalCapacity: number;
  bookedCount: number;
  availableCount: number;
  isBlocked: boolean;
  isAvailable: boolean;
  reason?: string;
}

export interface DayAvailabilitySummary {
  date: string;
  isOpen: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  isBlockedDate: boolean;
  hasPrivateEvent: boolean;
  reasonClosed?: string;
  slots: SlotAvailability[];
  freePracticeAvailable: number;
  freePracticeTotal: number;
}

