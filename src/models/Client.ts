import { Model, Schema, model, models } from "mongoose";

export type ClientDocument = {
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  quickbooksCustomerId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const clientSchema = new Schema<ClientDocument>(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    quickbooksCustomerId: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Client =
  (models.Client as Model<ClientDocument>) ||
  model<ClientDocument>("Client", clientSchema);
