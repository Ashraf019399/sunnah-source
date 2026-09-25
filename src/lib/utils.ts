import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number): string {
  return "৳" + Math.round(amount).toLocaleString("en-IN");
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