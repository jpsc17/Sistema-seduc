"use client";

import { useState } from "react";
import { Info, X, Layers, CheckCircle2 } from "lucide-react";

export default function HeaderBanner() {
  const [showModal, setShowModal] = useState(false);

  return (
    <section className="bg-white border-b border-slate-200/80 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Resultados Educacionais e Índice de Bônus
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Resultados Educacionais e Índice de Bônus — Exercício 2025
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir metodologia e critérios"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Metodologia e Critérios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal sutil de Metodologia e Critérios */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-metodologia-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <h3
                  id="modal-metodologia-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Metodologia e Critérios de Conformidade
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Os índices apurados seguem a metodologia de metas da <strong>SEDUC-PA</strong>,
                ponderando aprovação de fluxo, notas padronizadas e inclusão de unidades EJA e AEE.
              </p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Abrangência Estadual:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% dos Polos DRE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Exercício de Referência:</span>
                  <span className="font-medium text-slate-800">2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Base Homologada:</span>
                  <span className="font-medium text-slate-800">Censo Escolar &amp; IDEB</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
