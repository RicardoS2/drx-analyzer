import React from "react";
import { AppState } from "@/types";
import { Download } from "lucide-react";

export default function DataTables({ state }: { state: AppState }) {
  if (state.correlations.length === 0 && state.phases.length === 0) {
    return null;
  }

  const exportCSV = () => {
    const header = "2Theta,Intensidade,Fase,Formula\n";

    const rows = state.correlations
      .map(
        (c) =>
          `${c.twoThetaReal},${c.intensityReal},"${c.phases
            .map((p) => p.name)
            .join("; ")}","${c.phases.map((p) => p.formula).join("; ")}"`,
      )
      .join("\n");

    const blob = new Blob([header + rows], {
      type: "text/csv",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "drx_correlacoes.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8 bg-[#F8F7F4] border border-[#C9C5BC] shadow-sm rounded-xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-6 py-5 border-b border-[#C9C5BC] flex justify-between items-center bg-[#F8F7F4]">
        <h3 className="font-bold text-[#353638] text-lg">
          Fases Identificadas
        </h3>

        <button
          onClick={exportCSV}
          className="
            text-sm flex items-center gap-2
            bg-[#E8E6E1]
            border border-[#C9C5BC]
            hover:bg-[#C9C5BC]
            hover:text-[#353638]
            px-4 py-2
            rounded-lg
            transition-colors
            text-[#353638]
            font-medium
            shadow-xs
          "
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          {/* Cabeçalho das colunas */}
          <thead
            className="
              text-xs
              text-[#8C8478]
              uppercase
              bg-[#E8E6E1]
              border-b border-[#C9C5BC]
              tracking-wider
            "
          >
            <tr>
              <th className="px-6 py-4 font-semibold">Fase</th>

              <th className="px-6 py-4 font-semibold">Fórmula</th>

              <th className="px-6 py-4 font-semibold">Ref. Code</th>

              <th className="px-6 py-4 font-semibold">Score</th>

              <th className="px-6 py-4 font-semibold text-center">
                Picos Correlacionados
              </th>
            </tr>
          </thead>

          <tbody>
            {state.phases.map((phase, idx) => {
              const isMain = phase.code === state.mainPhaseCode;

              const correlatedPeaksCount = state.correlations.filter((c) =>
                c.phases.some((p) => p.code === phase.code),
              ).length;

              if (correlatedPeaksCount === 0) {
                return null;
              }

              return (
                <tr
                  key={idx}
                  className="
                    bg-[#F8F7F4]
                    border-b border-[#C9C5BC]
                    hover:bg-[#E8E6E1]
                    transition-colors
                  "
                >
                  {/* Fase */}
                  <td
                    className="
                      px-6 py-4
                      font-medium
                      text-[#353638]
                      flex items-center gap-2
                    "
                  >
                    {isMain && (
                      <span
                        className="
                          text-[#2563EB]
                          flex items-center justify-center
                          font-bold
                        "
                        title="Fase Principal"
                      >
                        ★
                      </span>
                    )}

                    <span className={isMain ? "font-bold" : ""}>
                      {phase.name}
                    </span>
                  </td>

                  {/* Fórmula */}
                  <td className="px-6 py-4">
                    <span
                      className="
                        inline-flex items-center
                        px-2.5 py-1
                        rounded-md
                        text-sm
                        font-semibold
                        text-[#353638]
                        bg-[#E8E6E1]
                        border border-[#C9C5BC]
                        tracking-wide
                      "
                    >
                      {phase.formula}
                    </span>
                  </td>

                  {/* Código */}
                  <td className="px-6 py-4">
                    <span
                      className="
                        font-mono
                        text-xs
                        text-[#8C8478]
                        bg-[#E8E6E1]
                        border border-[#C9C5BC]
                        px-2 py-1
                        rounded-md
                      "
                    >
                      {phase.code}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4 text-[#353638]">
                    {phase.score ? (
                      <span
                        className="
                          bg-[#E8E6E1]
                          border border-[#C9C5BC]
                          text-[#2563EB]
                          px-2 py-1
                          rounded-md
                          text-xs
                          font-semibold
                        "
                      >
                        {phase.score}
                      </span>
                    ) : (
                      <span className="text-[#8C8478]">-</span>
                    )}
                  </td>

                  {/* Picos correlacionados */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className="
                        inline-flex
                        items-center
                        justify-center
                        w-8 h-8
                        rounded-full
                        bg-[#E8E6E1]
                        border border-[#C9C5BC]
                        text-[#2563EB]
                        font-bold
                      "
                    >
                      {correlatedPeaksCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
