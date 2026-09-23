"use client";

import { useEffect, useState } from "react";
import { Eye, SunMoon, Accessibility, ArrowDown, Map } from "lucide-react";

export default function TopBar() {
  const [altoContraste, setAltoContraste] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("seduc_alto_contraste") === "true";
    if (saved) {
      setAltoContraste(true);
      document.documentElement.classList.add("alto-contraste");
    }
  }, []);

  const toggleAltoContraste = () => {
    const novoValor = !altoContraste;
    setAltoContraste(novoValor);
    if (novoValor) {
      document.documentElement.classList.add("alto-contraste");
      localStorage.setItem("seduc_alto_contraste", "true");
    } else {
      document.documentElement.classList.remove("alto-contraste");
      localStorage.setItem("seduc_alto_contraste", "false");
    }
  };

  return (
    <div className="bg-[#222222] text-[#F8F9FA] text-xs font-medium border-b border-[#333333]">
      {/* Skip links acessíveis para leitores de tela e navegação por teclado */}
      <a href="#conteudo-principal" className="skip-link">
        Ir para o conteúdo principal [1]
      </a>
      <a href="#menu-principal" className="skip-link">
        Ir para o menu de navegação [2]
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
        {/* Lado esquerdo: Atalhos de acessibilidade */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-gray-400 font-semibold tracking-wider uppercase text-[10px]">
            Portal Oficial &bull; Governo do Pará
          </span>
          <a
            href="#conteudo-principal"
            className="hidden md:inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
            title="Ir diretamente para o conteúdo principal"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Ir para o conteúdo</span>
          </a>
          <a
            href="#menu-principal"
            className="hidden md:inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
            title="Ir diretamente para o menu principal"
          >
            <span>Ir para o menu</span>
          </a>
        </div>

        {/* Lado direito: Ferramentas de acessibilidade e transparência */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleAltoContraste}
            className="inline-flex items-center gap-1 text-gray-300 hover:text-white focus:text-white transition-colors cursor-pointer py-1"
            title="Alternar modo de alto contraste para acessibilidade visual"
            aria-label="Alternar modo de alto contraste"
          >
            <SunMoon className="w-3.5 h-3.5 text-[#CD1719]" />
            <span className="font-medium">Alto Contraste</span>
          </button>

          <span className="text-gray-600 hidden sm:inline">|</span>

          <a
            href="https://seduc.pa.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
            title="Acessar o portal principal da SEDUC-PA"
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>seduc.pa.gov.br</span>
          </a>

          <span className="text-gray-600 hidden sm:inline">|</span>

          <a
            href="https://transparencia.pa.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors hidden xs:inline"
            title="Portal da Transparência do Governo do Estado do Pará"
          >
            Transparência
          </a>
        </div>
      </div>
    </div>
  );
}
