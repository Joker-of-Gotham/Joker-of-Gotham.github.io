import type { ObservatoryTheme } from "./types";

export function getResolvedObservatoryTheme(): ObservatoryTheme {
  const explicitTheme = document.documentElement.dataset.theme;
  if (explicitTheme === "light" || explicitTheme === "dark") return explicitTheme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
