"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CleanerPayment } from "@/models/CleanerPayment";
import { Cleaner } from "@/models/Cleaner";
import { Client } from "@/models/Client";
import { Job } from "@/models/Job";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text || undefined;
}

function cleanNumber(value: FormDataEntryValue | null) {
  const parsed = Number(cleanText(value));

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error("Please enter a valid positive amount.");
  }

  return parsed;
}

async function assertAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (!isAuthenticated) {
    throw new Error("Unauthorized request.");
  }
}

function revalidateAppPaths() {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/payments");
}

export async function createClient(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const name = cleanText(formData.get("name"));
  if (!name) {
    throw new Error("Client name is required.");
  }

  await Client.create({
    name,
    companyName: cleanOptionalText(formData.get("companyName")),
    phone: cleanOptionalText(formData.get("phone")),
    email: cleanOptionalText(formData.get("email")),
    notes: cleanOptionalText(formData.get("notes")),
  });

  revalidateAppPaths();
}

export async function createCleaner(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const name = cleanText(formData.get("name"));
  if (!name) {
    throw new Error("Cleaner name is required.");
  }

  await Cleaner.create({
    name,
    phone: cleanOptionalText(formData.get("phone")),
    email: cleanOptionalText(formData.get("email")),
    notes: cleanOptionalText(formData.get("notes")),
    active: formData.get("active") === "on",
  });

  revalidateAppPaths();
}

export async function createJob(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const apartmentName = cleanText(formData.get("apartmentName"));
  const clientId = cleanText(formData.get("clientId"));
  const cleanerId = cleanText(formData.get("cleanerId"));
  const cleaningDate = cleanText(formData.get("cleaningDate"));

  if (!apartmentName || !clientId || !cleanerId || !cleaningDate) {
    throw new Error("Apartment, client, cleaner, and cleaning date are required.");
  }

  await Job.create({
    apartmentName,
    apartmentAddress: cleanOptionalText(formData.get("apartmentAddress")),
    clientId,
    cleanerId,
    cleaningDate: new Date(cleaningDate),
    amountCharged: cleanNumber(formData.get("amountCharged")),
    cleanerPayout: cleanNumber(formData.get("cleanerPayout")),
    jobStatus: cleanText(formData.get("jobStatus")) || "scheduled",
    clientPaymentStatus: cleanText(formData.get("clientPaymentStatus")) || "pending",
    cleanerPaymentStatus: cleanText(formData.get("cleanerPaymentStatus")) || "pending",
    notes: cleanOptionalText(formData.get("notes")),
  });

  revalidateAppPaths();
}

export async function updateClient(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const id = cleanText(formData.get("id"));
  const name = cleanText(formData.get("name"));

  if (!id || !name) {
    throw new Error("Client id and name are required.");
  }

  await Client.findByIdAndUpdate(
    id,
    {
      name,
      companyName: cleanOptionalText(formData.get("companyName")),
      phone: cleanOptionalText(formData.get("phone")),
      email: cleanOptionalText(formData.get("email")),
      notes: cleanOptionalText(formData.get("notes")),
    },
    { runValidators: true },
  );

  revalidateAppPaths();
}

export async function deleteClient(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const id = cleanText(formData.get("id"));
  if (!id) {
    throw new Error("Client id is required.");
  }

  const linkedJobs = await Job.countDocuments({ clientId: id });
  if (linkedJobs > 0) {
    throw new Error("Remove or reassign this client's jobs before deleting it.");
  }

  await Client.findByIdAndDelete(id);
  revalidateAppPaths();
}

export async function updateCleaner(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const id = cleanText(formData.get("id"));
  const name = cleanText(formData.get("name"));

  if (!id || !name) {
    throw new Error("Cleaner id and name are required.");
  }

  await Cleaner.findByIdAndUpdate(
    id,
    {
      name,
      phone: cleanOptionalText(formData.get("phone")),
      email: cleanOptionalText(formData.get("email")),
      notes: cleanOptionalText(formData.get("notes")),
      active: formData.get("active") === "on",
    },
    { runValidators: true },
  );

  revalidateAppPaths();
}

export async function deleteCleaner(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const id = cleanText(formData.get("id"));
  if (!id) {
    throw new Error("Cleaner id is required.");
  }

  const linkedJobs = await Job.countDocuments({ cleanerId: id });
  if (linkedJobs > 0) {
    throw new Error("Remove or reassign this cleaner's jobs before deleting them.");
  }

  await Cleaner.findByIdAndDelete(id);
  revalidateAppPaths();
}

export async function updateJob(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const id = cleanText(formData.get("id"));
  const apartmentName = cleanText(formData.get("apartmentName"));
  const clientId = cleanText(formData.get("clientId"));
  const cleanerId = cleanText(formData.get("cleanerId"));
  const cleaningDate = cleanText(formData.get("cleaningDate"));

  if (!id || !apartmentName || !clientId || !cleanerId || !cleaningDate) {
    throw new Error("Job id, apartment, client, cleaner, and date are required.");
  }

  await Job.findByIdAndUpdate(
    id,
    {
      apartmentName,
      apartmentAddress: cleanOptionalText(formData.get("apartmentAddress")),
      clientId,
      cleanerId,
      cleaningDate: new Date(cleaningDate),
      amountCharged: cleanNumber(formData.get("amountCharged")),
      cleanerPayout: cleanNumber(formData.get("cleanerPayout")),
      jobStatus: cleanText(formData.get("jobStatus")) || "scheduled",
      clientPaymentStatus: cleanText(formData.get("clientPaymentStatus")) || "pending",
      cleanerPaymentStatus: cleanText(formData.get("cleanerPaymentStatus")) || "pending",
      notes: cleanOptionalText(formData.get("notes")),
    },
    { runValidators: true },
  );

  revalidateAppPaths();
}

export async function deleteJob(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const id = cleanText(formData.get("id"));
  if (!id) {
    throw new Error("Job id is required.");
  }

  await Job.findByIdAndDelete(id);
  revalidateAppPaths();
}

export async function createCleanerPayment(formData: FormData) {
  await assertAuthenticated();
  await connectToDatabase();

  const cleanerId = cleanText(formData.get("cleanerId"));
  const paymentDate = cleanText(formData.get("paymentDate"));
  const checkNumber = cleanText(formData.get("checkNumber"));
  const selectedJobIds = formData
    .getAll("jobIds")
    .map((value) => cleanText(value))
    .filter(Boolean);

  if (!cleanerId || !paymentDate || !checkNumber || selectedJobIds.length === 0) {
    throw new Error("Cleaner, payment date, check number, and at least one job are required.");
  }

  const jobs = await Job.find({
    _id: { $in: selectedJobIds },
    cleanerId,
    cleanerPaymentStatus: "pending",
  }).lean();

  if (jobs.length !== selectedJobIds.length) {
    throw new Error("Some selected jobs are no longer available for payment.");
  }

  const totalAmount = jobs.reduce((sum, job) => sum + job.cleanerPayout, 0);

  const payment = await CleanerPayment.create({
    cleanerId,
    jobIds: selectedJobIds,
    paymentDate: new Date(paymentDate),
    checkNumber,
    totalAmount,
    memo: cleanOptionalText(formData.get("memo")),
    notes: cleanOptionalText(formData.get("notes")),
    status: "issued",
  });

  await Job.updateMany(
    { _id: { $in: selectedJobIds } },
    {
      $set: {
        cleanerPaymentStatus: "paid",
        cleanerPaymentId: payment._id,
      },
    },
  );

  revalidateAppPaths();
  redirect(`/payments/${payment._id.toString()}`);
}
