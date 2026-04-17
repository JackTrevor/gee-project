import { CleanerPayment } from "@/models/CleanerPayment";
import { Job } from "@/models/Job";

type CleanerReference = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
};

export type UnpaidJobView = {
  _id: string;
  apartmentName: string;
  apartmentAddress?: string;
  cleaningDate: string | Date;
  cleanerPayout: number;
  notes?: string;
};

export type CleanerPaymentCandidate = {
  cleaner: CleanerReference;
  jobs: UnpaidJobView[];
  totalDue: number;
};

export type CleanerPaymentView = {
  _id: string;
  checkNumber: string;
  paymentDate: string | Date;
  totalAmount: number;
  memo?: string;
  notes?: string;
  status: string;
  createdAt: string | Date;
  cleaner: CleanerReference | null;
  jobs: UnpaidJobView[];
};

export async function getPaymentsPageData() {
  const [unpaidJobsRaw, paymentsRaw] = await Promise.all([
    Job.find({
      cleanerPaymentStatus: "pending",
      jobStatus: { $ne: "cancelled" },
    })
      .sort({ cleaningDate: 1, createdAt: 1 })
      .populate("cleanerId", "name phone email")
      .lean(),
    CleanerPayment.find()
      .sort({ paymentDate: -1, createdAt: -1 })
      .populate("cleanerId", "name phone email")
      .populate("jobIds", "apartmentName apartmentAddress cleaningDate cleanerPayout notes")
      .lean(),
  ]);

  const unpaidJobs = unpaidJobsRaw as unknown as Array<{
    _id: { toString(): string };
    apartmentName: string;
    apartmentAddress?: string;
    cleaningDate: string | Date;
    cleanerPayout: number;
    notes?: string;
    cleanerId?: {
      _id: { toString(): string };
      name: string;
      phone?: string;
      email?: string;
    } | null;
  }>;

  const groupedUnpaidJobs = unpaidJobs.reduce<Map<string, CleanerPaymentCandidate>>((map, job) => {
    if (!job.cleanerId) {
      return map;
    }

    const cleanerKey = job.cleanerId._id.toString();
    const current = map.get(cleanerKey) ?? {
      cleaner: {
        _id: cleanerKey,
        name: job.cleanerId.name,
        phone: job.cleanerId.phone,
        email: job.cleanerId.email,
      },
      jobs: [],
      totalDue: 0,
    };

    current.jobs.push({
      _id: job._id.toString(),
      apartmentName: job.apartmentName,
      apartmentAddress: job.apartmentAddress,
      cleaningDate: job.cleaningDate,
      cleanerPayout: job.cleanerPayout,
      notes: job.notes,
    });
    current.totalDue += job.cleanerPayout;
    map.set(cleanerKey, current);

    return map;
  }, new Map());

  const paymentCandidates = Array.from(groupedUnpaidJobs.values()).sort((left, right) =>
    left.cleaner.name.localeCompare(right.cleaner.name),
  );

  const payments = (paymentsRaw as unknown as Array<{
    _id: { toString(): string };
    checkNumber: string;
    paymentDate: string | Date;
    totalAmount: number;
    memo?: string;
    notes?: string;
    status: string;
    createdAt: string | Date;
    cleanerId?: {
      _id: { toString(): string };
      name: string;
      phone?: string;
      email?: string;
    } | null;
    jobIds?: Array<{
      _id: { toString(): string };
      apartmentName: string;
      apartmentAddress?: string;
      cleaningDate: string | Date;
      cleanerPayout: number;
      notes?: string;
    }>;
  }>).map((payment) => ({
    _id: payment._id.toString(),
    checkNumber: payment.checkNumber,
    paymentDate: payment.paymentDate,
    totalAmount: payment.totalAmount,
    memo: payment.memo,
    notes: payment.notes,
    status: payment.status,
    createdAt: payment.createdAt,
    cleaner: payment.cleanerId
      ? {
          _id: payment.cleanerId._id.toString(),
          name: payment.cleanerId.name,
          phone: payment.cleanerId.phone,
          email: payment.cleanerId.email,
        }
      : null,
    jobs: (payment.jobIds ?? []).map((job) => ({
      _id: job._id.toString(),
      apartmentName: job.apartmentName,
      apartmentAddress: job.apartmentAddress,
      cleaningDate: job.cleaningDate,
      cleanerPayout: job.cleanerPayout,
      notes: job.notes,
    })),
  }));

  return {
    paymentCandidates,
    payments,
  };
}

export async function getCleanerPaymentById(paymentId: string) {
  const payment = await CleanerPayment.findById(paymentId)
    .populate("cleanerId", "name phone email")
    .populate("jobIds", "apartmentName apartmentAddress cleaningDate cleanerPayout notes")
    .lean();

  if (!payment) {
    return null;
  }

  const typedPayment = payment as unknown as {
    _id: { toString(): string };
    checkNumber: string;
    paymentDate: string | Date;
    totalAmount: number;
    memo?: string;
    notes?: string;
    status: string;
    createdAt: string | Date;
    cleanerId?: {
      _id: { toString(): string };
      name: string;
      phone?: string;
      email?: string;
    } | null;
    jobIds?: Array<{
      _id: { toString(): string };
      apartmentName: string;
      apartmentAddress?: string;
      cleaningDate: string | Date;
      cleanerPayout: number;
      notes?: string;
    }>;
  };

  return {
    _id: typedPayment._id.toString(),
    checkNumber: typedPayment.checkNumber,
    paymentDate: typedPayment.paymentDate,
    totalAmount: typedPayment.totalAmount,
    memo: typedPayment.memo,
    notes: typedPayment.notes,
    status: typedPayment.status,
    createdAt: typedPayment.createdAt,
    cleaner: typedPayment.cleanerId
      ? {
          _id: typedPayment.cleanerId._id.toString(),
          name: typedPayment.cleanerId.name,
          phone: typedPayment.cleanerId.phone,
          email: typedPayment.cleanerId.email,
        }
      : null,
    jobs: (typedPayment.jobIds ?? []).map((job) => ({
      _id: job._id.toString(),
      apartmentName: job.apartmentName,
      apartmentAddress: job.apartmentAddress,
      cleaningDate: job.cleaningDate,
      cleanerPayout: job.cleanerPayout,
      notes: job.notes,
    })),
  };
}
