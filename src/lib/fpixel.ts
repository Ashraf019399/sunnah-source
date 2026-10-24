export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "2675229749603202";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/**
 * Trigger Meta Pixel PageView event
 */
export const pageview = (): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

/**
 * Trigger custom or standard Meta Pixel event
 */
export const event = (
  name: string,
  options: Record<string, unknown> = {}
): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", name, options);
  }
};
