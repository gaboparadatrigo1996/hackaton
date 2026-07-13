import React, { useState } from "react";
import { Menu, Sparkles, MessageSquare, Share2, ChevronDown, Check } from "lucide-react";

export const Header: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentInterface, setCurrentInterface] = useState("Interfaz de gestión de residuos");

  const interfaces = [
    "Interfaz de gestión de residuos",
    "Estadísticas de Reciclaje Urbano",
    "Planificación de Flota y Rutas",
    "Panel de Control IoT y Sensores"
  ];

  return (
    <header className="h-14 bg-darkBg border-b border-panelBorder flex items-center justify-between px-4 z-[9999] relative">
      {/* Left side: Hamburger menu + AI Icon */}
      <div className="flex items-center gap-4">
        <button className="text-textSec hover:text-textPri transition-colors p-1.5 hover:bg-panelBg rounded-md">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 text-accentPurp bg-accentPurp/10 px-2.5 py-1 rounded-md border border-accentPurp/20 cursor-pointer hover:bg-accentPurp/15 transition-all">
          <Sparkles className="h-4 w-4 text-accentPurp animate-pulse" />
          <span className="text-xs font-semibold tracking-wide">Copiloto IA</span>
        </div>
      </div>

      {/* Center: Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-textPri bg-panelBg/50 hover:bg-panelBg border border-panelBorder hover:border-textSec/30 px-4 py-1.5 rounded-lg transition-all shadow-sm"
        >
          <span>{currentInterface}</span>
          <ChevronDown className={`h-4 w-4 text-textSec transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-[10000]"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 glass-dropdown rounded-xl shadow-2xl p-1 z-[10001] animate-slide-in">
              {interfaces.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setCurrentInterface(item);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all text-left ${
                    currentInterface === item
                      ? "text-accentPurp bg-accentPurp/10 font-medium"
                      : "text-textSec hover:text-textPri hover:bg-panelBg"
                  }`}
                >
                  <span>{item}</span>
                  {currentInterface === item && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right side: Chat icon, share icon, Share button */}
      <div className="flex items-center gap-3">
        <button className="text-textSec hover:text-textPri transition-colors p-2 hover:bg-panelBg rounded-lg relative">
          <MessageSquare className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accentPurp rounded-full shadow-[0_0_6px_#7c3aed]" />
        </button>
        <button className="text-textSec hover:text-textPri transition-colors p-2 hover:bg-panelBg rounded-lg">
          <Share2 className="h-4 w-4" />
        </button>
        <button className="bg-accentPurp hover:bg-accentPurp/90 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-accentPurp/20 active:scale-95">
          Compartir
        </button>
      </div>
    </header>
  );
};
