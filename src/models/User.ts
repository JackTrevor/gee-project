import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const userSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, trim: true, lowercase: true, unique: true },
		passwordHash: { type: String, required: true },
		cleanerId: { type: Schema.Types.ObjectId, ref: "Cleaner" },
		role: {
			type: String,
			enum: ["admin", "staff", "cleaner"],
			default: "staff",
		},
		active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const User =
  (models.User as Model<UserDocument>) || model<UserDocument>("User", userSchema);
