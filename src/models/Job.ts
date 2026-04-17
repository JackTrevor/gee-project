import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const jobSchema = new Schema(
  {
    apartmentName: { type: String, required: true, trim: true },
    apartmentAddress: { type: String, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    cleanerId: { type: Schema.Types.ObjectId, ref: "Cleaner", required: true },
    cleaningDate: { type: Date, required: true },
    amountCharged: { type: Number, required: true, min: 0 },
    cleanerPayout: { type: Number, required: true, min: 0 },
    jobStatus: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    clientPaymentStatus: {
      type: String,
      enum: ["pending", "invoiced", "paid"],
      default: "pending",
    },
    clientInvoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    cleanerPaymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    cleanerPaymentId: { type: Schema.Types.ObjectId, ref: "CleanerPayment" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

jobSchema.virtual("profit").get(function (this: { amountCharged: number; cleanerPayout: number }) {
  return this.amountCharged - this.cleanerPayout;
});

export type JobDocument = InferSchemaType<typeof jobSchema> & {
  _id: Types.ObjectId;
};

export const Job =
  (models.Job as Model<JobDocument>) || model<JobDocument>("Job", jobSchema);
