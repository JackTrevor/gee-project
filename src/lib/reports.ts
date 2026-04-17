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

export async function getReportsData() {
  const dashboardData = await getDashboardData();
  const { jobs, totals, clients, cleaners } = dashboardData;

  const monthDates = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return date;
  });

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

  const statusMix = jobs.reduce(
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

  for (const job of jobs) {
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
    totals,
    counts: {
      clients: clients.length,
      cleaners: cleaners.length,
      jobs: jobs.length,
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
