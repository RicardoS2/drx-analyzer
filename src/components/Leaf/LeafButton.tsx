"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import { Download, SettingsAdjust, Sprout, Upload } from "@carbon/icons-react";
import type { PlotlyHTMLElement } from "plotly.js";
import type { AppState, ConfigState } from "@/types";

import DataImportTool from "./tools/DataImportTool";
import ChartTools from "./tools/ChartTools";
import ChartExport from "./tools/ChartExport";
import LeafCard from "./LeafCard";

interface LeafButtonProps {
  state: AppState;
  onFileUpload: (type: "drx" | "peak" | "phase", file: File) => void;
  onConfigChange: (config: Partial<ConfigState>) => void;
  plotElement?: PlotlyHTMLElement | null;
}

type LeafTool = "import" | "download" | "tools" | null;
type Position = { left: number; top: number };

interface DragSession {
  target: "leaf" | "card";
  offsetX: number;
  offsetY: number;
  dragging: boolean;
}

const BUTTON_SIZE = 56;
const EDGE_GAP = 16;
const CARD_MAX_WIDTH = 580;

export default function LeafButton({
  state,
  onFileUpload,
  onConfigChange,
  plotElement = null,
}: LeafButtonProps) {
  const [leafPosition, setLeafPosition] = useState<Position | null>(null);
  const [cardPosition, setCardPosition] = useState<Position | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<LeafTool>(null);
  const [dragging, setDragging] = useState(false);

  const leafRootRef = useRef<HTMLDivElement | null>(null);
  const cardRootRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  const clampPosition = useCallback((left: number, top: number, isCard: boolean) => {
    if (typeof window === "undefined") return { left, top };

    let width = BUTTON_SIZE;
    let height = BUTTON_SIZE;

    if (isCard) {
      width = cardRootRef.current?.getBoundingClientRect().width || CARD_MAX_WIDTH;
      height = cardRootRef.current?.getBoundingClientRect().height || 400;
    }

    const maxLeft = Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP);
    const maxTop = Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP);

    return {
      left: Math.min(Math.max(EDGE_GAP, left), maxLeft),
      top: Math.min(Math.max(EDGE_GAP, top), maxTop),
    };
  }, []);

  const openTool = (tool: "import" | "download" | "tools") => {
    const startPos = leafPosition || { left: EDGE_GAP, top: window.innerHeight / 2 };
    setCardPosition(clampPosition(startPos.left, startPos.top, true));
    setMenuOpen(false);
    setActiveTool(tool);
  };

  const closeTool = useCallback(() => {
    if (cardPosition) {
      setLeafPosition(clampPosition(cardPosition.left, cardPosition.top, false));
    }
    setActiveTool(null);
    setMenuOpen(false);
  }, [cardPosition, clampPosition]);

  const handleLeafPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const rect = leafRootRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragSessionRef.current = {
      target: "leaf",
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      dragging: false,
    };
  };

  const handleCardPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, [data-leaf-no-drag]")) return;

    const rect = cardRootRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragSessionRef.current = {
      target: "card",
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      dragging: false,
    };
  };

  // Efeito principal de Drag
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;

      if (!session.dragging) {
        session.dragging = true;
        setDragging(true);
        if (session.target === "leaf") setMenuOpen(false);
      }

      const next = clampPosition(
        event.clientX - session.offsetX,
        event.clientY - session.offsetY,
        session.target === "card",
      );

      if (session.target === "leaf") setLeafPosition(next);
      if (session.target === "card") setCardPosition(next);
    };

    const handlePointerUp = () => {
      if (dragSessionRef.current?.target === "leaf" && !dragSessionRef.current.dragging) {
        setMenuOpen((v) => !v);
      }
      dragSessionRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [clampPosition]);

  // Efeito de "Raio de Tolerância" para fechar o menu
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!leafRootRef.current) return;

      const rect = leafRootRef.current.getBoundingClientRect();
      // Encontra o centro exato do botão flutuante
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calcula a distância do mouse até o centro (Teorema de Pitágoras básico)
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2),
      );

      // Se o mouse se afastar mais de 180px do centro, fecha o menu
      if (distance > 180) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [menuOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeafPosition(
      (prev) => prev || { left: EDGE_GAP, top: window.innerHeight / 2 - BUTTON_SIZE / 2 },
    );
  }, []);

  const activeToolTitle =
    activeTool === "import"
      ? "Importar Dados"
      : activeTool === "download"
        ? "Exportar Gráfico"
        : "Ferramentas & Visual";

  return (
    <>
      {!activeTool && (
        <div
          ref={leafRootRef}
          className="fixed touch-none select-none animate-in zoom-in-95 fade-in duration-200"
          style={{
            zIndex: 1000,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            left: leafPosition?.left ?? -999,
            top: leafPosition?.top ?? -999,
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0">
            <MenuButton
              label="Importar"
              icon={Upload}
              open={menuOpen}
              angle={-52}
              onClick={() => openTool("import")}
            />
            <MenuButton
              label="Exportar"
              icon={Download}
              open={menuOpen}
              angle={0}
              onClick={() => openTool("download")}
            />
            <MenuButton
              label="Ajustes"
              icon={SettingsAdjust}
              open={menuOpen}
              angle={52}
              onClick={() => openTool("tools")}
            />
          </div>

          <button
            type="button"
            onPointerDown={handleLeafPointerDown}
            onMouseEnter={() => !dragging && setMenuOpen(true)}
            className={`relative z-30 flex h-14 w-14 items-center justify-center rounded-full border border-primary bg-primary-soft text-primary shadow-lg outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              dragging
                ? "cursor-grabbing scale-105"
                : "cursor-grab hover:scale-105 hover:bg-primary hover:text-white hover:shadow-xl"
            }`}
          >
            <Sprout size={24} />
          </button>
        </div>
      )}

      {activeTool && cardPosition && (
        <div
          ref={cardRootRef}
          className="fixed w-full touch-none select-none animate-in zoom-in-95 fade-in duration-200"
          style={{
            zIndex: 1100,
            maxWidth: CARD_MAX_WIDTH,
            left: cardPosition.left,
            top: cardPosition.top,
          }}
        >
          <LeafCard
            open={true}
            title={activeToolTitle}
            onClose={closeTool}
            dragging={dragging}
            onDragStart={handleCardPointerDown}
          >
            {activeTool === "import" && (
              <DataImportTool state={state} onFileUpload={onFileUpload} />
            )}
            {activeTool === "download" && (
              <ChartExport plotElement={plotElement} onClose={closeTool} />
            )}
            {activeTool === "tools" && <ChartTools state={state} onConfigChange={onConfigChange} />}
          </LeafCard>
        </div>
      )}
    </>
  );
}

function MenuButton({
  label,
  icon: Icon,
  open,
  angle,
  onClick,
}: {
  label: string;
  icon: ElementType;
  open: boolean;
  angle: number;
  onClick: () => void;
}) {
  const radius = 104;
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * radius;
  const y = Math.sin(radians) * radius;

  return (
    <div
      className={`absolute left-0 top-0 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      style={{
        width: 130,
        height: 44,
        transform: open
          ? `translate(${x - 65}px, ${y - 22}px) scale(1)`
          : `translate(${x * 0.7 - 65}px, ${y * 0.7 - 22}px) scale(0.9)`,
        transition: "transform 340ms cubic-bezier(0.16,1,0.3,1), opacity 180ms ease",
      }}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="flex h-full w-full items-center justify-center gap-2.5 rounded-full border border-border-default bg-surface px-4 text-sm font-semibold text-text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-surface-02 hover:shadow-xl"
      >
        <Icon size={18} className="text-primary" />
        <span>{label}</span>
      </button>
    </div>
  );
}
