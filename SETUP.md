# Apartment Management System (AMS) Setup Guide

Follow this step-by-step guide to configure and run the Apartment Management System (AMS) on your local device.

---

## 1. Prerequisites

Before starting, make sure you have the following installed on your target device:
* **Node.js** (v16.x or higher recommended) -> [Download Node.js](https://nodejs.org)
* **Git** -> [Download Git](https://git-scm.com)
* **MySQL Server** -> [Download MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

---

## 2. Configuration & Environment Variables

### Backend Configuration
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a file named `.env` in the `backend` folder (or edit the existing one) and configure your local MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_username (default: root)
   DB_PASSWORD=your_mysql_password
   DB_NAME=apartment_management_system
   JWT_SECRET=choose_any_secure_random_string_key
   ```

### Frontend Configuration (Optional)
By default, the frontend is configured to communicate with `http://localhost:5000/api`. If you run the backend on a different port or host, create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://your_backend_ip_or_domain:port/api
```

---

## 3. Database Migration and Seeding

The backend includes a single seed script that **fully** sets up the database — it creates the schema, applies all column patches, creates all tables, and inserts all seed/test data in one step.

1. Install backend dependencies first:
   ```bash
   cd backend
   npm install
   ```
2. Make sure your local MySQL Server is **running**.
3. Run the complete database setup:
   ```bash
   npm run seed
   ```
   *This command will:*
   - *Create the database and all tables*
   - *Apply all column patches (units, notices, bills, complaints, parking, etc.)*
   - *Create additional tables (facilities, events, event_registrations, payment_transactions)*
   - *Insert seed users, parking slots, units, facilities, events, and notices*

---

## 4. Run the Development Servers

### Start Backend API Server
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Start the Express API server in development mode (runs on port `5000` by default):
   ```bash
   npm run dev
   ```

### Start Frontend Dev Server
1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server (runs on port `5173` by default):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 5. Test Accounts and Credentials

Use these pre-configured seed credentials to test different user roles and dashboards in the system:

| Role / Dashboard | Test Account Email | Password |
| :--- | :--- | :--- |
| **Admin Dashboard** | `admin@apartment.com` | `AdminPass123!` |
| **Staff Dashboard** | `staff@apartment.com` | `StaffPass123!` |
| **Maintenance Dashboard** | `maintenance@apartment.com` | `MaintenancePass123!` |
| **Resident (Homeowner)** | `homeowner@apartment.com` | `OwnerPass123!` |
