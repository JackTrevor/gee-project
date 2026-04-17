import { Model, Schema, model, models } from "mongoose";

export type CleanerDocument = {
  name: string;
  phone?: string;
  email?: string;
  quickbooksVendorId?: string;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const cleanerSchema = new Schema<CleanerDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    quickbooksVendorId: { type: String, trim: true },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Cleaner =
  (models.Cleaner as Model<CleanerDocument>) ||
  model<CleanerDocument>("Cleaner", cleanerSchema);
