'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, DollarSign, Eye, EyeOff, Image as ImageIcon, Loader2, Palette, Save, Smartphone, Sparkles, ShieldAlert, Globe, CheckCircle2, Check, FileText, HandCoins } from 'lucide-react';
import { guardarConfiguracion, guardarPwaVendedorConfig, subirLogoTenant, subirLogoDocumento, guardarBrandingDocumentosAction } from '@/actions/config';
import { guardarPortalClientesConfigAction } from '@/actions/portal-config';
import { SellerPwaConfig } from '@/lib/seller-pwa-config';
import { ClientPwaConfig, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { useConfigStore } from '@/store/useConfigStore';
import { PALETTE_LIST, ColorPalette } from '@/components/theme/palettes';
import { useERPTheme } from '@/components/theme/ThemeContext';

export default function ConfiguracionClient({ initial }: { initial: any }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileVentaRef = useRef<HTMLInputElement>(null);
  const filePrestamoRef = useRef<HTMLInputElement>(null);
  const { setDolar, setTipoDolar, setLogo, setTema } = useConfigStore();
  const { palette: activeThemePalette, setPalette } = useERPTheme();

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLogoVenta, setUploadingLogoVenta] = useState(false);
  const [uploadingLogoPrestamo, setUploadingLogoPrestamo] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(
    initial.branding?.paletteId || 'orange'
  );
  const [logoVenta, setLogoVenta] = useState<string>(
    initial.branding?.logoVenta || initial.logoUrl || ''
  );
  const [logoPrestamo, setLogoPrestamo] = useState<string>(
    initial.branding?.logoPrestamo || initial.logoUrl || ''
  );

  const [form, setForm] = useState({
    appName: initial.appName || initial.tenantName || 'OnlyCars',
    dolarActual: String(initial.dolarActual || 1400),
    tipoDolar: initial.tipoDolar || 'blue',
    tnaFinanciacion: String(initial.tnaFinanciacion ?? 48),
    comisionVentaDefecto: String(initial.comisionVentaDefecto ?? 3),
    logoUrl: initial.logoUrl || '',
    primaryColor: initial.primaryColor || '#2563eb',
    secondaryColor: initial.secondaryColor || '#0f172a',
    telefonoContacto: initial.telefonoContacto || '',
    emailContacto: initial.emailContacto || '',
    whatsappLead: initial.whatsappLead || '',
    cuit: initial.cuit || '',
    razonSocial: initial.razonSocial || '',
    direccion: initial.direccion || '',
    pieImpresion: initial.pieImpresion || '',
  });
  const [sellerPwa, setSellerPwa] = useState<SellerPwaConfig>(initial.sellerPwa);
  const [clientPwa, setClientPwa] = useState<ClientPwaConfig>(normalizeClientPwaConfig(initial.clientPwa));

  const input = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]';
  const label = 'block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

  const handleLogoVenta = async (file?: File) => {
    if (!file) return;
    setError('');
    setUploadingLogoVenta(true);
    const data = new FormData();
    data.append('file', file);
    const res = await subirLogoDocumento('venta', data);
    setUploadingLogoVenta(false);
    if (!res.success || !res.url) return setError(res.error || 'No se pudo subir el logo para boleto de venta.');
    setLogoVenta(res.url);
    if (fileVentaRef.current) fileVentaRef.current.value = '';
  };

  const handleLogoPrestamo = async (file?: File) => {
    if (!file) return;
    setError('');
    setUploadingLogoPrestamo(true);
    const data = new FormData();
    data.append('file', file);
    const res = await subirLogoDocumento('prestamo', data);
    setUploadingLogoPrestamo(false);
    if (!res.success || !res.url) return setError(res.error || 'No se pudo subir el logo para boleto de préstamos.');
    setLogoPrestamo(res.url);
    if (filePrestamoRef.current) filePrestamoRef.current.value = '';
  };

  const handlePaletteSelect = (palId: string) => {
    setSelectedPaletteId(palId);
    setPalette(palId);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');

    const savePromises: Promise<any>[] = [
      guardarConfiguracion({ ...form, dolarActual: Number(form.dolarActual), tnaFinanciacion: Number(form.tnaFinanciacion), comisionVentaDefecto: Number(form.comisionVentaDefecto), logoUrl: form.logoUrl || null }),
      guardarPwaVendedorConfig(sellerPwa),
      guardarBrandingDocumentosAction({ logoVenta, logoPrestamo, paletteId: selectedPaletteId }),
    ];

    if (initial.isClientPwaEnabled) {
      savePromises.push(guardarPortalClientesConfigAction(clientPwa));
    }

    const results = await Promise.all(savePromises);
    const res = results[0];
    const pwaRes = results[1];
    const brandingRes = results[2];
    const clientRes = results[3];

    setSaving(false);
    if (!res.success) return setError(res.error || 'No se pudo guardar la configuración.');
    if (!pwaRes.success) return setError(pwaRes.error || 'No se pudo guardar la configuración de vendedores.');
    if (brandingRes && !brandingRes.success) return setError(brandingRes.error || 'No se pudo guardar los logos de boletos.');
    if (clientRes && !clientRes.success) return setError(clientRes.error || 'No se pudo guardar la configuración del portal de clientes.');

    setDolar(Number(form.dolarActual));
    setTipoDolar(form.tipoDolar);
    setLogo(form.logoUrl || null);
    setTema({ primary: form.primaryColor, secondary: form.secondaryColor });
    setPalette(selectedPaletteId);
    router.refresh();
  };

  const togglePwa = (key: keyof SellerPwaConfig) => {
    setSellerPwa((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.showArsPrices && !next.showUsdPrices) {
        if (key === 'showArsPrices') next.showUsdPrices = true;
        else next.showArsPrices = true;
      }
      return next;
    });
  };

  const pwaOptions: { key: keyof SellerPwaConfig; title: string; detail: string }[] = [
    { key: 'showArsPrices', title: 'Precios en pesos', detail: 'Muestra ARS como precio comercial visible.' },
    { key: 'showUsdPrices', title: 'Precios en dólares', detail: 'Muestra USD junto al valor en pesos.' },
    { key: 'showReservationOwner', title: 'Titular de la reserva', detail: 'Permite ver a nombre de quién está reservada una unidad.' },
    { key: 'showCostAndMargin', title: 'Costo y margen', detail: 'Información sensible de rentabilidad. Apagado por defecto.' },
    { key: 'showNotes', title: 'Bitácora interna', detail: 'Permite leer y agregar notas desde la ficha móvil.' },
    { key: 'allowCloseSales', title: 'Cerrar ventas', detail: 'Permite confirmar una operación desde el cotizador móvil.' },
  ];

  return (
    <form onSubmit={save} className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 pb-28">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-default,#FF6600)]">Gestión</p><h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">Configuración de concesionaria</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Datos fiscales, moneda, financiación, vendedores e identidad visual en un único lugar.</p></div>
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 text-sm font-bold text-red-700 dark:text-red-300">{error}</div>}

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-[var(--color-primary-default,#FF6600)]" /><div><h2 className="font-black text-slate-900 dark:text-slate-100">Empresa y documentación</h2><p className="text-xs text-slate-500 dark:text-slate-400">Estos datos se usan en boletos, recibos y fichas.</p></div></header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Nombre comercial</label><input className={input} value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} /></div>
          <div><label className={label}>Razón social</label><input className={input} value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} /></div>
          <div><label className={label}>CUIT</label><input className={input} value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} placeholder="30-XXXXXXXX-X" /></div>
          <div><label className={label}>Dirección</label><input className={input} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
          <div><label className={label}>Teléfono comercial</label><input className={input} value={form.telefonoContacto} onChange={(e) => setForm({ ...form, telefonoContacto: e.target.value })} /></div>
          <div><label className={label}>Email comercial</label><input type="email" className={input} value={form.emailContacto} onChange={(e) => setForm({ ...form, emailContacto: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={label}>WhatsApp para leads</label><input className={input} value={form.whatsappLead} onChange={(e) => setForm({ ...form, whatsappLead: e.target.value })} placeholder="54911..." /></div>
          <div className="md:col-span-2"><label className={label}>Pie de impresión</label><textarea className={`${input} min-h-20`} value={form.pieImpresion} onChange={(e) => setForm({ ...form, pieImpresion: e.target.value })} placeholder="Leyenda opcional para documentación comercial" /></div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-800/40 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><div><h2 className="font-black text-slate-900 dark:text-slate-100">Moneda y financiación</h2><p className="text-xs text-slate-500 dark:text-slate-400">ARS es moneda principal; USD queda como referencia comercial y contable.</p></div></header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className={label}>Tipo de dólar</label><select className={input} value={form.tipoDolar} onChange={(e) => setForm({ ...form, tipoDolar: e.target.value })}><option value="blue">Blue</option><option value="oficial">Oficial</option><option value="mep">MEP</option></select></div>
          <div><label className={label}>Cotización ARS / USD</label><input type="number" min="1" step="0.01" className={input} value={form.dolarActual} onChange={(e) => setForm({ ...form, dolarActual: e.target.value })} /></div>
          <div><label className={label}>TNA financiación %</label><input type="number" min="0" step="0.01" className={input} value={form.tnaFinanciacion} onChange={(e) => setForm({ ...form, tnaFinanciacion: e.target.value })} /></div>
          <div><label className={label}>Comisión vendedor %</label><input type="number" min="0" step="0.01" className={input} value={form.comisionVentaDefecto} onChange={(e) => setForm({ ...form, comisionVentaDefecto: e.target.value })} /></div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-800/40 flex items-center gap-2"><Smartphone className="w-5 h-5 text-[var(--color-primary-default,#FF6600)]" /><div><h2 className="font-black text-slate-900 dark:text-slate-100">App de vendedores</h2><p className="text-xs text-slate-500 dark:text-slate-400">Configuración visual y operativa de la PWA.</p></div></header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {pwaOptions.map((option) => { const enabled = sellerPwa[option.key]; return <button key={option.key} type="button" onClick={() => togglePwa(option.key)} className={`text-left rounded-2xl border p-4 flex items-start justify-between gap-4 transition-colors ${enabled ? 'border-orange-200 dark:border-orange-900/60 bg-[var(--bg-primary-light,#FFF5EB)] dark:bg-orange-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}><div><p className="font-black text-slate-900 dark:text-slate-100">{option.title}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{option.detail}</p></div><span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-[var(--bg-primary-default,#FF6600)] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}</span></button>; })}
        </div>
      </section>

      {/* App de Clientes y Catálogo (Módulo Premium) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                App Clientes & Catálogo PWA
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase">
                  Módulo Premium
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portal progresivo móvil para clientes con catálogo público, cuotas y préstamos.
              </p>
            </div>
          </div>
          {initial.isClientPwaEnabled && (
            <a
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
            >
              <Globe className="w-3.5 h-3.5" /> Abrir Portal Web
            </a>
          )}
        </header>

        {!initial.isClientPwaEnabled ? (
          <div className="p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">Módulo Premium no activado para tu plan</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Este módulo permite a tus clientes ver su plan de cuotas, consultar préstamos, solicitar financiación con documentos y navegar tu catálogo de autos en una PWA personalizada.
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                Contactá a NanoLabs / SuperAdmin para habilitar la App Clientes en tu concesionaria.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">Link del Portal para tus Clientes:</p>
                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">/portal</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(`${window.location.origin}/portal`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 shadow-sm transition"
              >
                {copiedLink ? '¡Enlace copiado!' : 'Copiar Link'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'habilitarCatalogo', title: 'Catálogo público de vehículos', detail: 'Permite a cualquier persona ver autos sin estar logueada.' },
                { key: 'habilitarPlanCuotas', title: 'Visualización de plan de cuotas', detail: 'Los clientes pueden consultar cuotas pagas, pendientes y montos.' },
                { key: 'habilitarPrestamos', title: 'Préstamos de dinero adquiridos', detail: 'Permite a los clientes ver el estado y cuotas de sus préstamos.' },
                { key: 'habilitarSolicitudPrestamos', title: 'Solicitud online de préstamos', detail: 'Habilita a los clientes solicitar nuevos préstamos desde la app.' },
                { key: 'requerirDocumentacion', title: 'Exigir documentación obligatoria', detail: 'Requiere adjuntar DNI o recibos para enviar solicitudes.' },
              ].map((opt) => {
                const enabled = (clientPwa as any)[opt.key];
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setClientPwa((prev: any) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                    className={`text-left rounded-2xl border p-4 flex items-start justify-between gap-4 transition-colors ${
                      enabled ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <p className="font-black text-slate-900 dark:text-slate-100">{opt.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{opt.detail}</p>
                    </div>
                    <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className={label}>WhatsApp para consultas de clientes</label>
                <input
                  className={input}
                  value={clientPwa.whatsappContacto}
                  onChange={(e) => setClientPwa((prev) => ({ ...prev, whatsappContacto: e.target.value }))}
                  placeholder="549341..."
                />
              </div>

              <div>
                <label className={label}>Monto máximo sugerido para solicitud (USD)</label>
                <input
                  type="number"
                  className={input}
                  value={clientPwa.montoMaximoPrestamoUsd}
                  onChange={(e) => setClientPwa((prev) => ({ ...prev, montoMaximoPrestamoUsd: Number(e.target.value) }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className={label}>Mensaje de bienvenida en el Portal</label>
                <textarea
                  className={`${input} min-h-16`}
                  value={clientPwa.mensajeBienvenida}
                  onChange={(e) => setClientPwa((prev) => ({ ...prev, mensajeBienvenida: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN IDENTIDAD VISUAL: PALETA DE COLORES Y LOGOS DE BOLETOS */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--color-primary-default,#FF6600)]" />
          <div>
            <h2 className="font-black text-slate-900 dark:text-slate-100">Identidad visual y boletos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Elegí la paleta de colores corporativa y subí los logos oficiales para los boletos de venta y de préstamos.
            </p>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* 1. SELECCIÓN DE PALETA DE COLORES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Paleta de colores del sistema
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define los colores de acento, botones, degradés y detalles luminosos en toda la plataforma.
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--color-primary-default,#FF6600)] bg-[var(--bg-primary-light,#FFF5EB)] dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                Activa: {activeThemePalette.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PALETTE_LIST.map((pal) => {
                const isSelected = selectedPaletteId === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handlePaletteSelect(pal.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 dark:border-white ring-2 ring-[var(--color-primary-default,#FF6600)] bg-slate-50/80 dark:bg-slate-800/60 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                        style={{
                          background: pal.gradient,
                          boxShadow: `0 2px 8px ${pal.glow}`,
                        }}
                      />
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[var(--color-primary-default,#FF6600)] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-xs text-slate-900 dark:text-slate-100">{pal.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{pal.primary}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. LOGOS PARA BOLETOS: VENTA Y PRÉSTAMOS */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="mb-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Logotipos para documentos oficiales
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Subí imágenes con fondo transparente (PNG, WebP o JPG) para imprimir en los contratos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LOGO BOLETO DE VENTA */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <FileText size={16} /> Boleto de Venta
                    </span>
                    {logoVenta && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                        Cargado
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                    Logo para Boleto de Venta
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Se imprime en el encabezado del boleto de compra-venta vehicular.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={uploadingLogoVenta}
                    onClick={() => fileVentaRef.current?.click()}
                    className="w-full min-h-36 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800/50 hover:border-blue-400 overflow-hidden disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {uploadingLogoVenta ? (
                      <div className="text-center text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p className="text-xs font-black">Subiendo a Cloudflare...</p>
                      </div>
                    ) : logoVenta ? (
                      <img src={logoVenta} alt="Logo Venta" className="max-h-24 max-w-[80%] object-contain" />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Seleccionar logo de venta</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG o WebP</p>
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileVentaRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    hidden
                    onChange={(e) => handleLogoVenta(e.target.files?.[0])}
                  />
                  {logoVenta && (
                    <button
                      type="button"
                      onClick={() => setLogoVenta('')}
                      className="text-xs font-bold text-red-600 dark:text-red-400 mt-2 hover:underline cursor-pointer"
                    >
                      Quitar logo de venta
                    </button>
                  )}
                </div>
              </div>

              {/* LOGO BOLETO DE PRÉSTAMOS */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <HandCoins size={16} /> Boleto de Préstamos
                    </span>
                    {logoPrestamo && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                        Cargado
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                    Logo para Boleto de Préstamos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Se imprime en el contrato de mutuo dinerario y plan de cuotas.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={uploadingLogoPrestamo}
                    onClick={() => filePrestamoRef.current?.click()}
                    className="w-full min-h-36 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800/50 hover:border-emerald-400 overflow-hidden disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {uploadingLogoPrestamo ? (
                      <div className="text-center text-emerald-600 dark:text-emerald-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p className="text-xs font-black">Subiendo a Cloudflare...</p>
                      </div>
                    ) : logoPrestamo ? (
                      <img src={logoPrestamo} alt="Logo Préstamo" className="max-h-24 max-w-[80%] object-contain" />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Seleccionar logo de préstamos</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG o WebP</p>
                      </div>
                    )}
                  </button>
                  <input
                    ref={filePrestamoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    hidden
                    onChange={(e) => handleLogoPrestamo(e.target.files?.[0])}
                  />
                  {logoPrestamo && (
                    <button
                      type="button"
                      onClick={() => setLogoPrestamo('')}
                      className="text-xs font-bold text-red-600 dark:text-red-400 mt-2 hover:underline cursor-pointer"
                    >
                      Quitar logo de préstamos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end z-50">
        <button
          type="submit"
          disabled={saving || uploadingLogo || uploadingLogoVenta || uploadingLogoPrestamo}
          className="px-7 py-3 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar configuración
        </button>
      </div>
    </form>
  );
}
