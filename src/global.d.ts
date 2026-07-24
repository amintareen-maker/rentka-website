export {};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq?: (
      command: string,
      eventName: string,
      data?: Record<string, unknown>,
    ) => void;
  }
}
