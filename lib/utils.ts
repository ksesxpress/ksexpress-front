import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHTG(amount: number): string {
  return new Intl.NumberFormat("fr-HT", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 2,
  }).format(amount);
}
