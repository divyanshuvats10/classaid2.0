export interface User {
  registration_number: string;
  name: string;
  role: "student" | "worker" | "admin";
}

export interface ObjectType {
  objectNumber: string;
  type: "board" | "projector" | "ac" | "fan" | "table" | "chair" | "tablechair" | "door";
  status: "working" | "faulty" | "pending" | "broken";
  complaintId?: string;
}

export interface AssetObject {
  number: number;
  row: number;
  col: number;
  status: "working" | "faulty" | "pending" | "broken";
  complaintId?: string;
}

export interface LayoutPosition {
  row: number;
  col: number;
  objectNumber?: string;
  width?: number;
  height?: number;
}

export interface Assets {
  board: AssetObject[];
  projector: AssetObject[];
  ac: AssetObject[];
  fan: AssetObject[];
  table: AssetObject[];
  chair: AssetObject[];
  tablechair: AssetObject[];
  door: AssetObject[];
}

export interface Layout {
  layoutType: "layout1" | "custom" | "none";
  gridRows: number;
  gridCols: number;
  assets?: Assets;
  positions?: LayoutPosition[];  // Keep for backwards compatibility
}

export interface Room {
  roomNumber: string;
  objects?: ObjectType[];  // Old structure
  layout?: Layout;
}

export interface Floor {
  floorNumber: string;
  rooms: Room[];
}

export interface Building {
  buildingNumber: string;
  buildingName?: string;
  floors: Floor[];
}

export interface Complaint {
  _id: string;
  objectNumber: string;
  buildingNumber: string;
  floorNumber: string;
  roomNumber: string;
  text: string;
  dateLogged: string;
  loggedBy: {
    registrationNumber: string;
    name: string;
  };
  dateResolved?: string;
  resolvedBy?: {
    registrationNumber: string;
    name: string;
  };
  resolvedRemark?: string;
  status: "pending" | "resolved";
}

