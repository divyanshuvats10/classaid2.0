import mongoose from "mongoose";

export interface IComplaint extends mongoose.Document {
  objectNumber: string;
  buildingNumber: string;
  floorNumber: string;
  roomNumber: string;
  text: string;
  dateLogged: Date;
  loggedBy: {
    registrationNumber: string;
    name: string;
  };
  dateResolved?: Date;
  resolvedBy?: {
    registrationNumber: string;
    name: string;
  };
  resolvedRemark?: string;
  status: "pending" | "resolved";
}

const complaintSchema = new mongoose.Schema({
  objectNumber: { type: String, required: true },
  buildingNumber: { type: String, required: true },
  floorNumber: { type: String, required: true },
  roomNumber: { type: String, required: true },
  text: { type: String, required: true },
  dateLogged: { type: Date, default: Date.now },
  loggedBy: {
    registrationNumber: { type: String, required: true },
    name: { type: String, required: true }
  },
  dateResolved: { type: Date },
  resolvedBy: {
    registrationNumber: { type: String },
    name: { type: String }
  },
  resolvedRemark: { type: String },
  status: { type: String, enum: ["pending", "resolved"], default: "pending" }
});

export default mongoose.model<IComplaint>("Complaint", complaintSchema);

