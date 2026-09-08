"use client";

import type { PointerEventHandler, ReactNode } from "react";
import { Close } from "@carbon/icons-react";

interface LeafCardProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  onDragStart?: PointerEventHandler<HTMLDivElement>;
  dragging?: boolean;
}

const CARD_MAX_HEIGHT = 680;

export default function LeafCard({
  open,
  title = "Ferramentas",
  children,
  onClose,
  onDragStart,
  dragging = false,
}: LeafCardProps) {
  if (!open) return null;

  return (
    <section
      data-leaf-card
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface text-text-primary shadow-2xl shadow-black/10"
      style={{
        maxHeight: `min(${CARD_MAX_HEIGHT}px, calc(100vh - 24px))`,
      }}
    >
      <header
        data-leaf-card-drag
        onPointerDown={onDragStart}
        className={`flex h-14 shrink-0 touch-none select-none items-center justify-between gap-4 border-b border-border-subtle bg-surface-02 px-5 transition-colors ${
          dragging ? "cursor-grabbing bg-surface-03" : "cursor-grab hover:bg-surface-03"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden={true} />
          <h2 className="min-w-0 truncate text-sm font-semibold tracking-wide text-text-primary">
            {title}
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            data-leaf-no-drag
            aria-label="Fechar"
            title="Fechar"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-icon-secondary outline-none transition-all duration-150 hover:bg-surface-03 hover:text-error focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Close size={20} aria-hidden={true} />
          </button>
        )}
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-surface p-5"
        style={{
          maxHeight: `calc(min(${CARD_MAX_HEIGHT}px, 100vh - 24px) - 56px)`,
        }}
      >
        <div className="w-full min-w-0">{children}</div>
      </div>
    </section>
  );
}
