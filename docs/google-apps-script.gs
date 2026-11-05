/**
 * GREEN X PARK — EXTREME SPORTS (2026)
 * Backend Serverless en Google Apps Script + Google Sheets + Google Drive + CacheService
 *
 * INSTRUCCIONES DE INSTALACIÓN: Ver docs/SETUP-GOOGLE-SHEETS.md
 */

const SPREADSHEET_ID = '1tL34OJSf5QbR8MnL5uhtSzrQNc4bpzfOk2TOBqVSujA';
const DRIVE_FOLDER_ID = '1r1CQFedPt-5rfyXg_02hrw66k9TjdZqI';

const ADMIN_PASSWORD = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
const CACHE_TTL_SECONDS = 21600; // 6 horas de caché en Google Cloud

const BOOKING_HEADERS = [
  'id',
  'code',
  'serviceType',
  'serviceLabel',
  'packageId',
  'packageLabel',
  'date',
  'timeSlot',
  'quantity',
  'unitPrice',
  'totalPrice',
  'customerName',
  'customerDocument',
  'customerPhone',
  'customerEmail',
  'experienceLevel',
  'riderNotes',
  'paymentMethod',
  'comprobanteUrl',
  'comprobanteFileName',
  'comprobanteFileType',
  'acceptedTerms',
  'acceptedTermsAt',
  'status',
  'adminNotes',
  'createdAt',
  'updatedAt',
];

const CONFIG_HEADERS = ['key', 'value', 'updatedAt'];

