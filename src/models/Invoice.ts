import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    jobIds: [{ type: Schema.Types.ObjectId, ref: "Job", required: true }],
    totalAmount: { type: Number, required: true, min: 0 },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    quickbooksInvoiceId: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema> & {
  _id: Types.ObjectId;
};

export const Invoice =
  (models.Invoice as Model<InvoiceDocument>) ||
  model<InvoiceDocument>("Invoice", invoiceSchema);
