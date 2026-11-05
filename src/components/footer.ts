import type { ParkConfig } from '../types';
import { getCachedParkConfigSync } from '../utils/storage';

export function renderFooter(config?: ParkConfig, showWhatsappFloat = true): string {
  const cfg = config ?? getCachedParkConfigSync();
  const wppClean = cfg.paymentInfo.whatsappNumber.replace(/\D/g, '') || '3208504410';
  const wppDisplay = cfg.paymentInfo.whatsappDisplay || '320 850 4410';
  const wppUrl = `https://wa.me/57${wppClean}?text=${encodeURIComponent(
    '¡Hola GREEN X PARK! Tengo una consulta sobre las reservas y experiencias de motocross.'
  )}`;

  return `
    <footer class="relative border-t border-lime-electric/25 bg-carbon-deep text-white">
      <!-- Top Neon Accent Line -->
      <div class="h-1 w-full bg-gradient-to-r from-carbon via-lime-electric to-carbon"></div>

      <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <!-- Col 1: Brand -->
          <div class="space-y-4">
            <div class="inline-block rounded-xl border border-lime-electric/40 bg-black p-2.5 shadow-lime-glow">
              <img
                src="./logo-green-x-park.jpeg"
                alt="GREEN X PARK Extreme Sports"
                class="h-14 w-auto object-contain"
              />
            </div>
            <div>
              <p class="font-title text-xl font-extrabold tracking-wide text-white">
                GREEN <span class="text-lime-electric">X</span> PARK
              </p>
              <p class="font-subtitle text-xs font-semibold tracking-[0.28em] text-lime-electric uppercase">
                EXTREME SPORTS
              </p>
            </div>
            <p class="text-sm text-white/70 leading-relaxed">
              Vive el motocross. Sé parte de la experiencia. No necesitas tener moto para vivir la adrenalina en un entorno diseñado para niños, jóvenes y adultos.
            </p>
          </div>

          <!-- Col 2: Navegación y Experiencias -->
          <div class="space-y-3">
            <h3 class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric flex items-center gap-2">
              <span class="slash-stripes"><span></span><span></span><span></span></span>
              Experiencias
            </h3>
            <ul class="space-y-2.5 text-sm text-white/75">
              <li>
                <a href="./servicios.html#vive-la-experiencia" class="hover:text-lime-electric transition-colors">
                  • Vive la Experiencia (Alquiler Pit Bikes)
                </a>
              </li>
              <li>
                <a href="./servicios.html#practica-libre" class="hover:text-lime-electric transition-colors">
                  • Práctica Libre (Derecho a Pista MX y Enduro)
                </a>
              </li>
              <li>
                <a href="./servicios.html#eventos-privados" class="hover:text-lime-electric transition-colors">
                  • Eventos Privados y Alquiler de Escenario
                </a>
              </li>
              <li>
                <a href="./reservar.html" class="font-semibold text-lime-neon hover:underline">
                  → Reservar mi hora en línea
                </a>
              </li>
            </ul>
          </div>

          <!-- Col 3: Horarios de Atención -->
          <div class="space-y-3">
            <h3 class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric flex items-center gap-2">
              <span class="slash-stripes"><span></span><span></span><span></span></span>
              Horarios de Atención
            </h3>
            <div class="space-y-3 text-sm">
              <div class="rounded-xl border border-white/10 bg-graphite/50 p-3">
                <p class="font-subtitle text-xs font-semibold uppercase text-lime-neon">Martes a viernes</p>
                <p class="font-title text-base font-extrabold text-white mt-0.5">${cfg.schedule.weekdayScheduleLabel}</p>
              </div>
              <div class="rounded-xl border border-white/10 bg-graphite/50 p-3">
                <p class="font-subtitle text-xs font-semibold uppercase text-lime-neon">Sábados, domingos y festivos</p>
                <p class="font-title text-base font-extrabold text-white mt-0.5">${cfg.schedule.weekendScheduleLabel}</p>
              </div>
            </div>
          </div>

          <!-- Col 4: Medios de Pago y Contacto -->
          <div class="space-y-3">
            <h3 class="font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric flex items-center gap-2">
              <span class="slash-stripes"><span></span><span></span><span></span></span>
              Medios de Pago y Contacto
            </h3>
            <div class="rounded-xl border border-lime-electric/30 bg-graphite/60 p-4 space-y-2.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-white/70 font-subtitle text-xs uppercase">Nequi:</span>
                <span class="font-title font-extrabold text-lime-electric tracking-wider">${cfg.paymentInfo.nequi.number}</span>
              </div>
              <div class="flex items-center justify-between border-t border-white/10 pt-2">
                <span class="text-white/70 font-subtitle text-xs uppercase">DaviPlata:</span>
                <span class="font-title font-extrabold text-lime-electric tracking-wider">${cfg.paymentInfo.daviplata.number}</span>
              </div>
              <div class="flex items-center justify-between border-t border-white/10 pt-2">
                <span class="text-white/70 font-subtitle text-xs uppercase">Contáctanos:</span>
                <a href="${wppUrl}" target="_blank" rel="noopener noreferrer" class="font-subtitle font-semibold text-white hover:text-lime-electric">
                  ${wppDisplay}
                </a>
              </div>
            </div>
            <div class="pt-1">
              <a href="./reservar.html" class="btn-x-primary w-full text-xs py-2.5">
                RESERVAR EN LÍNEA
              </a>
            </div>
          </div>
        </div>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
          <p>© ${new Date().getFullYear()} GREEN X PARK — EXTREME SPORTS. Todos los derechos reservados.</p>
          <div class="flex items-center gap-4">
            <a href="./reservar.html" class="hover:text-lime-electric transition-colors">Reservas</a>
            <span>•</span>
            <a href="./panel-greenxpark-gestion-2026.html" class="hover:text-lime-electric transition-colors">Panel Admin</a>
          </div>
        </div>
      </div>
    </footer>

    ${
      showWhatsappFloat
        ? `
      <a
        href="${wppUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="whatsapp-float"
        aria-label="Soporte por WhatsApp GREEN X PARK"
      >
        <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.492 5.448 5.587-1.466c1.908 1.258 4.189 1.985 6.642 1.985 6.627 0 12-5.373 12-12s-5.373-12-12.021-12z"/>
        </svg>
        <span class="hidden sm:inline">Soporte WhatsApp</span>
      </a>
    `
        : ''
    }
  `;
}