function getScriptCache_() {
  return CacheService.getScriptCache();
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function invalidateCache_() {
  try {
    var cache = getScriptCache_();
    cache.remove('gxp_cache_config_v1');
    cache.remove('gxp_cache_public_bookings_v1');
    cache.remove('gxp_cache_public_bookings_v2');
  } catch (err) {
    Logger.log('Error invalidando cache: ' + err);
  }
}

// ─── HTTP GET ────────────────────────────────────────────────────────────────

function doGet(e) {
  e = e || { parameter: {} };
  const action = (e.parameter.action || '').toString();
  const password = (e.parameter.password || '').toString();

  if (action === 'config') {
    var cache = getScriptCache_();
    var cachedCfg = cache.get('gxp_cache_config_v1');
    if (cachedCfg) {
      return rawJsonResponse_(cachedCfg);
    }
    var ss = getSpreadsheet_();
    var configObj = getParkConfig_(ss);
    var jsonStr = JSON.stringify({ config: configObj });
    try {
      cache.put('gxp_cache_config_v1', jsonStr, CACHE_TTL_SECONDS);
    } catch (err) {}
    return rawJsonResponse_(jsonStr);
  }

  if (action === 'publicBookings') {
    var cachePub = getScriptCache_();
    var cachedPub = cachePub.get('gxp_cache_public_bookings_v2');
    if (cachedPub) {
      return rawJsonResponse_(cachedPub);
    }
    var ssPub = getSpreadsheet_();
    var allBookings = getBookings_(ssPub);
    // Para el calendario público, exponemos únicamente los campos de ocupación de horario (sin datos sensibles)
    var sanitized = allBookings.map(function (b) {
      return {
        id: b.id,
        code: b.code,
        serviceType: b.serviceType,
        packageId: b.packageId,
         packageLabel: b.packageLabel,
        date: parseSheetDate_(b.date),
        timeSlot: parseSheetTime_(b.timeSlot, ssPub),
        quantity: Number(b.quantity) || 1,
        totalPrice: Number(b.totalPrice) || 0,
        status: b.status || 'pendiente',
      };
    });
    var pubStr = JSON.stringify({ bookings: sanitized });
    try {
      cachePub.put('gxp_cache_public_bookings_v2', pubStr, 300);
    } catch (err) {}
    return rawJsonResponse_(pubStr);
  }

  if (action === 'lookupBooking') {
    var lookupCode = String(e.parameter.code || '').trim().toUpperCase();
    var lookupDoc = String(e.parameter.document || '').replace(/\D/g, '');
    if (!lookupCode || !lookupDoc) {
      return jsonResponse_({
        success: false,
        error: 'Ingresa tu código de reserva y número de documento.',
      });
    }
    var ssLookup = getSpreadsheet_();
    var allForLookup = getBookings_(ssLookup);
    var found = null;
    for (var i = 0; i < allForLookup.length; i++) {
      var item = allForLookup[i];
      var itemCode = String(item.code || '').trim().toUpperCase();
      var itemDoc = String(item.customerDocument || '').replace(/\D/g, '');
      if (itemCode === lookupCode && itemDoc === lookupDoc) {
        found = {
          id: item.id,
          code: item.code,
          serviceType: item.serviceType,
          serviceLabel: item.serviceLabel,
          packageId: item.packageId,
          packageLabel: item.packageLabel,
          date: parseSheetDate_(item.date),
          timeSlot: parseSheetTime_(item.timeSlot, ssLookup),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          customerName: item.customerName,
          customerDocument: item.customerDocument,
          customerPhone: item.customerPhone,
          status: item.status || 'pendiente',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        break;
      }
    }
    if (!found) {
      return jsonResponse_({
        success: false,
        error: 'No encontramos ninguna reserva con ese código y documento.',
      });
    }
    return jsonResponse_({ success: true, booking: found });
  }

  // Acciones Protegidas (GET) - Requieren contraseña
  if (action === 'bookings') {
    if (password !== ADMIN_PASSWORD) {
      return jsonResponse_({ success: false, error: 'No autorizado' });
    }
    var ssAdmin = getSpreadsheet_();
    return jsonResponse_({ bookings: getBookings_(ssAdmin) });
  }

  if (action === 'all' || !action) {
    var ssAll = getSpreadsheet_();
    if (password === ADMIN_PASSWORD) {
      return jsonResponse_({
        config: getParkConfig_(ssAll),
        bookings: getBookings_(ssAll),
      });
    }
    return jsonResponse_({
      config: getParkConfig_(ssAll),
    });
  }

  return jsonResponse_({ success: false, error: 'Accion desconocida o requiere autorizacion' });
}

// ─── HTTP POST ───────────────────────────────────────────────────────────────

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return jsonResponse_({
      success: false,
      error: 'doPost solo funciona via HTTP desde la web. Para configurar, ejecuta setupSheets.',
    });
  }

  const body = JSON.parse(e.postData.contents);
  const action = body.action || '';
  const password = body.password || '';

  // Acciones Protegidas (POST) - Requieren contraseña
  const adminActions = ['saveConfig', 'updateBooking', 'deleteBooking'];
  if (adminActions.indexOf(action) !== -1) {
    if (password !== ADMIN_PASSWORD) {
      return jsonResponse_({ success: false, error: 'No autorizado' });
    }
  }

  var ss = getSpreadsheet_();

  switch (action) {
    case 'createBooking':
      var resCreate = createBooking_(ss, body.data);
      invalidateCache_();
      return jsonResponse_(resCreate);

    case 'rescheduleBooking':
      var resReschedule = rescheduleBooking_(ss, body);
      invalidateCache_();
      return jsonResponse_(resReschedule);

    case 'updateBooking':
      var resUpdate = updateBooking_(ss, body.id, body.data);
      invalidateCache_();
      return jsonResponse_(resUpdate);

    case 'deleteBooking':
      var resDelete = deleteBooking_(ss, body.id);
      invalidateCache_();
      return jsonResponse_(resDelete);

    case 'saveConfig':
      saveParkConfig_(ss, body.config);
      invalidateCache_();
      return jsonResponse_({ success: true });

    default:
      return jsonResponse_({ success: false, error: 'Accion no reconocida: ' + action });
  }
}

