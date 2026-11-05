/**
 * Configuración global de GREEN X PARK — Extreme Sports
 *
 * PANEL: /panel-greenxpark-gestion-2026.html
 * NOTA DE SEGURIDAD: La contraseña del panel NUNCA se almacena en el código fuente.
 * Se valida exclusivamente en el servidor mediante PropertiesService ('ADMIN_PASSWORD') en Google Apps Script.
 */
export const CONFIG = {
  /**
   * URL del Web App de Google Apps Script desplegado (termina en /exec).
   * Proyecto Apps Script: https://script.google.com/u/0/home/projects/1gSN0rP_RN22zyLl4yNNXnpcr7LXytc-UVwtPoosWZ-4QWDLplFlZqOaN/edit
   */
  apiUrl:
    'https://script.google.com/macros/s/AKfycby4kaYPUGOk5yEjwMy9reTuE4dEIabacZ1wODxXQIg4ekX29Z65yDGK4onuyHEmUyBq/exec' as string,

  /**
   * Enlace directo a la Google Sheet donde el Apps Script guarda los datos.
   * Coincide con SPREADSHEET_ID en docs/google-apps-script.gs.
   */
  spreadsheetUrl:
    'https://docs.google.com/spreadsheets/d/1tL34OJSf5QbR8MnL5uhtSzrQNc4bpzfOk2TOBqVSujA/edit' as string,

  /**
   * Claves para almacenamiento local y caché SWR (Stale-While-Revalidate).
   */
  storageKeys: {
    parkConfig: 'greenxpark_config_v1',
    bookings: 'greenxpark_bookings_v1',
    adminSession: 'greenxpark_admin_session_v1',
    adminPassword: 'greenxpark_admin_password_v1',
  },

  /**
   * Tamaño máximo permitido para el comprobante de pago (en MB).
   */
  maxFileSizeMB: 5,
};
