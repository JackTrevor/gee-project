import * as XLSX from "xlsx";

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

function appendSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: Array<Record<string, string | number>>,
) {
  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ message: "No data" }]);
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

export async function GET(request: Request) {
  await connectToDatabase();
  const exportData = await getReportsExportData(getRangeFromRequest(request));

  const workbook = XLSX.utils.book_new();
  appendSheet(workbook, "Summary", exportData.summaryRows);
  appendSheet(workbook, "Monthly Trend", exportData.monthlyRows);
  appendSheet(workbook, "Top Clients", exportData.topClientRows);
  appendSheet(workbook, "Top Cleaners", exportData.topCleanerRows);
  appendSheet(workbook, "Receivables", exportData.receivableRows);
  appendSheet(workbook, "Payables", exportData.payableRows);

  const arrayBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gee-project-reports.xlsx"',
    },
  });
}