// ─── Reservas CRUD con LockService para evitar sobrecupo ─────────────────────

function createBooking_(ss, data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var config = getParkConfig_(ss);
    var bookings = getBookings_(ss);
    var cleanDate = parseSheetDate_(data.date);
    var activeSameDay = bookings.filter(function (b) {
      return parseSheetDate_(b.date) === cleanDate && String(b.status) !== 'cancelada';
    });

    if (config && config.schedule) {
      var capPerHour = Number(config.schedule.pitBikeCapacityPerHour) || 5;
      var targetTime = parseSheetTime_(data.timeSlot, ss);
      if (data.serviceType === 'pitbike') {
        var usedInSlot = activeSameDay
          .filter(function (b) {
            return b.serviceType === 'pitbike' && parseSheetTime_(b.timeSlot, ss) === targetTime;
          })
          .reduce(function (sum, b) {
            return sum + (Number(b.quantity) || 1);
          }, 0);

        var reqQty = Math.max(1, Number(data.quantity) || 1);
        if (usedInSlot + reqQty > capPerHour) {
          return {
            success: false,
            error: 'Lo sentimos, solo quedan ' + Math.max(0, capPerHour - usedInSlot) + ' cupo(s) en ese horario.',
          };
        }
      }
    }

    var comprobanteUrl = data.comprobanteUrl || '';
    if (data.comprobanteArchivo && String(data.comprobanteArchivo).indexOf('data:') === 0) {
      comprobanteUrl = saveComprobanteToDrive_(data);
    }

    var now = new Date().toISOString();
    var row = {};
    BOOKING_HEADERS.forEach(function (h) {
      row[h] = data[h] !== undefined && data[h] !== null ? data[h] : '';
    });
    row.date = cleanDate;
    row.timeSlot = parseSheetTime_(data.timeSlot, ss);
    row.comprobanteUrl = comprobanteUrl;
    row.status = row.status || 'pendiente';
    row.createdAt = row.createdAt || now;
    row.updatedAt = now;

    var sheet = getBookingsSheet_(ss);
    appendRow_(sheet, BOOKING_HEADERS, row);

    return {
      success: true,
      booking: row,
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Permite al cliente reprogramar únicamente la fecha y/o la hora de su reserva
 * verificando código + documento y cupos disponibles. La cancelación es exclusiva del administrador.
 */
function rescheduleBooking_(ss, body) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var sheet = getBookingsSheet_(ss);
    var rows = sheetToObjects_(sheet);
    var targetCode = String(body.code || '').trim().toUpperCase();
    var targetDoc = String(body.customerDocument || '').replace(/\D/g, '');
    var newDate = parseSheetDate_(body.date);
    var newTime = parseSheetTime_(body.timeSlot, ss);

    var idx = rows.findIndex(function (r) {
      var sameCode = String(r.code || '').trim().toUpperCase() === targetCode;
      var sameDoc = String(r.customerDocument || '').replace(/\D/g, '') === targetDoc;
      return sameCode && (!targetDoc || sameDoc);
    });

    if (idx === -1) {
      return {
        success: false,
        error: 'No se encontró una reserva que coincida con ese código y documento.',
      };
    }

    var current = rows[idx];
    if (String(current.status).toLowerCase() === 'cancelada') {
      return {
        success: false,
        error: 'Esta reserva se encuentra cancelada. Solo el administrador puede gestionarla.',
      };
    }

    var config = getParkConfig_(ss);
    var allBookings = getBookings_(ss);
    var activeOthersSameDay = allBookings.filter(function (b) {
      return (
        String(b.id) !== String(current.id) &&
        String(b.code).toUpperCase() !== targetCode &&
        parseSheetDate_(b.date) === newDate &&
        String(b.status).toLowerCase() !== 'cancelada'
      );
    });

    if (config && config.schedule && String(current.serviceType) === 'pitbike') {
      var capPerHour = Number(config.schedule.pitBikeCapacityPerHour) || 5;
      var usedInSlot = activeOthersSameDay
        .filter(function (b) {
          return b.serviceType === 'pitbike' && parseSheetTime_(b.timeSlot, ss) === newTime;
        })
        .reduce(function (sum, b) {
          return sum + (Number(b.quantity) || 1);
        }, 0);

      var reqQty = Math.max(1, Number(current.quantity) || 1);
      if (usedInSlot + reqQty > capPerHour) {
        return {
          success: false,
          error:
            'Solo quedan ' +
            Math.max(0, capPerHour - usedInSlot) +
            ' cupo(s) disponibles en el nuevo horario seleccionado.',
        };
      }
    }

    current.date = newDate;
    current.timeSlot = newTime;
    current.updatedAt = new Date().toISOString();

    var rowNum = idx + 2;
    BOOKING_HEADERS.forEach(function (h, colIdx) {
      var val = current[h] !== undefined ? current[h] : '';
      if (h === 'timeSlot') {
        sheet.getRange(rowNum, colIdx + 1).setNumberFormat('@').setValue(String(val));
      } else {
        sheet.getRange(rowNum, colIdx + 1).setValue(val);
      }
    });

    return {
      success: true,
      booking: current,
    };
  } finally {
    lock.releaseLock();
  }
}

