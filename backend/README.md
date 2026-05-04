# LibraryWala Backend 📚

A robust and scalable Node.js backend for the LibraryWala study library booking application.

## 🚀 Features
- **JWT Authentication**: Secure token-based authentication for Owners and Students.
- **Library Management**: Full CRUD operations for libraries (Creation, Editing, Search).
- **Booking System**: Real-time seat booking requests with status management (Pending, Approved, Rejected).
- **Scalable Architecture**: Optimized MongoDB schemas with proper indexing for high-traffic performance.
- **Security**: Rate-limiting and DDoS protection integrated.

## 📂 Directory Structure
- `src/models/`: Database schemas (User, Library, Booking).
- `src/routes/`: API endpoints organized by feature.
- `src/middleware/`: Authentication and error-handling logic.
- `src/config/`: Database and Firebase initialization.

## 🛠️ Setup & Running
1. Install dependencies: `npm install`
2. Create a `.env` file with `MONGODB_URI` and `JWT_SECRET`.
3. Start the server: `npm start` (Runs on port 8000 by default).

## 🔒 Authentication Note
The system currently uses a **Mock OTP (1234)** for development. To switch to production, update the `src/routes/auth.js` to use a real SMS gateway provider (Twilio, Firebase, etc.).

---
Developed with ❤️ for LibraryWala.
