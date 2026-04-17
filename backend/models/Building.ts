import mongoose from "mongoose";

// Individual asset object with coordinates and status
const assetObjectSchema = new mongoose.Schema({
  number: { type: Number, required: true },                 // asset number (1, 2, 3, etc)
  row: { type: Number, required: true },                    // row coordinate
  col: { type: Number, required: true },                    // column coordinate
  status: { type: String, enum: ["working", "faulty", "pending", "broken"], default: "working" },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }
}, { _id: false });

// Layout schema with assets grouped by type
const layoutSchema = new mongoose.Schema({
  layoutType: { type: String, enum: ["layout1", "custom", "none"], default: "custom" },
  gridRows: { type: Number, default: 14 },
  gridCols: { type: Number, default: 22 },
  assets: {
    board: [assetObjectSchema],
    projector: [assetObjectSchema],
    ac: [assetObjectSchema],
    fan: [assetObjectSchema],
    table: [assetObjectSchema],
    chair: [assetObjectSchema],
    tablechair: [assetObjectSchema],
    door: [assetObjectSchema]
  }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  layout: { type: layoutSchema, required: false }
});

const floorSchema = new mongoose.Schema({
  floorNumber: { type: String, required: true },
  rooms: [roomSchema]
});

const buildingSchema = new mongoose.Schema({
  buildingNumber: { type: String, required: true, unique: true },
  buildingName: { type: String, required: false },
  floors: [floorSchema]
});

export interface IAssetObject {
  number: number;
  row: number;
  col: number;
  status: "working" | "faulty" | "pending" | "broken";
  complaintId?: string;
}

export interface ILayout {
  layoutType: "layout1" | "custom" | "none";
  gridRows: number;
  gridCols: number;
  assets: {
    board: IAssetObject[];
    projector: IAssetObject[];
    ac: IAssetObject[];
    fan: IAssetObject[];
    table: IAssetObject[];
    chair: IAssetObject[];
    tablechair: IAssetObject[];
    door: IAssetObject[];
  };
}

export interface IRoom {
  roomNumber: string;
  layout?: ILayout;
}

export interface IFloor {
  floorNumber: string;
  rooms: IRoom[];
}

export interface IBuilding extends mongoose.Document {
  buildingNumber: string;
  buildingName?: string;
  floors: IFloor[];
}

export default mongoose.model<IBuilding>("Building", buildingSchema);

