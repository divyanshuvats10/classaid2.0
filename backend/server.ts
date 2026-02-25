import express, { Request, Response } from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User";
import Building from "./models/Building";
import Complaint from "./models/Complaint";
import LayoutTemplate from "./models/LayoutTemplate";
import { getDefaultLayout1 } from "./utils/layouts";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/college-room";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Extend session type
declare module "express-session" {
  interface SessionData {
    user?: {
      registration_number: string;
      name: string;
      role: string;
    };
  }
}

// Register Route
app.post("/register", async (req: Request, res: Response) => {
  try {
    const { registration_number, name, password, role } = req.body;
    if (!registration_number || !name || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["student", "worker", "admin", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existingUser = await User.findOne({ registration_number });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = new User({ registration_number, name, password, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
app.post("/login", async (req: Request, res: Response) => {
  try {
    const { registration_number, password } = req.body;
    // Check if user exists
    const user = await User.findOne({ registration_number });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });
    // Create session
    req.session.user = { registration_number: user.registration_number, name: user.name, role: user.role };
    res.json({ message: "Login successful", user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout Route
app.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Dashboard Route
app.get("/dashboard", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  try {
    // Fetch the full user from database to get all fields including subrole
    const user = await User.findOne({ registration_number: req.session.user.registration_number }).select("registration_number name role subrole");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    let complaints: any[] = [];
    if (user.role === "admin" || user.role === "worker") {
      complaints = await Complaint.find().sort({ dateLogged: -1 });
    } else if (user.role === "student" || user.role === "teacher") {
      complaints = await Complaint.find({ "loggedBy.registrationNumber": user.registration_number }).sort({ dateLogged: -1 });
    }
    res.json({ user, complaints });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// 🏗️ Add a new building (Admins only)
app.post("/buildings", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  const { buildingNumber, buildingName } = req.body;
  if (!buildingNumber) {
    return res.status(400).json({ message: "Block number is required" });
  }
  try {
    const newBuilding = new Building({ buildingNumber, buildingName: buildingName || undefined, floors: [] });
    await newBuilding.save();
    res.status(201).json({ message: "Block added successfully", building: newBuilding });
  } catch (error: any) {
    console.error("Error adding building:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Block number already exists" });
    }
    res.status(500).json({ message: "Error adding block" });
  }
});

// Get all buildings
app.get("/buildings", async (req: Request, res: Response) => {
  try {
    // include floors so frontend can show floor counts without extra requests
    const buildings = await Building.find().select("buildingNumber buildingName floors");
    res.json(buildings);
  } catch (error) {
    console.error("Error fetching buildings:", error);
    res.status(500).json({ message: "Error fetching buildings" });
  }
});

// Delete building (Admins only)
app.delete("/buildings/:buildingNumber", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    // Delete all complaints related to this building
    await Complaint.deleteMany({ buildingNumber: req.params.buildingNumber });
    await Building.deleteOne({ buildingNumber: req.params.buildingNumber });
    res.json({ message: "Block deleted successfully" });
  } catch (error) {
    console.error("Error deleting building:", error);
    res.status(500).json({ message: "Error deleting block" });
  }
});

// Get floors in a building
app.get("/buildings/:buildingNumber/floors", async (req: Request, res: Response) => {
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    res.json(building.floors);
  } catch (error) {
    console.error("Error fetching floors:", error);
    res.status(500).json({ message: "Error fetching floors" });
  }
});

// Add floor (Admins only)
app.post("/buildings/:buildingNumber/floors", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  const { floorNumber } = req.body;
  if (!floorNumber) {
    return res.status(400).json({ message: "Floor number is required" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    // Check if floor already exists
    if (building.floors.some((f) => f.floorNumber === floorNumber)) {
      return res.status(400).json({ message: "Floor number already exists" });
    }
    building.floors.push({ floorNumber, rooms: [] });
    await building.save();
    res.status(201).json({ message: "Floor added successfully", floor: building.floors[building.floors.length - 1] });
  } catch (error) {
    console.error("Error adding floor:", error);
    res.status(500).json({ message: "Error adding floor" });
  }
});

// Delete floor (Admins only)
app.delete("/buildings/:buildingNumber/floors/:floorNumber", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    // Delete all complaints related to this floor
    await Complaint.deleteMany({ buildingNumber: req.params.buildingNumber, floorNumber: req.params.floorNumber });
    building.floors = building.floors.filter((f) => f.floorNumber !== req.params.floorNumber);
    await building.save();
    res.json({ message: "Floor deleted successfully" });
  } catch (error) {
    console.error("Error deleting floor:", error);
    res.status(500).json({ message: "Error deleting floor" });
  }
});

// Get rooms in a floor
app.get("/buildings/:buildingNumber/floors/:floorNumber/rooms", async (req: Request, res: Response) => {
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    res.json(floor.rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

// Get layout templates (list available templates for the UI)
app.get("/layout-templates", async (req: Request, res: Response) => {
  try {
    const templates = await LayoutTemplate.find().select("templateName layout").lean();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching layout templates:", error);
    res.status(500).json({ message: "Error fetching layout templates" });
  }
});

// Create a new layout template (Admins only)
app.post("/layout-templates", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  const { templateName, layout } = req.body;
  if (!templateName || !layout) {
    return res.status(400).json({ message: "templateName and layout are required" });
  }
  try {
    // Prevent overwriting existing template names
    const existing = await LayoutTemplate.findOne({ templateName });
    if (existing) {
      return res.status(400).json({ message: "Template with this name already exists" });
    }
    const newTemplate = new LayoutTemplate({ templateName, layout });
    await newTemplate.save();
    res.status(201).json({ message: "Template created successfully", template: newTemplate });
  } catch (error) {
    console.error("Error creating layout template:", error);
    res.status(500).json({ message: "Error creating layout template" });
  }
});

// Add room (Admins only)
app.post("/buildings/:buildingNumber/floors/:floorNumber/rooms", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  const { roomNumber } = req.body;
  if (!roomNumber) {
    return res.status(400).json({ message: "Room number is required" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    // Check if room already exists
    if (floor.rooms.some((r) => r.roomNumber === roomNumber)) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    const { layoutType, layoutTemplateName } = req.body;
    let layout: any = null;

    // If a specific template name is provided, use it
    if (layoutTemplateName) {
      const tpl = await LayoutTemplate.findOne({ templateName: layoutTemplateName }).lean();
      if (!tpl) {
        return res.status(400).json({ message: "Layout template not found" });
      }
      layout = tpl.layout;
    } else if (layoutType && layoutType !== "none") {
      // backward-compat: try find a template with the given layoutType name
      const tpl = await LayoutTemplate.findOne({ templateName: layoutType }).lean();
      if (tpl) {
        layout = tpl.layout;
      } else if (layoutType === "layout1") {
        // fallback to default function
        layout = getDefaultLayout1();
      }
    } else if (layoutType === "none") {
      layout = {
        layoutType: "custom",
        gridRows: 14,
        gridCols: 22,
        assets: {
          board: [],
          projector: [],
          ac: [],
          fan: [],
          table: [],
          chair: [],
          tablechair: [],
          door: []
        }
      };
    }

    floor.rooms.push({ roomNumber, layout });
    await building.save();
    res.status(201).json({ message: "Room added successfully", room: floor.rooms[floor.rooms.length - 1] });
  } catch (error) {
    console.error("Error adding room:", error);
    res.status(500).json({ message: "Error adding room" });
  }
});

// Delete room (Admins only)
app.delete("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Delete all complaints related to this room
    await Complaint.deleteMany({
      buildingNumber: req.params.buildingNumber,
      floorNumber: req.params.floorNumber,
      roomNumber: req.params.roomNumber
    });
    floor.rooms = floor.rooms.filter((r) => r.roomNumber !== req.params.roomNumber);
    await building.save();
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Error deleting room" });
  }
});

// Get room layout
app.get("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/layout", async (req: Request, res: Response) => {
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room.layout || getDefaultLayout1());
  } catch (error) {
    console.error("Error fetching layout:", error);
    res.status(500).json({ message: "Error fetching layout" });
  }
});

// Update room layout
app.patch("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/layout", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    const { layout } = req.body;
    if (!layout) {
      return res.status(400).json({ message: "Layout data is required" });
    }
    
    // Update layout with new structure
    room.layout = {
      layoutType: layout.layoutType || "custom",
      gridRows: layout.gridRows || 14,
      gridCols: layout.gridCols || 22,
      assets: layout.assets || {
        board: [],
        projector: [],
        ac: [],
        fan: [],
        table: [],
        chair: [],
        tablechair: [],
        door: []
      }
    };
    
    await building.save();
    res.json({ message: "Layout updated successfully", layout: room.layout });
  } catch (error) {
    console.error("Error updating layout:", error);
    res.status(500).json({ message: "Error updating layout" });
  }
});

// Get objects in a room
app.get("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects", async (req: Request, res: Response) => {
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Flatten all assets from layout.assets
    const allObjects: any[] = [];
    if (room.layout && room.layout.assets) {
      Object.entries(room.layout.assets).forEach(([type, objects]: [string, any]) => {
        if (Array.isArray(objects)) {
          objects.forEach((obj: any) => {
            allObjects.push({ ...obj, type, objectNumber: `${type}-${obj.number}` });
          });
        }
      });
    }
    res.json(allObjects);
  } catch (error) {
    console.error("Error fetching objects:", error);
    res.status(500).json({ message: "Error fetching objects" });
  }
});

// Add object (Admins only)
app.post("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  const { number, type, row, col, status } = req.body;
  if (number === undefined || !type || row === undefined || col === undefined) {
    return res.status(400).json({ message: "number, type, row, and col are required" });
  }
  if (!["board", "projector", "ac", "fan", "table", "chair", "tablechair", "door"].includes(type)) {
    return res.status(400).json({ message: "Invalid object type" });
  }
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Ensure layout.assets structure exists
    if (!room.layout) {
      room.layout = {
        layoutType: "custom",
        gridRows: 14,
        gridCols: 22,
        assets: {
          board: [],
          projector: [],
          ac: [],
          fan: [],
          table: [],
          chair: [],
          tablechair: [],
          door: []
        }
      };
    }
    if (!room.layout.assets) {
      room.layout.assets = {
        board: [],
        projector: [],
        ac: [],
        fan: [],
        table: [],
        chair: [],
        tablechair: [],
        door: []
      };
    }
    // Check if object number already exists in this type
    if ((room.layout.assets[type as keyof typeof room.layout.assets] || []).some((o: any) => o.number === number)) {
      return res.status(400).json({ message: `${type} with number ${number} already exists` });
    }
    // Add object to the appropriate type array
    const newObject = { number, row, col, status: status || "working" };
    room.layout.assets[type as keyof typeof room.layout.assets].push(newObject);
    await building.save();
    res.status(201).json({ message: "Object added successfully", object: newObject });
  } catch (error) {
    console.error("Error adding object:", error);
    res.status(500).json({ message: "Error adding object" });
  }
});

