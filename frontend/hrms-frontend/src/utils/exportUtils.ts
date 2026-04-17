/**
 * Utility functions for exporting data to CSV and PDF
 */

export const exportToCSV = (
  data: Record<string, unknown>[],
  fileName: string,
) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return false;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          const escaped = ("" + value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return true;
};

export const exportToPDF = async (
  data: Record<string, unknown>[],
  fileName: string,
  title: string,
) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return false;
  }

  try {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF({
      orientation:
        data && Object.keys(data[0]).length > 6 ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const headers = Object.keys(data[0]);
    const body = data.map((row) => headers.map((h) => row[h]));

    // @ts-expect-error jspdf-autotable extension
    doc.autoTable({
      head: [headers.map((h) => h.toUpperCase())],
      body: body,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, halign: "left" },
      headStyles: {
        fillColor: [37, 99, 235], // Blue 600
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 35 },
    });

    doc.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Internal error.");
    return false;
  }
};
