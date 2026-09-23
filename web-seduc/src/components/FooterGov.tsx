"use client";

import { Shield, Phone, Mail, MapPin, ExternalLink, ArrowUp } from "lucide-react";

export default function FooterGov() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#1D1D1B] text-[#F8F9FA] text-xs pt-12 pb-8 border-t-[4px] border-[#A71B2B] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Bloco Superior do Rodapé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-800">
          {/* Coluna 1: Identificação Institucional */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/brasao5.png"
                alt="Brasão do Estado do Pará"
                className="h-12 w-auto object-contain brightness-105"
              />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                  Governo do Estado do Pará
                </span>
                <span className="text-sm font-extrabold text-white block">
                  SEDUC &bull; Pará
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Secretaria de Estado de Educação do Pará. Promovendo a qualidade do ensino e a valorização
              dos profissionais da educação básica.
            </p>
          </div>

          {/* Coluna 2: Transparência e Controle Social */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#CD1719]" />
              Transparência Pública
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="https://transparencia.pa.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Portal da Transparência PA</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://seduc.pa.gov.br/acesso-a-informacao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Lei de Acesso à Informação (LAI)
                </a>
              </li>
              <li>
                <a
                  href="https://www.ioepa.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Diário Oficial do Estado (IOEPA)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://seduc.pa.gov.br/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Privacidade e Proteção de Dados (LGPD)
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento e Ouvidoria */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#CD1719]" />
              Atendimento e Ouvidoria
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>Central: (91) 3201-5000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>ouvidoria@seduc.pa.gov.br</span>
              </li>
              <li>
                <a
                  href="https://seduc.pa.gov.br/ouvidoria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CD1719] hover:underline font-medium inline-block mt-1"
                >
                  Registrar Manifestação na Ouvidoria &rarr;
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Endereço da Sede */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#CD1719]" />
              Sede Administrativa
            </h4>
            <address className="not-italic text-gray-400 leading-relaxed space-y-1">
              <p className="font-semibold text-gray-200">SEDUC - Secretaria de Educação</p>
              <p>Rodovia Augusto Montenegro, Km 10, s/n</p>
              <p>Bairro Parque Verde &bull; Belém - PA</p>
              <p>CEP: 66820-000</p>
            </address>
          </div>
        </div>

        {/* Linha Inferior com Copyright e Botão Voltar ao Topo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-[11px]">
          <div>
            <p>
              &copy; {new Date().getFullYear()} Governo do Estado do Pará &bull; Secretaria de Estado de Educação (SEDUC).
            </p>
            <p className="text-gray-500 mt-0.5">
              Sistema de Acompanhamento de Metas e Bônus &bull; Exercício 2025 &bull; Padrão eMAG de Acessibilidade
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Voltar ao início da página"
          >
            <span>Voltar ao topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
