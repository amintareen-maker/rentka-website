"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

export type InlineActionResult = { ok: boolean; message: string };
const initialState: InlineActionResult | null = null;

export default function InlineActionForm({
  action,
  className,
  children,
  label,
  pendingLabel,
  buttonClassName,
  confirmMessage,
}: {
  action: (form: FormData) => Promise<InlineActionResult>;
  className?: string;
  children: ReactNode;
  label: string;
  pendingLabel: string;
  buttonClassName: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [result, formAction, pending] = useActionState(
    async (_previous: InlineActionResult | null, form: FormData) => {
      if (confirmMessage && !window.confirm(confirmMessage))
        return _previous;
      const response = await action(form);
      if (response.ok) router.refresh();
      return response;
    },
    initialState,
  );

  return (
    <form action={formAction} className={className}>
      {children}
      <button
        disabled={pending}
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {pending ? pendingLabel : label}
      </button>
      {result && (
        <p
          role="status"
          className={`mt-3 rounded p-2 text-sm font-bold ${
            result.ok
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
