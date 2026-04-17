import { Invoice } from "@/models/Invoice";
import { Job } from "@/models/Job";

type ClientReference = {
  _id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
};

export type InvoiceJobView = {
  _id: string;
  apartmentName: string;
  apartmentAddress?: string;
  cleaningDate: string | Date;
  amountCharged: number;
  notes?: string;
};

export type ClientInvoiceCandidate = {
  client: ClientReference;
  jobs: InvoiceJobView[];
  totalDue: number;
};

export type InvoiceView = {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  issueDate: string | Date;
  dueDate: string | Date;
  status: string;
  notes?: string;
  createdAt: string | Date;
  client: ClientReference | null;
  jobs: InvoiceJobView[];
};

export async function getInvoicesPageData() {
  const [invoiceCandidatesRaw, invoicesRaw] = await Promise.all([
    Job.find({
      clientPaymentStatus: "pending",
      jobStatus: { $ne: "cancelled" },
    })
      .sort({ cleaningDate: 1, createdAt: 1 })
      .populate("clientId", "name companyName email phone")
      .lean(),
    Invoice.find()
      .sort({ issueDate: -1, createdAt: -1 })
      .populate("clientId", "name companyName email phone")
      .populate("jobIds", "apartmentName apartmentAddress cleaningDate amountCharged notes")
      .lean(),
  ]);

  const invoiceCandidates = invoiceCandidatesRaw as unknown as Array<{
    _id: { toString(): string };
    apartmentName: string;
    apartmentAddress?: string;
    cleaningDate: string | Date;
    amountCharged: number;
    notes?: string;
    clientId?: {
      _id: { toString(): string };
      name: string;
      companyName?: string;
      email?: string;
      phone?: string;
    } | null;
  }>;

  const groupedCandidates = invoiceCandidates.reduce<Map<string, ClientInvoiceCandidate>>(
    (map, job) => {
      if (!job.clientId) {
        return map;
      }

      const clientKey = job.clientId._id.toString();
      const current = map.get(clientKey) ?? {
        client: {
          _id: clientKey,
          name: job.clientId.name,
          companyName: job.clientId.companyName,
          email: job.clientId.email,
          phone: job.clientId.phone,
        },
        jobs: [],
        totalDue: 0,
      };

      current.jobs.push({
        _id: job._id.toString(),
        apartmentName: job.apartmentName,
        apartmentAddress: job.apartmentAddress,
        cleaningDate: job.cleaningDate,
        amountCharged: job.amountCharged,
        notes: job.notes,
      });
      current.totalDue += job.amountCharged;
      map.set(clientKey, current);

      return map;
    },
    new Map(),
  );

  const candidates = Array.from(groupedCandidates.values()).sort((left, right) =>
    (left.client.companyName || left.client.name).localeCompare(
      right.client.companyName || right.client.name,
    ),
  );

  const invoices = (invoicesRaw as unknown as Array<{
    _id: { toString(): string };
    invoiceNumber: string;
    totalAmount: number;
    issueDate: string | Date;
    dueDate: string | Date;
    status: string;
    notes?: string;
    createdAt: string | Date;
    clientId?: {
      _id: { toString(): string };
      name: string;
      companyName?: string;
      email?: string;
      phone?: string;
    } | null;
    jobIds?: Array<{
      _id: { toString(): string };
      apartmentName: string;
      apartmentAddress?: string;
      cleaningDate: string | Date;
      amountCharged: number;
      notes?: string;
    }>;
  }>).map((invoice) => ({
    _id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    client: invoice.clientId
      ? {
          _id: invoice.clientId._id.toString(),
          name: invoice.clientId.name,
          companyName: invoice.clientId.companyName,
          email: invoice.clientId.email,
          phone: invoice.clientId.phone,
        }
      : null,
    jobs: (invoice.jobIds ?? []).map((job) => ({
      _id: job._id.toString(),
      apartmentName: job.apartmentName,
      apartmentAddress: job.apartmentAddress,
      cleaningDate: job.cleaningDate,
      amountCharged: job.amountCharged,
      notes: job.notes,
    })),
  }));

  return {
    candidates,
    invoices,
  };
}

export async function getInvoiceById(invoiceId: string) {
  const invoice = await Invoice.findById(invoiceId)
    .populate("clientId", "name companyName email phone")
    .populate("jobIds", "apartmentName apartmentAddress cleaningDate amountCharged notes")
    .lean();

  if (!invoice) {
    return null;
  }

  const typedInvoice = invoice as unknown as {
    _id: { toString(): string };
    invoiceNumber: string;
    totalAmount: number;
    issueDate: string | Date;
    dueDate: string | Date;
    status: string;
    notes?: string;
    createdAt: string | Date;
    clientId?: {
      _id: { toString(): string };
      name: string;
      companyName?: string;
      email?: string;
      phone?: string;
    } | null;
    jobIds?: Array<{
      _id: { toString(): string };
      apartmentName: string;
      apartmentAddress?: string;
      cleaningDate: string | Date;
      amountCharged: number;
      notes?: string;
    }>;
  };

  return {
    _id: typedInvoice._id.toString(),
    invoiceNumber: typedInvoice.invoiceNumber,
    totalAmount: typedInvoice.totalAmount,
    issueDate: typedInvoice.issueDate,
    dueDate: typedInvoice.dueDate,
    status: typedInvoice.status,
    notes: typedInvoice.notes,
    createdAt: typedInvoice.createdAt,
    client: typedInvoice.clientId
      ? {
          _id: typedInvoice.clientId._id.toString(),
          name: typedInvoice.clientId.name,
          companyName: typedInvoice.clientId.companyName,
          email: typedInvoice.clientId.email,
          phone: typedInvoice.clientId.phone,
        }
      : null,
    jobs: (typedInvoice.jobIds ?? []).map((job) => ({
      _id: job._id.toString(),
      apartmentName: job.apartmentName,
      apartmentAddress: job.apartmentAddress,
      cleaningDate: job.cleaningDate,
      amountCharged: job.amountCharged,
      notes: job.notes,
    })),
  };
}
