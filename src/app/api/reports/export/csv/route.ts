import { connectToDatabase } from "@/lib/mongodb";
import { getReportsExportData, type ReportsDateRange } from "@/lib/reports";

function parseDateInput(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getRangeFromRequest(request: Request): ReportsDateRange {
  const url = new URL(request.url);
  return {
    from: parseDateInput(url.searchParams.get("from")),
    to: parseDateInput(url.searchParams.get("to")),
  };
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function sectionToCsv(
  title: string,
  rows: Array<Record<string, string | number>>,
) {
  if (rows.length === 0) {
    return `${title}\nNo data\n`;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    title,
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

export async function GET(request: Request) {
  await connectToDatabase();
  const exportData = await getReportsExportData(getRangeFromRequest(request));

  const csv = [
    sectionToCsv("Summary", exportData.summaryRows),
    sectionToCsv("Monthly Trend", exportData.monthlyRows),
    sectionToCsv("Top Clients", exportData.topClientRows),
    sectionToCsv("Top Cleaners", exportData.topCleanerRows),
    sectionToCsv("Open Receivables", exportData.receivableRows),
    sectionToCsv("Open Payables", exportData.payableRows),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gee-project-reports.csv"',
    },
  });
}
