export function formatNumber(num: number | string, lng: string = "en"): string {
  if (num === null || num === undefined) return "";
  const numericValue = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(numericValue)) return String(num);

  // Determine the locale code to pass to Intl (Arabic numerals require 'ar-EG')
  const locale = lng.startsWith("ar") ? "ar-EG" : "en-US";

  return new Intl.NumberFormat(locale).format(numericValue);
}

export function formatDate(
  dateString: string | Date | null | undefined,
  lng: string = "en",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);

  const locale = lng.startsWith("ar") ? "ar-EG" : "en-US";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
}
