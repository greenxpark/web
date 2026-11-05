import * as XLSX from 'xlsx';
import type { Booking } from '../types';
import { formatTime12h } from './format';

function buildExportRows(bookings: Booking[]) {
  return bookings.map((b) => ({
    Código: b.code,
    Estado: b.status.toUpperCase(),
    Fecha_Reserva: b.date,
    Hora: formatTime12h(b.timeSlot),
    Servicio: b.serviceLabel,
    Paquete: b.packageLabel,
    Cupos_Motos: b.quantity,
    Valor_Unitario_COP: b.unitPrice,
    Total_Pagado_COP: b.totalPrice,
    Cliente: b.customerName,
    Documento_ID: b.customerDocument,
    Celular_WhatsApp: b.customerPhone,
    Email: b.customerEmail,
    Nivel_Experiencia: b.experienceLevel,
    Notas_Pilotos: b.riderNotes,
    Medio_Pago: b.paymentMethod,
    URL_Comprobante: b.comprobanteUrl?.startsWith('data:') ? '[Archivo Local Base64]' : b.comprobanteUrl,
    Acepto_Terminos_Exoneracion: b.acceptedTerms ? 'SÍ' : 'NO',
    Fecha_Aceptacion: b.acceptedTermsAt,
    Notas_Admin: b.adminNotes || '',
    Creado_En: b.createdAt,
  }));
}

export function exportBookingsToExcel(bookings: Booking[], filename = 'Reservas_GreenXPark.xlsx'): void {
  const rows = buildExportRows(bookings);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservas');
  XLSX.writeFile(workbook, filename);
}

export function exportBookingsToCsv(bookings: Booking[], filename = 'Reservas_GreenXPark.csv'): void {
  const rows = buildExportRows(bookings);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

