export type ActivePage = 'home' | 'servicios' | 'reservar' | 'admin';

export function renderNavbar(activePage: ActivePage): string {
  const linkClass = (page: ActivePage) =>
    activePage === page
      ? 'font-subtitle text-sm font-semibold uppercase tracking-wider text-lime-electric border-b-2 border-lime-electric pb-1'
      : 'font-subtitle text-sm font-semibold uppercase tracking-wider text-white/75 hover:text-lime-electric transition-colors pb-1';

  return `
    <header class="sticky top-0 z-40 border-b border-white/10 bg-carbon/90 backdrop-blur-xl">
      <!-- Top Telemetry Bar -->
      <div class="border-b border-white/5 bg-carbon-deep/90 px-4 py-1.5 text-xs">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 font-subtitle font-semibold text-lime-electric">
              <span class="h-2 w-2 rounded-full bg-lime-electric animate-pulse"></span>
              PISTA ACTIVA • RESERVAS EN LÍNEA
            </span>
            <span class="hidden text-white/40 sm:inline">|</span>
            <span class="hidden text-white/70 sm:inline font-body">
              Mar–Vie: 8:00 a. m. – 5:00 p. m. • Sáb, Dom y Festivos: 9:00 a. m. – 6:00 p. m.
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-white/70 font-body">
              Nequi / DaviPlata: <strong class="text-lime-neon font-subtitle">320 850 4410</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Main Navigation -->
      <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8" aria-label="Navegación principal">
        <a href="./index.html" class="group flex items-center gap-3 focus:outline-none">
          <div class="relative overflow-hidden rounded-lg border border-lime-electric/40 bg-black px-2.5 py-1 shadow-lime-glow transition-transform duration-300 group-hover:scale-105">
            <img
              src="./logo-green-x-park.jpeg"
              alt="GREEN X PARK Logo"
              class="h-10 w-auto sm:h-12 object-contain"
            />
          </div>
          <div class="hidden xl:block">
            <span class="block font-title text-lg font-extrabold tracking-wider text-white leading-none">
              GREEN <span class="text-lime-electric">X</span> PARK
            </span>
            <span class="block font-subtitle text-[10px] font-semibold tracking-[0.25em] text-lime-racing uppercase mt-0.5">
              EXTREME SPORTS
            </span>
          </div>
        </a>

        <!-- Desktop Links -->
        <div class="hidden md:flex items-center gap-8">
          <a href="./index.html" class="${linkClass('home')}">Inicio</a>
          <a href="./index.html#nuestra-historia" class="font-subtitle text-sm font-semibold uppercase tracking-wider text-white/75 hover:text-lime-electric transition-colors pb-1">Nuestra Historia</a>
          <a href="./servicios.html" class="${linkClass('servicios')}">Experiencias y Tarifas</a>
          <a href="./index.html#horarios" class="font-subtitle text-sm font-semibold uppercase tracking-wider text-white/75 hover:text-lime-electric transition-colors pb-1">Horarios</a>
          <a href="./reservar.html" class="${linkClass('reservar')}">Reservar Cupo</a>
        </div>

        <!-- CTA Button -->
        <div class="hidden md:flex items-center gap-3">
          <a href="./reservar.html" class="btn-x-primary text-xs sm:text-sm py-2.5 px-6">
            <span>RESERVAR AHORA</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          type="button"
          id="mobile-menu-btn"
          class="inline-flex md:hidden items-center justify-center rounded-lg border border-lime-electric/40 bg-graphite/80 p-2.5 text-lime-electric hover:bg-lime-electric hover:text-carbon transition-colors"
          aria-expanded="false"
          aria-controls="mobile-menu"
          aria-label="Abrir menú de navegación"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      <!-- Mobile Drawer -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-white/10 bg-carbon/95 px-4 pt-3 pb-6 space-y-3">
        <a href="./index.html" class="block rounded-lg px-3 py-2.5 font-subtitle text-sm font-semibold uppercase tracking-wider ${activePage === 'home' ? 'bg-lime-electric/15 text-lime-electric' : 'text-white/80 hover:bg-white/5'}">
          Inicio
        </a>
        <a href="./index.html#nuestra-historia" class="block rounded-lg px-3 py-2.5 font-subtitle text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/5">
          Nuestra Historia
        </a>
        <a href="./servicios.html" class="block rounded-lg px-3 py-2.5 font-subtitle text-sm font-semibold uppercase tracking-wider ${activePage === 'servicios' ? 'bg-lime-electric/15 text-lime-electric' : 'text-white/80 hover:bg-white/5'}">
          Experiencias y Tarifas
        </a>
        <a href="./index.html#horarios" class="block rounded-lg px-3 py-2.5 font-subtitle text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/5">
          Horarios de Atención
        </a>
        <div class="pt-2">
          <a href="./reservar.html" class="btn-x-primary w-full justify-center text-sm py-3">
            RESERVA TU EXPERIENCIA
          </a>
        </div>
      </div>
    </header>
  `;
}

export function initNavbarEvents(): void {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isHidden = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !isHidden);
    btn.setAttribute('aria-expanded', String(isHidden));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

