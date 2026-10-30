import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Only allow same-site paths like "/orders"; rejects "https://evil.com", "//evil.com" and "/\evil.com".
export function safeRedirect(target: string | null | undefined, fallback: string) {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return fallback
  }
  return target
}
