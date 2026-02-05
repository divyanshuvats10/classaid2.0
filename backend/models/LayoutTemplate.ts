import mongoose from "mongoose";

// Asset object schema (same structure as in Building)
const assetObjectSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    status: { type: String, enum: ["working", "faulty", "pending"], default: "working" }
  },
  { _id: false }
);

const layoutSchema = new mongoose.Schema(
  {
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
  },
  { _id: false }
);

const layoutTemplateSchema = new mongoose.Schema(
  {
    templateName: { type: String, required: true, unique: true },
    layout: { type: layoutSchema, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("LayoutTemplate", layoutTemplateSchema);
