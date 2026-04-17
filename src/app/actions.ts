"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/mongodb";
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

export async function createClient(formData: FormData) {
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

  revalidatePath("/jobs");
}

export async function createCleaner(formData: FormData) {
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

  revalidatePath("/jobs");
}

export async function createJob(formData: FormData) {
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

  revalidatePath("/jobs");
}
