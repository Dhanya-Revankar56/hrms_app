/**
 * Utility functions for consistent date handling across the application.
 */

/**
 * Formats a date value (string, Date object, or null) into YYYY-MM-DD for <input type="date">.
 * Returns an empty string if the date is invalid or missing.
 */
export const formatDateForInput = (
  dateValue: string | Date | number | null | undefined,
): string => {
  if (!dateValue) return "";

  try {
    let val = dateValue;
    if (typeof dateValue === "string" && /^\d+$/.test(dateValue)) {
      val = parseInt(dateValue, 10);
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";

    // YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatDateForDisplay = (
  dateValue: string | Date | number | null | undefined,
  placeholder: string = "—",
): string => {
  if (!dateValue || dateValue === "—") return placeholder;

  try {
    // Handle numeric timestamps or numeric strings as numbers
    let val = dateValue;
    if (typeof dateValue === "string" && /^\d+$/.test(dateValue)) {
      val = parseInt(dateValue, 10);
    }

    const d = new Date(val);
    if (isNaN(d.getTime())) {
      // If it's a string like YYYY-MM-DD, try to split it manually as a fallback
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(dateValue)
      ) {
        const [y, m, d_part] = dateValue.split("T")[0].split("-");
        const monthNum = parseInt(m, 10);
        const dayPart = d_part.padStart(2, "0");
        return `${dayPart} ${MONTHS[monthNum - 1]} ${y}`;
      }
      return String(dateValue).split("T")[0] || placeholder;
    }

    const day = String(d.getDate()).padStart(2, "0");
    const month = MONTHS[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return String(dateValue).split("T")[0] || placeholder;
  }
};

export const formatDateForBackend = (
  dateValue: string | Date | number | null | undefined,
): string | null => {
  if (!dateValue || dateValue === "—") return null;

  try {
    let val = dateValue;
    if (typeof dateValue === "string" && /^\d+$/.test(dateValue)) {
      val = parseInt(dateValue, 10);
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
};
