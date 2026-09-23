"use client";

import { useState } from "react";
import { Menu, X, BarChart3, School, AlertCircle, Award, BookOpen, FileText } from "lucide-react";

interface NavBarProps {
  activeTab?: string;
  onSelectTab?: (tab: "publicadas" | "nao_publicadas" | "eja_aee" | "ideb_dre") => void;
}

export default function NavBar({ activeTab, onSelectTab }: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: "publicadas" as const,
      label: "Escolas Publicadas",
      icon: School,
    },
    {
      id: "nao_publicadas" as const,
      label: "Não Publicadas (Fluxo)",
      icon: AlertCircle,
    },
    {
      id: "eja_aee" as const,
      label: "Bônus EJA e AEE",
      icon: BookOpen,
    },
    {
      id: "ideb_dre" as const,
      label: "IDEB por DRE",
      icon: BarChart3,
    },
  ];

  const handleTabClick = (tabId: "publicadas" | "nao_publicadas" | "eja_aee" | "ideb_dre") => {
    if (onSelectTab) {
      onSelectTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      id="menu-principal"
      aria-label="Menu principal do portal"
      className="bg-[#F8F9FA] border-b-[3px] border-[#A71B2B] shadow-xs relative z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Navegação Desktop (>= 768px) */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <span className="text-xs font-bold text-[#A71B2B] uppercase tracking-wider pr-3 border-r border-gray-300">
              Navegação
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "text-[#A71B2B] bg-[#FDF2F4] font-semibold border-b-2 border-[#A71B2B]"
                      : "text-[#1D1D1B] hover:text-[#A71B2B] hover:bg-gray-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#A71B2B]" : "text-[#6C757D]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Links adicionais institucionais à direita */}
          <div className="hidden md:flex items-center space-x-3 text-xs text-[#6C757D]">
            <a
              href="https://seduc.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#A71B2B] transition-colors"
            >
              Legislação &bull; Portarias
            </a>
            <span>&bull;</span>
            <span className="font-medium text-[#1D1D1B]">SEDUC / SECTET</span>
          </div>

          {/* Botão Mobile Hambúrguer (< 768px) */}
          <div className="flex md:hidden items-center justify-between w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A71B2B] flex items-center gap-1.5">
              <School className="w-4 h-4" />
              Portal de Resultados SEDUC
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-[#1D1D1B] hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A71B2B]"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#A71B2B]" />}
            </button>
          </div>
        </div>

        {/* Menu Dropdown Mobile (< 768px) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md text-left transition-colors ${
                    isActive
                      ? "bg-[#FDF2F4] text-[#A71B2B] font-semibold border-l-4 border-[#A71B2B]"
                      : "text-[#1D1D1B] hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#A71B2B]" : "text-[#6C757D]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