// Delete object (Admins only)
app.delete("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects/:type/:number", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  const { type, number } = req.params;
  const typeNum = parseInt(number);
  try {
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Delete all complaints related to this object
    await Complaint.deleteMany({
      buildingNumber: req.params.buildingNumber,
      floorNumber: req.params.floorNumber,
      roomNumber: req.params.roomNumber,
      objectNumber: `${type}-${number}`
    });
    // Remove from layout.assets[type]
    if (room.layout?.assets && room.layout.assets[type as keyof typeof room.layout.assets]) {
      room.layout.assets[type as keyof typeof room.layout.assets] = room.layout.assets[type as keyof typeof room.layout.assets].filter(
        (o: any) => o.number !== typeNum
      );
    }
    await building.save();
    res.json({ message: "Object deleted successfully" });
  } catch (error) {
    console.error("Error deleting object:", error);
    res.status(500).json({ message: "Error deleting object" });
  }
});

// Update object (PATCH) - edit status
app.patch("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects/:type/:number", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const { status, row, col } = req.body;
    const { type, number } = req.params;
    const typeNum = parseInt(number);
    
    const building = await Building.findOne({ buildingNumber: req.params.buildingNumber });
    if (!building) {
      return res.status(404).json({ message: "Block not found" });
    }
    const floor = building.floors.find((f) => f.floorNumber === req.params.floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    const room = floor.rooms.find((r) => r.roomNumber === req.params.roomNumber);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // Find object in layout.assets[type]
    if (!room.layout?.assets || !room.layout.assets[type as keyof typeof room.layout.assets]) {
      return res.status(404).json({ message: "Object not found" });
    }
    
    const typeAssets = room.layout.assets[type as keyof typeof room.layout.assets] as any[];
    const objectIndex = typeAssets.findIndex((o: any) => o.number === typeNum);
    
    if (objectIndex === -1) {
      return res.status(404).json({ message: "Object not found" });
    }
    
    // Update object properties
    if (status !== undefined) typeAssets[objectIndex].status = status;
    if (row !== undefined) typeAssets[objectIndex].row = row;
    if (col !== undefined) typeAssets[objectIndex].col = col;
    
    await building.save();
    res.json({ message: "Object updated successfully", object: typeAssets[objectIndex] });
  } catch (error) {
    console.error("Error updating object:", error);
    res.status(500).json({ message: "Error updating object" });
  }
});

