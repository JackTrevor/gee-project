import { getDashboardData } from "@/lib/dashboard";

type MonthlyMetric = {
  label: string;
  revenue: number;
  payouts: number;
  profit: number;
  jobs: number;
};

type RankedItem = {
  id: string;
  name: string;
  value: number;
  jobs: number;
};

type BalanceItem = {
  id: string;
  name: string;
  amount: number;
  jobs: number;
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function startOfMonth(date: Date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildMonthDates(from: Date, to: Date) {
  const monthDates: Date[] = [];
  const cursor = startOfMonth(from);
  const end = startOfMonth(to);

  while (cursor <= end) {
    monthDates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return monthDates;
}

export type ReportsDateRange = {
  from?: Date;
  to?: Date;
};

export async function getReportsData(range?: ReportsDateRange) {
  const dashboardData = await getDashboardData();
  const { jobs, clients, cleaners } = dashboardData;

  const to = range?.to ? new Date(range.to) : new Date();
  to.setHours(23, 59, 59, 999);

  const from = range?.from ? new Date(range.from) : new Date(to);
  if (!range?.from) {
    from.setMonth(from.getMonth() - 5);
    from.setDate(1);
  }
  from.setHours(0, 0, 0, 0);

  const filteredJobs = jobs.filter((job) => {
    const cleaningDate = new Date(job.cleaningDate);
    return cleaningDate >= from && cleaningDate <= to;
  });

  const monthDates = buildMonthDates(from, to);

  const monthlyMap = monthDates.reduce<Map<string, MonthlyMetric>>((map, date) => {
    map.set(getMonthKey(date), {
      label: getMonthLabel(date),
      revenue: 0,
      payouts: 0,
      profit: 0,
      jobs: 0,
    });

    return map;
  }, new Map());

  const topClientMap = new Map<string, RankedItem>();
  const topCleanerMap = new Map<string, RankedItem>();
  const receivablesMap = new Map<string, BalanceItem>();
  const payablesMap = new Map<string, BalanceItem>();

  const statusMix = filteredJobs.reduce(
    (mix, job) => {
      mix.jobStatuses[job.jobStatus] = (mix.jobStatuses[job.jobStatus] ?? 0) + 1;
      mix.clientPaymentStatuses[job.clientPaymentStatus] =
        (mix.clientPaymentStatuses[job.clientPaymentStatus] ?? 0) + 1;
      mix.cleanerPaymentStatuses[job.cleanerPaymentStatus] =
        (mix.cleanerPaymentStatuses[job.cleanerPaymentStatus] ?? 0) + 1;
      return mix;
    },
    {
      jobStatuses: {} as Record<string, number>,
      clientPaymentStatuses: {} as Record<string, number>,
      cleanerPaymentStatuses: {} as Record<string, number>,
    },
  );

  const filteredTotals = filteredJobs.reduce(
    (accumulator, job) => {
      accumulator.revenue += job.amountCharged;
      accumulator.payouts += job.cleanerPayout;
      accumulator.profit += job.amountCharged - job.cleanerPayout;

      if (job.clientPaymentStatus !== "paid") {
        accumulator.outstandingClientBalance += job.amountCharged;
      }

      if (job.cleanerPaymentStatus !== "paid") {
        accumulator.outstandingCleanerBalance += job.cleanerPayout;
      }

      return accumulator;
    },
    {
      revenue: 0,
      payouts: 0,
      profit: 0,
      outstandingClientBalance: 0,
      outstandingCleanerBalance: 0,
    },
  );

  for (const job of filteredJobs) {
    const cleaningDate = new Date(job.cleaningDate);
    const monthBucket = monthlyMap.get(getMonthKey(cleaningDate));
    if (monthBucket) {
      monthBucket.revenue += job.amountCharged;
      monthBucket.payouts += job.cleanerPayout;
      monthBucket.profit += job.amountCharged - job.cleanerPayout;
      monthBucket.jobs += 1;
    }

    const clientId = job.clientId?._id ?? "unknown-client";
    const clientName = job.clientId?.companyName || job.clientId?.name || "Unknown client";
    const currentClient = topClientMap.get(clientId) ?? {
      id: clientId,
      name: clientName,
      value: 0,
      jobs: 0,
    };
    currentClient.value += job.amountCharged;
    currentClient.jobs += 1;
    topClientMap.set(clientId, currentClient);

    const cleanerId = job.cleanerId?._id ?? "unknown-cleaner";
    const cleanerName = job.cleanerId?.name || "Unknown cleaner";
    const currentCleaner = topCleanerMap.get(cleanerId) ?? {
      id: cleanerId,
      name: cleanerName,
      value: 0,
      jobs: 0,
    };
    currentCleaner.value += job.cleanerPayout;
    currentCleaner.jobs += 1;
    topCleanerMap.set(cleanerId, currentCleaner);

    if (job.clientPaymentStatus !== "paid") {
      const currentReceivable = receivablesMap.get(clientId) ?? {
        id: clientId,
        name: clientName,
        amount: 0,
        jobs: 0,
      };
      currentReceivable.amount += job.amountCharged;
      currentReceivable.jobs += 1;
      receivablesMap.set(clientId, currentReceivable);
    }

    if (job.cleanerPaymentStatus !== "paid") {
      const currentPayable = payablesMap.get(cleanerId) ?? {
        id: cleanerId,
        name: cleanerName,
        amount: 0,
        jobs: 0,
      };
      currentPayable.amount += job.cleanerPayout;
      currentPayable.jobs += 1;
      payablesMap.set(cleanerId, currentPayable);
    }
  }

  const monthly = Array.from(monthlyMap.values());
  const maxMonthlyRevenue = Math.max(...monthly.map((month) => month.revenue), 1);

  return {
    totals: filteredTotals,
    dateRange: {
      from,
      to,
    },
    counts: {
      clients: clients.length,
      cleaners: cleaners.length,
      jobs: filteredJobs.length,
      allJobs: jobs.length,
    },
    monthly,
    maxMonthlyRevenue,
    topClients: Array.from(topClientMap.values())
      .sort((left, right) => right.value - left.value)
      .slice(0, 5),
    topCleaners: Array.from(topCleanerMap.values())
      .sort((left, right) => right.value - left.value)
      .slice(0, 5),
    receivables: Array.from(receivablesMap.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5),
    payables: Array.from(payablesMap.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5),
    statusMix,
  };
}
