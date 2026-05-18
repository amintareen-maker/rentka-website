"use client";

import { useState, useEffect } from "react";

const trackEvent = (eventName: string, data: any = {}) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, data);
  }
};

export default function WhatsAppWidget() {
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setChatOpen(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-24 right-6 z-50">

      {chatOpen && (
        <div className="bg-white w-72 rounded-2xl shadow-xl border border-slate-200 p-4 mb-3 animate-fade-in relative">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            👋 Need help choosing a car?
          </p>

          <p className="text-sm text-slate-600 mb-3">
            Chat with RentKA instantly on WhatsApp.
          </p>

          <a
            href="https://wa.me/923020589999?text=Hi%20RentKA,%20I%20need%20help%20finding%20a%20car."
            onClick={() => {
              trackEvent("whatsapp_click", {
                source: "global_widget",
              });
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-[var(--rentka-green)] hover:bg-[var(--rentka-green-hover)] text-white py-2 rounded-lg font-medium transition"
          >
            Chat on WhatsApp
          </a>

          <button
            onClick={() => setChatOpen(false)}
            className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="bg-[var(--rentka-green)] hover:bg-[var(--rentka-green-hover)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7"
        >
          <path d="M20.52 3.48A11.88 11.88 0 0012.03 0C5.4 0 .03 5.37.03 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0012.03 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.2-3.51-8.52zM12.03 21.82c-1.82 0-3.6-.49-5.16-1.41l-.37-.22-3.67.96.98-3.58-.24-.37a9.8 9.8 0 01-1.52-5.2c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.9 6.99c0 5.45-4.44 9.82-9.9 9.82zm5.43-7.36c-.3-.15-1.78-.88-2.05-.98-.27-.1-.46-.15-.65.15-.19.3-.75.98-.92 1.18-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.57-.89-2.15-.23-.56-.47-.49-.65-.5h-.55c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.06 2.9 1.2 3.1c.15.2 2.08 3.18 5.05 4.46.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.78-.73 2.03-1.44.25-.71.25-1.32.17-1.44-.07-.12-.27-.2-.57-.35z" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}