import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number): string {
  return "৳" + Math.round(amount).toLocaleString("en-IN");
}

export function formatBanglaBDT(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "৳০";
  const numStr = Math.round(amount).toLocaleString("en-IN");
  return "৳" + toBanglaDigits(numStr);
}

export function formatVariantWeightLabel(variant: {
  weightValue?: number;
  weightUnit?: string;
  displayName: string;
}): string {
  if (variant.weightValue && variant.weightUnit) {
    const unit = variant.weightUnit.toLowerCase();
    const val = variant.weightValue;
    if (unit === "g" || unit === "gram" || unit === "gm") {
      if (val >= 1000 && val % 1000 === 0) {
        return `${toBanglaDigits(val / 1000)} কেজি`;
      }
      return `${toBanglaDigits(val)} গ্রাম`;
    }
    if (unit === "kg") {
      return `${toBanglaDigits(val)} কেজি`;
    }
    if (unit === "ml") {
      if (val >= 1000 && val % 1000 === 0) {
        return `${toBanglaDigits(val / 1000)} লিটার`;
      }
      return `${toBanglaDigits(val)} মি.লি.`;
    }
    if (unit === "l" || unit === "liter" || unit === "litre") {
      return `${toBanglaDigits(val)} লিটার`;
    }
  }
  return variant.displayName;
}

export function isValidBDPhone(phone: string): boolean {
  return /^(?:8801|01)[3-9]\d{8}$/.test(phone.replace(/\D/g, ""));
}

export function normalizeBDPhone(phone: string): string {
  const c = phone.replace(/\D/g, "");
  return c.startsWith("8801") ? c.slice(2) : c;
}

export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

export function formatBanglaDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";

    const monthsBn = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const parts = formatter.formatToParts(d);
    let day = "";
    let monthIndex = 0;
    let year = "";
    let hour = "";
    let minute = "";
    let dayPeriod = "AM";

    for (const part of parts) {
      if (part.type === "day") day = part.value;
      if (part.type === "month") monthIndex = parseInt(part.value, 10) - 1;
      if (part.type === "year") year = part.value;
      if (part.type === "hour") hour = part.value;
      if (part.type === "minute") minute = part.value;
      if (part.type === "dayPeriod") dayPeriod = part.value.toUpperCase();
    }

    const banglaDay = toBanglaDigits(day);
    const banglaMonth = monthsBn[monthIndex] || "";
    const banglaYear = toBanglaDigits(year);
    const banglaHour = toBanglaDigits(hour);
    const banglaMinute = toBanglaDigits(minute);

    return `${banglaDay} ${banglaMonth} ${banglaYear}, ${banglaHour}:${banglaMinute} ${dayPeriod}`;
  } catch {
    return String(dateInput);
  }
}