// Get complaints for an object
app.get("/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects/:objectNumber/complaints", async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find({
      buildingNumber: req.params.buildingNumber,
      floorNumber: req.params.floorNumber,
      roomNumber: req.params.roomNumber,
      objectNumber: req.params.objectNumber
    }).sort({ dateLogged: -1 });
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Error fetching complaints" });
  }
});

// Submit complaint
app.post("/complaints", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  const { objectNumber, buildingNumber, floorNumber, roomNumber, text } = req.body;
  if (!objectNumber || !buildingNumber || !floorNumber || !roomNumber || !text) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const complaint = new Complaint({
      objectNumber,
      buildingNumber,
      floorNumber,
      roomNumber,
      text,
      loggedBy: {
        registrationNumber: req.session.user.registration_number,
        name: req.session.user.name,
        role: req.session.user.role
      }
    });
    await complaint.save();

    // Also update the related object in the building layout to mark it as broken and link complaintId
    try {
      const [type, numStr] = objectNumber.split("-");
      const number = parseInt(numStr);
      const building = await Building.findOne({ buildingNumber });
      if (building) {
        const floor = building.floors.find((f) => f.floorNumber === floorNumber);
        if (floor) {
          const room = floor.rooms.find((r) => r.roomNumber === roomNumber);
          if (room && room.layout && room.layout.assets && Array.isArray(room.layout.assets[type as keyof typeof room.layout.assets])) {
            const assets = room.layout.assets[type as keyof typeof room.layout.assets] as any[];
            const asset = assets.find((a) => a.number === number);
            if (asset) {
              asset.status = "broken";
              asset.complaintId = complaint._id;
              await building.save();
            }
          }
        }
      }
    } catch (err) {
      console.error("Error linking complaint to object:", err);
    }

    res.status(201).json({ message: "Complaint submitted successfully", complaint });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ message: "Error submitting complaint" });
  }
});

