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
    role: string;
  };
  lookingInto?: {
    registrationNumber: string;
    name: string;
    role: string;
    dateMarked: Date;
  };
  dateResolved?: Date;
  resolvedBy?: {
    registrationNumber: string;
    name: string;
  };
  resolvedRemark?: string;
  status: "pending" | "looking" | "resolved";
  likes: Array<{
    user: {
      registrationNumber: string;
      name: string;
      role: string;
    };
    dateLiked: Date;
    isActive: boolean;
  }>;
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
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  lookingInto: {
    registrationNumber: { type: String },
    name: { type: String },
    role: { type: String },
    dateMarked: { type: Date }
  },
  dateResolved: { type: Date },
  resolvedBy: {
    registrationNumber: { type: String },
    name: { type: String }
  },
  resolvedRemark: { type: String },
  status: { type: String, enum: ["pending", "looking", "resolved"], default: "pending" },
  likes: [{
    user: {
      registrationNumber: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true }
    },
    dateLiked: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }]
});

export default mongoose.model<IComplaint>("Complaint", complaintSchema);