function updateBooking_(ss, id, updates) {
  var sheet = getBookingsSheet_(ss);
  var rows = sheetToObjects_(sheet);
  var idx = rows.findIndex(function (r) {
    return String(r.id) === String(id);
  });
  if (idx === -1) {
    return { success: false, error: 'Reserva no encontrada' };
  }

  var merged = {};
  BOOKING_HEADERS.forEach(function (h) {
    merged[h] = updates[h] !== undefined ? updates[h] : rows[idx][h];
  });
  merged.id = id;
  merged.date = parseSheetDate_(merged.date);
  merged.updatedAt = new Date().toISOString();

  var rowNum = idx + 2;
  BOOKING_HEADERS.forEach(function (h, colIdx) {
    sheet.getRange(rowNum, colIdx + 1).setValue(merged[h] !== undefined ? merged[h] : '');
  });

  return { success: true, booking: merged };
}

function deleteBooking_(ss, id) {
  var sheet = getBookingsSheet_(ss);
  var rows = sheetToObjects_(sheet);
  var idx = rows.findIndex(function (r) {
    return String(r.id) === String(id);
  });
  if (idx === -1) {
    return { success: false, error: 'Reserva no encontrada' };
  }
  sheet.deleteRow(idx + 2);
  return { success: true };
}

function getBookings_(ss) {
  var sheet = getBookingsSheet_(ss);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheetToObjects_(sheet).map(function (b) {
    b.date = parseSheetDate_(b.date);
    b.timeSlot = parseSheetTime_(b.timeSlot, ss);
    b.quantity = Number(b.quantity) || 1;
    b.unitPrice = Number(b.unitPrice) || 0;
    b.totalPrice = Number(b.totalPrice) || 0;
    return b;
  });
}

// ─── Subida de Comprobantes a Google Drive ───────────────────────────────────

function saveComprobanteToDrive_(data) {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var parts = String(data.comprobanteArchivo || '').split(',');
    var base64 = parts.length > 1 ? parts[1] : parts[0];
    var ext = getFileExtension_(data.comprobanteFileName, data.comprobanteFileType);
    var safeCode = sanitizeFileNamePart_(data.code || 'GXP');
    var safeDoc = sanitizeFileNamePart_(data.customerDocument || 'CLIENTE');
    var safeDate = sanitizeFileNamePart_(data.date || '');
    var fileName = safeCode + '_' + safeDate + '_' + safeDoc + '_COMPROBANTE.' + ext;

    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64),
      data.comprobanteFileType || 'image/jpeg',
      fileName
    );
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return '[Error al subir comprobante a Drive: ' + err.message + ']';
  }
}

