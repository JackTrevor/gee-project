import { Cleaner } from "@/models/Cleaner";
import { Client } from "@/models/Client";
import { Job } from "@/models/Job";

export type ClientOption = {
  _id: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  quickbooksCustomerId?: string;
  notes?: string;
  updatedAt?: string | Date;
};

export type CleanerOption = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  active: boolean;
  quickbooksVendorId?: string;
  notes?: string;
  updatedAt?: string | Date;
};

export type JobView = {
  _id: string;
  apartmentName: string;
  apartmentAddress?: string;
  cleaningDate: string | Date;
  amountCharged: number;
  cleanerPayout: number;
  jobStatus: string;
  clientPaymentStatus: string;
  cleanerPaymentStatus: string;
  notes?: string;
  clientId: ClientOption | null;
  cleanerId: CleanerOption | null;
  updatedAt: string | Date;
};

export async function getDashboardData() {
  const [clientsRaw, cleanersRaw, jobsRaw] = await Promise.all([
    Client.find().sort({ name: 1 }).lean(),
    Cleaner.find().sort({ active: -1, name: 1 }).lean(),
    Job.find()
      .sort({ cleaningDate: -1, createdAt: -1 })
      .populate("clientId", "name companyName quickbooksCustomerId")
      .populate("cleanerId", "name active quickbooksVendorId")
      .lean(),
  ]);

  const clients = clientsRaw as Array<{
    _id: { toString(): string };
    name: string;
    companyName?: string;
    phone?: string;
    email?: string;
    quickbooksCustomerId?: string;
    notes?: string;
    updatedAt: string | Date;
  }>;

  const cleaners = cleanersRaw as Array<{
    _id: { toString(): string };
    name: string;
    phone?: string;
    email?: string;
    active: boolean;
    quickbooksVendorId?: string;
    notes?: string;
    updatedAt: string | Date;
  }>;

  const jobs = jobsRaw as unknown as Array<{
    _id: { toString(): string };
    apartmentName: string;
    apartmentAddress?: string;
    cleaningDate: string | Date;
    amountCharged: number;
    cleanerPayout: number;
    jobStatus: string;
    clientPaymentStatus: string;
    cleanerPaymentStatus: string;
    notes?: string;
    updatedAt: string | Date;
    clientId?: {
      _id: { toString(): string };
      name: string;
      companyName?: string;
      quickbooksCustomerId?: string;
    } | null;
    cleanerId?: {
      _id: { toString(): string };
      name: string;
      active: boolean;
      quickbooksVendorId?: string;
    } | null;
  }>;

  const normalizedClients: ClientOption[] = clients.map((client) => ({
    _id: client._id.toString(),
    name: client.name,
    companyName: client.companyName,
    phone: client.phone,
    email: client.email,
    quickbooksCustomerId: client.quickbooksCustomerId,
    notes: client.notes,
    updatedAt: client.updatedAt,
  }));

  const normalizedCleaners: CleanerOption[] = cleaners.map((cleaner) => ({
    _id: cleaner._id.toString(),
    name: cleaner.name,
    phone: cleaner.phone,
    email: cleaner.email,
    active: cleaner.active,
    quickbooksVendorId: cleaner.quickbooksVendorId,
    notes: cleaner.notes,
    updatedAt: cleaner.updatedAt,
  }));

  const normalizedJobs: JobView[] = jobs.map((job) => ({
    _id: job._id.toString(),
    apartmentName: job.apartmentName,
    apartmentAddress: job.apartmentAddress,
    cleaningDate: job.cleaningDate,
    amountCharged: job.amountCharged,
    cleanerPayout: job.cleanerPayout,
    jobStatus: job.jobStatus,
    clientPaymentStatus: job.clientPaymentStatus,
    cleanerPaymentStatus: job.cleanerPaymentStatus,
    notes: job.notes,
    updatedAt: job.updatedAt,
    clientId: job.clientId
      ? {
          _id: job.clientId._id.toString(),
          name: job.clientId.name,
          companyName: job.clientId.companyName,
          quickbooksCustomerId: job.clientId.quickbooksCustomerId,
        }
      : null,
    cleanerId: job.cleanerId
      ? {
          _id: job.cleanerId._id.toString(),
          name: job.cleanerId.name,
          active: job.cleanerId.active,
          quickbooksVendorId: job.cleanerId.quickbooksVendorId,
        }
      : null,
  }));

  const totals = normalizedJobs.reduce(
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

  return {
    clients: normalizedClients,
    cleaners: normalizedCleaners,
    jobs: normalizedJobs,
    totals,
  };
}
