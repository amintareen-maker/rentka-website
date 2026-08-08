"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-[#4d8f43]">RentKA Internal</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0F2B46]">Pricing Calculator</h1>
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#0F2B46] focus:ring-2 focus:ring-[#0F2B46]/15"
            />
          </div>
          {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#0F2B46] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Checking…" : "Access Calculator"}
          </button>
        </form>
      </section>
    </main>
  );
}
