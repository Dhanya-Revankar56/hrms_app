/**
 * Utility functions for consistent date handling across the application.
 */

/**
 * Formats a date value (string, Date object, or null) into YYYY-MM-DD for <input type="date">.
 * Returns an empty string if the date is invalid or missing.
 */
export const formatDateForInput = (dateValue: any): string => {
  if (!dateValue) return "";
  
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    
    // YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return "";
  }
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatDateForDisplay = (dateValue: any, placeholder: string = "—"): string => {
  if (!dateValue || dateValue === "—") return placeholder;
  
  try {
    // Handle numeric timestamps or numeric strings as numbers
    let val = dateValue;
    if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
      val = parseInt(dateValue, 10);
    }

    const d = new Date(val);
    if (isNaN(d.getTime())) {
      // If it's a string like YYYY-MM-DD, try to split it manually as a fallback
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        const [y, m, d_part] = dateValue.split('T')[0].split('-');
        const monthNum = parseInt(m, 10);
        const dayPart = d_part.padStart(2, '0');
        return `${dayPart} ${MONTHS[monthNum - 1]} ${y}`;
      }
      return String(dateValue).split('T')[0] || placeholder;
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    return String(dateValue).split('T')[0] || placeholder;
  }
};
