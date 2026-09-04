import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatBDT(amount: number): string { return "৳" + Math.round(amount).toLocaleString("en-IN"); }
export function isValidBDPhone(phone: string): boolean { return /^(?:8801|01)[3-9]\d{8}$/.test(phone.replace(/\D/g, "")); }
export function normalizeBDPhone(phone: string): string { const c = phone.replace(/\D/g, ""); return c.startsWith("8801") ? c.slice(2) : c; }