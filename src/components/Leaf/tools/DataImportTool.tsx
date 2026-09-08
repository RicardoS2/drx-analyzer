"use client";

import { useRef, useState } from "react";
import { Checkmark, Upload } from "@carbon/icons-react";
import type { AppState } from "@/types";

interface DataImportToolProps {
  state: AppState;
  onFileUpload: (type: "drx" | "peak" | "phase", file: File) => void;
}

type FileType = "drx" | "peak" | "phase";

export default function DataImportTool({ state, onFileUpload }: DataImportToolProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file, index) => {
      const types: FileType[] = ["drx", "peak", "phase"];
      if (types[index]) onFileUpload(types[index], file);
    });

    setMessage("Arquivos processados com sucesso.");
    event.target.value = "";
  };

  const loadedCount = [
    state.filesLoaded.drx,
    state.filesLoaded.peak,
    state.filesLoaded.phase,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".asc,.xy,.xye,.csv,.txt,.dat"
        className="hidden"
        onChange={handleFilesSelected}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group flex min-h-35 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border-default bg-surface-02 p-6 text-center outline-none transition-all duration-200 hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="rounded-full bg-surface p-3 shadow-sm transition-colors group-hover:bg-primary group-hover:text-white">
          <Upload
            size={24}
            aria-hidden={true}
            className="text-icon-secondary group-hover:text-white"
          />
        </div>
        <div>
          <span className="block text-sm font-semibold text-text-primary">
            Clique para selecionar arquivos
          </span>
          <span className="mt-1 block text-xs text-text-secondary">
            Você precisa dos arquivos DRX, Picos e Fases
          </span>
        </div>
      </button>

      <div className="rounded-lg border border-border-subtle bg-surface px-5 py-4">
        <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Status dos Arquivos
          </span>
          <span className="rounded-full bg-surface-03 px-2.5 py-0.5 text-xs font-bold text-text-primary">
            {loadedCount}/3
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {(["drx", "peak", "phase"] as FileType[]).map((type) => {
            const labels = {
              drx: "Difratograma (DRX)",
              peak: "Lista de Picos",
              phase: "Fases Identificadas",
            };
            const loaded = state.filesLoaded[type];
            return (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{labels[type]}</span>
                {loaded ? (
                  <span className="flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">
                    <Checkmark size={14} aria-hidden={true} />
                    Importado
                  </span>
                ) : (
                  <span className="rounded-md bg-surface-02 px-2 py-1 text-xs font-medium text-text-secondary">
                    Pendente
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-border-subtle bg-surface-02 px-4 py-3 text-sm font-medium text-text-secondary">
          {message}
        </div>
      )}
    </div>
  );
}
