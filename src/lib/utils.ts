import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isFastBuild(buildTime?: string): boolean {
  if (!buildTime) return false;
  const lower = buildTime.toLowerCase();
  return lower.includes('hour') || 
         lower.includes('min') || 
         lower.includes('weekend') ||
         (lower.includes('day') && !lower.includes('days'));
}
