import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="h-14 flex-shrink-0 bg-darkBg border-b border-panelBorder flex items-center justify-center px-4 z-[9999] relative">
      <span className="text-sm font-semibold text-textPri tracking-wide">
        Interfaz de gestión de residuos
      </span>
    </header>
  );
};

