import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const cleanerPaymentSchema = new Schema(
  {
    cleanerId: { type: Schema.Types.ObjectId, ref: "Cleaner", required: true },
    jobIds: [{ type: Schema.Types.ObjectId, ref: "Job", required: true }],
    checkNumber: { type: String, required: true, trim: true },
    paymentDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    memo: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "issued", "void"],
      default: "issued",
    },
  },
  { timestamps: true },
);

export type CleanerPaymentDocument = InferSchemaType<typeof cleanerPaymentSchema> & {
  _id: Types.ObjectId;
};

export const CleanerPayment =
  (models.CleanerPayment as Model<CleanerPaymentDocument>) ||
  model<CleanerPaymentDocument>("CleanerPayment", cleanerPaymentSchema);
