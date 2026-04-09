/**
 * Utility functions for exporting data to CSV and PDF
 */

export const exportToCSV = (
  data: Record<string, unknown>[],
  fileName: string,
) => {
  if (!data || data.length === 0) return;

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
};

export const exportToPDF = async (
  data: Record<string, unknown>[],
  fileName: string,
  title: string,
) => {
  try {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const headers = Object.keys(data[0]);
    const body = data.map((row) => headers.map((h) => row[h]));

    // @ts-expect-error jspdf-autotable extension
    doc.autoTable({
      head: [headers.map((h) => h.replace(/_/g, " ").toUpperCase())],
      body: body,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert(
      "Failed to generate PDF. Please ensure jspdf and jspdf-autotable are installed.",
    );
  }
};
