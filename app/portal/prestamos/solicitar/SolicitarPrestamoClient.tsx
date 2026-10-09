'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearSolicitudPrestamoAction } from '@/actions/portal-prestamos';
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  DollarSign,
  Calendar,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

interface DocUploadItem {
  id: string;
  tipo: string;
  file: File | null;
}

export default function SolicitarPrestamoClient({
  dolarActual,
  tiposDocumentos,
  montoMaximoUsd,
  requerirDocumentos,
}: {
  dolarActual: number;
  tiposDocumentos: string[];
  montoMaximoUsd: number;
  requerirDocumentos: boolean;
}) {
  const router = useRouter();
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD');
  const [monto, setMonto] = useState<string>('1000');
  const [cuotas, setCuotas] = useState<string>('12');
  const [motivo, setMotivo] = useState<string>('Préstamo personal');
  const [ingresos, setIngresos] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Initial required documents
  const [docs, setDocs] = useState<DocUploadItem[]>(() =>
    tiposDocumentos.map((tipo, idx) => ({
      id: `doc_${idx}`,
      tipo,
      file: null,
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const montoNumero = parseFloat(monto) || 0;
  const montoUsdEstimado = moneda === 'USD' ? montoNumero : Math.round((montoNumero / dolarActual) * 100) / 100;
  const montoArsEstimado = moneda === 'ARS' ? montoNumero : Math.round(montoNumero * dolarActual);

  const handleFileChange = (docId: string, file: File | null) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, file } : d))
    );
  };

  const handleAddCustomDoc = () => {
    setDocs((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        tipo: 'Otro documento de respaldo',
        file: null,
      },
    ]);
  };

  const handleRemoveDoc = (docId: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (montoNumero <= 0) {
      setError('Ingresá un monto a solicitar válido.');
      return;
    }

    const archivosCargados = docs.filter((d) => d.file !== null);
    if (requerirDocumentos && archivosCargados.length === 0) {
      setError('Por favor adjuntá al menos un comprobante o documento de respaldo.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('monto_usd', String(montoUsdEstimado));
    formData.append('monto_ars', String(montoArsEstimado));
    formData.append('cantidad_cuotas', cuotas);
    formData.append('motivo', motivo);
    formData.append('ingresos_mensuales_ars', ingresos);
    formData.append('observaciones_cliente', observaciones);

    archivosCargados.forEach((item, index) => {
      if (item.file) {
        formData.append(`document_file_${index}`, item.file);
        formData.append(`document_tipo_${index}`, item.tipo);
      }
    });

    const res = await crearSolicitudPrestamoAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Ocurrió un error al enviar la solicitud.');
      return;
    }

    router.push('/portal/prestamos/validaciones?created=1');
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto w-full pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/portal/prestamos"
          className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> Solicitar Préstamo
          </h1>
          <p className="text-xs text-slate-400">Completá el monto y adjuntá tu documentación.</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Monto */}
        <div className="bg-slate-850 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Monto a Solicitar
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMoneda('USD')}
                className={`px-3 py-1 rounded-lg transition ${
                  moneda === 'USD' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setMoneda('ARS')}
                className={`px-3 py-1 rounded-lg transition ${
                  moneda === 'ARS' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                ARS
              </button>
            </div>
          </div>

          <div className="relative">
            <span className="text-xl font-black text-slate-500 absolute left-4 top-3.5">
              {moneda === 'USD' ? 'USD $' : '$'}
            </span>
            <input
              type="number"
              min="1"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full pl-16 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-750 text-white text-xl font-black focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between font-bold pt-1 border-t border-slate-800/80">
            <span>Equivalente:</span>
            <span className="text-emerald-400">
              {moneda === 'USD'
                ? `$${montoArsEstimado.toLocaleString('es-AR')} ARS`
                : `USD $${montoUsdEstimado.toLocaleString('es-AR')}`}
            </span>
          </div>
        </div>

        {/* Cuotas y Destino */}
        <div className="bg-slate-850 p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-lg">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Plazo de Devolución
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['3', '6', '12', '18', '24', '36'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuotas(c)}
                  className={`py-2 rounded-xl text-xs font-black border transition ${
                    cuotas === c
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 scale-105'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {c} cuotas
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Motivo o Destino
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Compra de vehículo, ampliación, etc."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Ingresos Mensuales Estimados (ARS)
            </label>
            <input
              type="number"
              value={ingresos}
              onChange={(e) => setIngresos(e.target.value)}
              placeholder="Ej. 1200000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Observaciones adicionales
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Comentarios para la agencia..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>
        </div>

        {/* Sección de Documentos */}
        <div className="bg-slate-850 p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-400" /> Documentación
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Formatos admitidos: PDF, JPG, PNG o WebP</p>
            </div>
            {requerirDocumentos && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Requerido
              </span>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> {doc.tipo}
                  </p>
                  {doc.id.startsWith('custom_') && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="text-slate-500 hover:text-red-400 text-xs p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {doc.file ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-emerald-500/30">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-white truncate font-medium">{doc.file.name}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        ({Math.round(doc.file.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileChange(doc.id, null)}
                      className="text-slate-400 hover:text-red-400 text-xs p-1 ml-2"
                      title="Quitar archivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/40 cursor-pointer transition text-xs text-slate-400 hover:text-slate-200">
                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange(doc.id, file);
                      }}
                      className="hidden"
                    />
                    <UploadCloud className="w-4 h-4 mr-1.5 text-slate-500" />
                    <span>Seleccionar archivo o foto</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddCustomDoc}
            className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            + Adjuntar otro documento
          </button>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-black transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Subiendo archivos y registrando...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Enviar Solicitud a la Agencia</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