// ─── Configuración del Parque (Costos, Horarios, Pagos, Exoneración) ─────────

function getParkConfig_(ss) {
  var sheet = getConfigSheet_(ss);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var rows = sheetToObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].key) === 'park_config' && rows[i].value) {
      try {
        return JSON.parse(String(rows[i].value));
      } catch (err) {
        return null;
      }
    }
  }
  return null;
}

function saveParkConfig_(ss, configObj) {
  var sheet = getConfigSheet_(ss);
  var now = new Date().toISOString();
  writeObjects_(sheet, CONFIG_HEADERS, [
    {
      key: 'park_config',
      value: JSON.stringify(configObj),
      updatedAt: now,
    },
  ]);
}

// ─── Hojas y Utilidades ──────────────────────────────────────────────────────

function getBookingsSheet_(ss) {
  return getOrCreateSheet_(ss, 'Bookings', BOOKING_HEADERS);
}

function getConfigSheet_(ss) {
  return getOrCreateSheet_(ss, 'Config', CONFIG_HEADERS);
}

function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    ensureSheetHeaders_(sheet, headers);
  }
  return sheet;
}

function ensureSheetHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
  headers.forEach(function (h) {
    if (current.indexOf(h) === -1) {
      var nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue(h).setFontWeight('bold');
    }
  });
}

function sheetToObjects_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function (h) {
    return String(h).trim();
  });
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var isEmpty = row.every(function (cell) {
      return String(cell || '').trim() === '';
    });
    if (isEmpty) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function appendRow_(sheet, headers, obj) {
  sheet.appendRow(
    headers.map(function (h) {
      return obj[h] !== undefined ? obj[h] : '';
    })
  );
}

function writeObjects_(sheet, headers, objects) {
  sheet.clear();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  objects.forEach(function (obj) {
    appendRow_(sheet, headers, obj);
  });
}

function parseSheetDate_(value) {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value.getTime())) {
    var y = value.getFullYear();
    var m = ('0' + (value.getMonth() + 1)).slice(-2);
    var d = ('0' + value.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  var str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return str;
}

function parseSheetTime_(value, ss) {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value.getTime())) {
    var tz = ss ? ss.getSpreadsheetTimeZone() : 'America/Bogota';
    return Utilities.formatDate(value, tz, 'HH:mm');
  }
  var str = String(value).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    var parts = str.split(':');
    return ('0' + Number(parts[0])).slice(-2) + ':' + parts[1];
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var tzIso = ss ? ss.getSpreadsheetTimeZone() : 'America/Bogota';
      return Utilities.formatDate(d, tzIso, 'HH:mm');
    }
  }
  return str;
}

function sanitizeFileNamePart_(value) {
  return String(value || 'dato')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

function getFileExtension_(fileName, mimeType) {
  var m = String(fileName || '').match(/\.([a-zA-Z0-9]{1,8})$/);
  if (m) return m[1].toLowerCase();
  if (mimeType && mimeType.indexOf('pdf') >= 0) return 'pdf';
  if (mimeType && mimeType.indexOf('png') >= 0) return 'png';
  if (mimeType && mimeType.indexOf('webp') >= 0) return 'webp';
  return 'jpg';
}

function rawJsonResponse_(jsonString) {
  return ContentService.createTextOutput(jsonString).setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ejecuta ESTA función manualmente desde el editor de Google Apps Script la primera vez
 * para crear las pestañas Bookings y Config y autorizar permisos de Google Sheets + Drive.
 */
function setupSheets() {
  var ss = getSpreadsheet_();
  getBookingsSheet_(ss);
  getConfigSheet_(ss);
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log('Google Sheet inicializada: ' + ss.getName());
  Logger.log('Carpeta de Comprobantes en Drive: ' + folder.getName());
}

