"use client";

import React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}

export default function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  id,
}: SwitchProps) {
  return (
    <div
      className="
        flex
        w-full
        min-w-0
        items-center
        justify-between
        gap-3
      "
    >
      {/* ==================================================
          LABEL / DESCRIPTION
          ================================================== */}

      {(label || description) && (
        <div
          className="
            min-w-0
            flex-1
          "
        >
          {label && (
            <label
              htmlFor={id}
              className="
                block
                cursor-pointer
                truncate
                text-sm
                font-medium
                leading-5
                text-text-primary
              "
              title={label}
            >
              {label}
            </label>
          )}

          {description && (
            <p
              className="
                mt-0.5
                max-w-xl
                text-xs
                leading-4
                text-text-secondary
              "
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* ==================================================
          SWITCH
          ================================================== */}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Alternar opção"}
        aria-disabled={disabled ? "true" : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={`
          group
          relative
          inline-flex
          h-6
          w-11
          shrink-0
          items-center
          rounded-full
          border
          p-0.5
          outline-none
          transition-colors
          duration-150
          ease-out
          ${
            checked
              ? `
                  border-primary
                  bg-primary
                `
              : `
                  border-border-default
                  bg-surface-03
                `
          }
          ${
            disabled
              ? `
                  cursor-not-allowed
                  opacity-50
                `
              : `
                  cursor-pointer
                `
          }
          focus-visible:ring-2
          focus-visible:ring-primary
          focus-visible:ring-offset-2
          focus-visible:ring-offset-background
        `}
      >
        {/* ==================================================
            TRACK HOVER
            ================================================== */}

        <span
          aria-hidden="true"
          className={`
            pointer-events-none
            absolute
            inset-0
            rounded-full
            transition-opacity
            duration-150
            ${disabled ? "opacity-0" : "opacity-0 group-hover:opacity-100"}
            ${checked ? "bg-black/10" : "bg-black/5"}
          `}
        />

        {/* ==================================================
            THUMB
            ================================================== */}

        <span
          aria-hidden="true"
          className={`
            pointer-events-none
            relative
            z-10
            block
            h-4
            w-4
            rounded-full
            bg-white
            shadow-[0_1px_2px_rgba(0,0,0,0.20)]
            transition-transform
            duration-150
            ease-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}
