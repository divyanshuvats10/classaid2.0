# ClassAid - College Room Management System

A full-stack web application for managing college buildings, rooms, and equipment complaints. The system tracks infrastructure issues and supports students, workers, and admins with role-based access control.

## Architecture & Technology Stack

### Frontend
- **React 19** with Vite and TypeScript
- **React Router DOM 7.4.1** for routing
- **Tailwind CSS 4.1.4** for styling
- Runs on `http://localhost:5173`

### Backend
- **Node.js** with **Express 5.1.0** and TypeScript
- **MongoDB** with **Mongoose 8.13.1**
- **Express Session** for authentication
- **bcryptjs** for password hashing
- Runs on `http://localhost:5000`

## Features

### User Roles
- **Student**: Can view buildings/rooms and submit complaints
- **Worker**: Can view all complaints and resolve them
- **Admin**: Full access (CRUD for buildings, floors, rooms, objects, and resolve complaints)

### Core Functionality
1. **User Management & Authentication**: Session-based authentication with role-based access
2. **Hierarchical Data Structure**: Blocks → Floors → Rooms → Objects
3. **Complaint Management**: Submit, track, and resolve complaints
4. **Admin Features**: Create/delete blocks, floors, rooms, and objects

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/college-room
SESSION_SECRET=your-secret-key-change-this-in-production
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
ClassAid/
├── backend/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Building.ts
│   │   └── Complaint.ts
│   ├── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Buildings.tsx
│   │   │   ├── Floors.tsx
│   │   │   ├── Rooms.tsx
│   │   │   ├── RoomObjects.tsx
│   │   │   └── ComplaintHistory.tsx
│   │   ├── api/
│   │   │   └── axios.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login (registration number and password only)
- `POST /logout` - User logout
- `GET /dashboard` - Get user info and complaints

### Blocks (Buildings)
- `GET /buildings` - List all blocks
- `POST /buildings` - Create block (admin only, block number 1-60, name optional)
- `DELETE /buildings/:buildingNumber` - Delete block (admin only)

### Floors
- `GET /buildings/:buildingNumber/floors` - Get floors
- `POST /buildings/:buildingNumber/floors` - Add floor (admin only)
- `DELETE /buildings/:buildingNumber/floors/:floorNumber` - Delete floor (admin only)

### Rooms
- `GET /buildings/:buildingNumber/floors/:floorNumber/rooms` - Get rooms
- `POST /buildings/:buildingNumber/floors/:floorNumber/rooms` - Add room (admin only)
- `DELETE /buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber` - Delete room (admin only)

### Objects
- `GET /buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects` - Get objects
- `POST /buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects` - Add object (admin only)
- `DELETE /buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects/:objectNumber` - Delete object (admin only)

### Complaints
- `GET /buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects/:objectNumber/complaints` - Get complaints for object
- `POST /complaints` - Submit complaint
- `PATCH /complaints/:id/resolve` - Resolve complaint (admin/worker only)

## Usage

1. **Register/Login**: Create an account or login with registration number and password
2. **Navigate**: Start from Blocks → Select Block (1-60) → Select Floor → Select Room → View Objects
3. **Submit Complaints**: Students can submit complaints for specific objects
4. **Resolve Complaints**: Admins and Workers can resolve complaints
5. **Manage Infrastructure**: Admins can create/delete blocks, floors, rooms, and objects

## Security Features

- Password hashing with bcryptjs
- Session-based authentication with httpOnly cookies
- Role-based access control
- CORS configuration
- Protected routes on frontend and backend

## License

ISC

