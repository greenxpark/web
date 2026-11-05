# Guía de Configuración: Google Sheets + Google Drive + Google Apps Script

Esta plataforma utiliza la misma arquitectura serverless de alto rendimiento que **Cogua MX** y **Copa Autocolombiana**:
- **Google Sheets** como base de datos en tiempo real (`Bookings` y `Config`).
- **Google Drive** como almacenamiento para los comprobantes de pago subidos por los clientes.
- **Google Apps Script** con `CacheService` y `LockService` para evitar sobrecupos en una misma hora.

---

## Paso 1 — Crear la Hoja de Cálculo en Google Sheets
1. Ve a [Google Sheets](https://sheets.google.com) y crea una hoja de cálculo nueva llamada **`GREEN X PARK - Reservas 2026`**.
2. Copia el **ID de la hoja** desde la URL del navegador:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID_DE_LA_HOJA/edit
   ```

## Paso 2 — Crear la Carpeta en Google Drive para Comprobantes
1. Ve a [Google Drive](https://drive.google.com) y crea una carpeta llamada **`GREEN X PARK - Comprobantes de Pago`**.
2. Entra a la carpeta y copia el **ID de la carpeta** desde la URL:
   ```
   https://drive.google.com/drive/folders/ESTE_ES_EL_ID_DE_LA_CARPETA
   ```

## Paso 3 — Configurar y Desplegar Google Apps Script
1. En tu Google Sheet, abre el menú **Extensiones → Apps Script**.
2. Borra el código por defecto y pega el contenido completo de [`docs/google-apps-script.gs`](./google-apps-script.gs).
3. Reemplaza en las primeras líneas tus IDs:
   ```javascript
   const SPREADSHEET_ID = 'pega-aqui-el-id-de-tu-sheet';
   const DRIVE_FOLDER_ID = 'pega-aqui-el-id-de-tu-carpeta-drive';
   ```
4. En el menú izquierdo de Apps Script, haz clic en **Configuración del proyecto (⚙️)** → baja hasta **Propiedades de la secuencia de comandos** → **Añadir propiedad**:
   - Propiedad: `ADMIN_PASSWORD`
   - Valor: la contraseña que quieras usar en el panel administrativo (ej. `greenx2026`).
5. Regresa al editor (`< >`), selecciona la función **`setupSheets`** en la barra superior y haz clic en **Ejecutar** para autorizar los permisos de Sheets y Drive.
6. Haz clic en **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
7. Copia la URL generada que termina en `/exec`.

## Paso 4 — Conectar la Web con el Backend
Abre [`src/config.ts`](../src/config.ts) y pega la URL de tu Web App en `apiUrl`:
```typescript
export const CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycb.../exec',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1tL34OJSf5QbR8MnL5uhtSzrQNc4bpzfOk2TOBqVSujA/edit',
  ...
};
```
Luego ejecuta `npm run build` para generar la carpeta `dist/` lista para producción.

