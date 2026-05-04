# LibraryWala App 📚

This repository contains both the Frontend (React Native) and the Backend (Node.js) for the LibraryWala study library booking application.

## 📂 Project Structure
- `frontend/`: React Native Expo application for students and owners.
- `backend/`: Node.js Express backend API with MongoDB.

## 🚀 Backend Features
- **JWT Authentication**: Secure token-based authentication for Owners and Students.
- **Library Management**: Full CRUD operations for libraries (Creation, Editing, Search).
- **Booking System**: Real-time seat booking requests with status management (Pending, Approved, Rejected).
- **Scalable Architecture**: Optimized MongoDB schemas with proper indexing for high-traffic performance.
- **Security**: Rate-limiting and DDoS protection integrated.

## 📱 Frontend Features
- **Modern UI**: Premium, editorial-style interface.
- **Seat Management**: Interactive seat layout for library owners.
- **Reports**: Financial insights and occupancy data.

## 🛠️ Setup & Running

### Backend
1. Go to `backend/`
2. Install dependencies: `npm install`
3. Create a `.env` file with `MONGODB_URI` and `JWT_SECRET`.
4. Start the server: `npm start` (Runs on port 8000 by default).

### Frontend
1. Go to `frontend/`
2. Install dependencies: `npm install`
3. Run: `npx expo start`

---
Developed with ❤️ for LibraryWala.
