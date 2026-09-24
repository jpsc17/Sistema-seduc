"use client";

interface NavBarProps {
  activeTab?: string;
  onSelectTab?: (tab: "publicadas" | "nao_publicadas" | "eja_aee" | "ideb_dre") => void;
}

export default function NavBar({ activeTab, onSelectTab }: NavBarProps = {}) {
  return (
    <nav
      id="menu-institucional"
      aria-label="Links institucionais"
      className="bg-white border-b border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-9 text-xs">
          <div className="flex items-center space-x-4 text-slate-500">
            <span className="font-semibold text-slate-700 tracking-tight">
              Portal de Avaliação e Indicadores Educacionais
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <a
              href="https://seduc.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              Legislação &bull; Portarias
            </a>
            <span>&bull;</span>
            <span className="font-medium text-slate-700">SEDUC / SECTET</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
