import dotenv from "dotenv";
import mongoose from "mongoose";
import Building from "../models/Building";
import LayoutTemplate from "../models/LayoutTemplate";
import { getDefaultLayout1 } from "../utils/layouts";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/college-room";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB for seeding layout template");

  // Find Room 101 across all buildings/floors
  const buildings = await Building.find().lean();
  let roomLayout: any = null;

  outer: for (const b of buildings) {
    if (!b.floors) continue;
    for (const f of b.floors) {
      if (!f.rooms) continue;
      for (const r of f.rooms) {
        if (r && r.roomNumber === "101" && r.layout && r.layout.assets) {
          roomLayout = r.layout;
          break outer;
        }
      }
    }
  }

  if (!roomLayout) {
    console.log("Room 101 with layout not found in DB — falling back to getDefaultLayout1() template");
    roomLayout = getDefaultLayout1();
  } else {
    console.log("Found Room 101 layout in DB — copying assets into template");
  }

  const upsert = await LayoutTemplate.findOneAndUpdate(
    { templateName: "layout1" },
    { templateName: "layout1", layout: roomLayout },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Layout template upserted:", upsert.templateName);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