// Mark complaint as "looking into it" (Admin/Worker)
app.patch("/complaints/:id/looking", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  if (req.session.user.role !== "admin" && req.session.user.role !== "worker") {
    return res.status(403).json({ message: "Unauthorized: Admins and Workers only" });
  }
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Mark complaint as looking into it
    complaint.status = "looking";
    complaint.lookingInto = {
      registrationNumber: req.session.user.registration_number,
      name: req.session.user.name,
      role: req.session.user.role,
      dateMarked: new Date()
    };

    await complaint.save();
    res.json({ message: "Complaint marked as looking into it", complaint });
  } catch (error) {
    console.error("Error marking complaint as looking into it:", error);
    res.status(500).json({ message: "Error marking complaint as looking into it" });
  }
});

// Revert complaint from "looking into it" back to "pending" (Admin/Worker)
app.patch("/complaints/:id/revert-pending", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  if (req.session.user.role !== "admin" && req.session.user.role !== "worker") {
    return res.status(403).json({ message: "Unauthorized: Admins and Workers only" });
  }
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Revert complaint back to pending
    complaint.status = "pending";
    complaint.lookingInto = undefined;

    await complaint.save();
    res.json({ message: "Complaint reverted to pending", complaint });
  } catch (error) {
    console.error("Error reverting complaint to pending:", error);
    res.status(500).json({ message: "Error reverting complaint to pending" });
  }
});

