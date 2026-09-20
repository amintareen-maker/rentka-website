"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  AdminDispatchStage,
  AdminDispatchStageId,
} from "@/lib/dispatch/admin-workflow-core";

const stateStyle = {
  complete: "border-green-200 bg-green-50",
  current: "border-[#0F2B46] bg-white shadow-md",
  future: "border-slate-200 bg-slate-50 opacity-70",
  skipped: "border-slate-200 bg-slate-50",
} as const;

export default function BookingWorkflow({
  bookingId,
  currentStage,
  stages,
  content,
}: {
  bookingId: string;
  currentStage: AdminDispatchStageId;
  stages: AdminDispatchStage[];
  content: Partial<Record<AdminDispatchStageId, ReactNode>>;
}) {
  const [expanded, setExpanded] = useState<AdminDispatchStageId | null>(
    currentStage,
  );
  const bookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      bookingRef.current?.scrollIntoView({ block: "nearest" }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [currentStage]);

  return (
    <div ref={bookingRef} className="mt-5 space-y-3" data-booking={bookingId}>
      {stages.map((stage) => {
        const isFuture = stage.state === "future";
        const isOpen = !isFuture && expanded === stage.id;
        return (
          <section
            key={stage.id}
            className={`rounded-xl border-2 ${stateStyle[stage.state]}`}
            data-stage={stage.id}
            data-stage-state={stage.state}
          >
            <button
              type="button"
              disabled={isFuture}
              aria-expanded={isOpen}
              onClick={() => setExpanded(isOpen ? null : stage.id)}
              className="flex w-full items-start justify-between gap-4 p-4 text-left disabled:cursor-not-allowed"
            >
              <span>
                <span className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Step {stage.number}
                </span>
                <span className="font-black text-[#0F2B46]">
                  {stage.state === "complete"
                    ? "✓ "
                    : stage.state === "current"
                      ? "→ "
                      : stage.state === "skipped"
                        ? "↷ "
                        : "○ "}
                  {stage.label}
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {stage.summary}
                </span>
              </span>
              {!isFuture && (
                <span className="text-sm font-bold text-slate-500">
                  {isOpen ? "Collapse" : stage.state === "current" ? "Open" : "Review"}
                </span>
              )}
            </button>
            {isOpen && content[stage.id] && (
              <div className="border-t p-4">{content[stage.id]}</div>
            )}
          </section>
        );
      })}
    </div>
  );
}