// Resolve complaint (Admin or assigned Worker only)
app.patch("/complaints/:id/resolve", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  // Admins can resolve any complaint
  const isAdmin = req.session.user.role === "admin";

  // Workers can only resolve complaints they're currently looking into
  const isWorker = req.session.user.role === "worker";

  if (!isAdmin && !isWorker) {
    return res.status(403).json({ message: "Unauthorized: Admins and assigned Workers only" });
  }

  try {
    const { remark } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // If user is a worker, check if they're the one looking into this complaint
    if (isWorker && !isAdmin) {
      if (!complaint.lookingInto || complaint.lookingInto.registrationNumber !== req.session.user.registration_number) {
        return res.status(403).json({ message: "Unauthorized: You can only resolve complaints you're currently looking into" });
      }
    }

    // Mark complaint resolved
    complaint.status = "resolved";
    complaint.dateResolved = new Date();
    complaint.resolvedBy = {
      registrationNumber: req.session.user.registration_number,
      name: req.session.user.name
    };
    if (remark !== undefined) complaint.resolvedRemark = remark;

    // Also attempt to clear the related object's broken status and complaintId
    try {
      const objectNumber = complaint.objectNumber;
      const [type, numStr] = objectNumber.split("-");
      const number = parseInt(numStr);
      const building = await Building.findOne({ buildingNumber: complaint.buildingNumber });
      if (building) {
        const floor = building.floors.find((f) => f.floorNumber === complaint.floorNumber);
        if (floor) {
          const room = floor.rooms.find((r) => r.roomNumber === complaint.roomNumber);
          if (room && room.layout && room.layout.assets && Array.isArray(room.layout.assets[type as keyof typeof room.layout.assets])) {
            const assets = room.layout.assets[type as keyof typeof room.layout.assets] as any[];
            const asset = assets.find((a) => a.number === number);
            if (asset) {
              asset.status = "working";
              if (asset.complaintId && asset.complaintId.toString() === complaint._id.toString()) {
                delete asset.complaintId;
              }
              await building.save();
            }
          }
        }
      }
    } catch (err) {
      console.error("Error updating object status while resolving complaint:", err);
    }

    await complaint.save();
    res.json({ message: "Complaint resolved successfully", complaint });
  } catch (error) {
    console.error("Error resolving complaint:", error);
    res.status(500).json({ message: "Error resolving complaint" });
  }
});

// Get all resolved complaints (Admin/Worker only)
app.get("/complaints/resolved", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  if (req.session.user.role !== "admin" && req.session.user.role !== "worker") {
    return res.status(403).json({ message: "Unauthorized: Admins and Workers only" });
  }
  try {
    const resolvedComplaints = await Complaint.find({ status: "resolved" }).sort({ dateResolved: -1 });
    res.json(resolvedComplaints);
  } catch (error) {
    console.error("Error fetching resolved complaints:", error);
    res.status(500).json({ message: "Error fetching resolved complaints" });
  }
});

// Like/Unlike complaint
app.post("/complaints/:id/like", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if user already liked this complaint
    const existingLikeIndex = complaint.likes.findIndex(
      like => like.user.registrationNumber === req.session.user!.registration_number
    );

    if (existingLikeIndex >= 0) {
      // User already liked, toggle the active status
      complaint.likes[existingLikeIndex].isActive = !complaint.likes[existingLikeIndex].isActive;
      complaint.likes[existingLikeIndex].dateLiked = new Date();
    } else {
      // First time liking, add new like entry
      complaint.likes.push({
        user: {
          registrationNumber: req.session.user.registration_number,
          name: req.session.user.name,
          role: req.session.user.role
        },
        dateLiked: new Date(),
        isActive: true
      });
    }

    await complaint.save();
    res.json({ message: "Like status updated successfully", complaint });
  } catch (error) {
    console.error("Error updating like status:", error);
    res.status(500).json({ message: "Error updating like status" });
  }
});

// Get all users (Admins only)
app.get("/users", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const users = await User.find().select("registration_number name role subrole").sort({ role: 1, name: 1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get specific user profile (Admins only, or own profile)
app.get("/users/:registrationNumber", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  // Allow admins to view any profile, or users to view their own profile
  if (req.session.user.role !== "admin" && req.session.user.registration_number !== req.params.registrationNumber) {
    return res.status(403).json({ message: "Unauthorized: You can only view your own profile" });
  }

  try {
    const user = await User.findOne({ registration_number: req.params.registrationNumber }).select("registration_number name role subrole");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Update user subrole (Admins only)
app.patch("/users/:registration_number/subrole", async (req: Request, res: Response) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  try {
    const { subrole } = req.body;
    const user = await User.findOne({ registration_number: req.params.registration_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.subrole = subrole || null;
    await user.save();
    res.json({ message: "Subrole updated successfully", user });
  } catch (error) {
    console.error("Error updating subrole:", error);
    res.status(500).json({ message: "Error updating subrole" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

