# 🏢 Apartment Management System (AMS)

> **KDU P1111 — Final Year Project**
> A full-stack web application to digitise and streamline apartment community operations.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Role-Based Access Control](#-role-based-access-control)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Test Credentials](#-test-credentials)
- [Documentation](#-documentation)
- [License](#-license)

---

## 🌐 Project Overview

The **Apartment Management System (AMS)** is a multi-role, full-stack web application designed to digitise and streamline apartment community management. It replaces traditional, paper-based administrative processes with a centralised digital platform, connecting **Admins**, **Staff**, **Maintenance Technicians**, **Homeowners**, and **Tenants** through dedicated, role-specific dashboards.

The system handles the full lifecycle of apartment operations — from user registration and approval, unit and parking management, through to billing, complaint resolution, facility reservations, and community notices.

---

## ✨ Features

### 👤 Authentication & User Management
- Secure registration with role selection (Admin, Staff, Maintenance, Homeowner, Tenant)
- JWT-based stateless session management
- Password hashing with BcryptJS
- Admin/Staff approval workflow for new user registrations
- Tenant-to-Homeowner linking and approval

### 🏠 Apartment Unit Management
- Create, update, and delete apartment units (by block, floor, and unit number)
- Assign owners and tenants to units
- View full occupancy overview

### 💰 Billing & Invoices
- Issue utility and maintenance bills to specific units
- Residents can view and pay their outstanding bills
- Full billing history and status tracking (Unpaid / Paid)

### 🔧 Complaint & Maintenance Requests
- Residents can submit complaints by category (Plumbing, Electrical, etc.)
- Priority levels: Low, Medium, High
- Staff can assign complaints to maintenance technicians
- Technicians can update and resolve their assigned work orders

### 🅿️ Parking Management
- Admin/Staff allocation of permanent parking slots to units
- Residents can request guest parking for a specific date
- Approval workflow for guest parking requests

### 🏊 Facility Reservations
- Residents can book common amenities (Gym, Pool, Clubhouse, etc.)
- Admin/Staff can approve or reject booking requests

### 📢 Notice Board
- Admin/Staff can publish and delete community-wide notices and announcements
- All residents see notices on their dashboard

### 📊 Dashboard Analytics
- Admin/Staff summary dashboard with totals (residents, units, pending bills, open complaints)
- Resident personal dashboard with their metrics (unpaid bills, active bookings, open complaints)

---

## 🛠 Technology Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Frontend Framework** | React | v19.x |
| **Build Tool** | Vite | Latest |
| **Styling** | Tailwind CSS | v4.x |
| **Client Routing** | React Router DOM | v7.x |
| **HTTP Client** | Axios | v1.x |
| **Icons** | Lucide React | Latest |
| **Backend Framework** | Express.js | v4.x |
| **Runtime** | Node.js | v16+ |
| **Database Client** | mysql2 | v3.x |
| **Authentication** | JSON Web Token (JWT) | v9.x |
| **Password Hashing** | BcryptJS | v2.x |
| **Environment Config** | Dotenv | v16.x |
| **Dev Server Reload** | Nodemon | v3.x |
| **Database** | MySQL Server | 8.x |

---

## 🏛 System Architecture

The system follows a classic **Three-Tier Architecture**:

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│         React SPA (Vite + Tailwind CSS)          │
│    Communicates via Axios REST API calls +       │
│           JWT Authorization Header              │
└──────────────────────┬──────────────────────────┘
                       │  HTTP/REST
┌──────────────────────▼──────────────────────────┐
│              Application Layer                   │
│       Express / Node.js API Server              │
│   Auth Middleware → Routes → Controllers        │
└──────────────────────┬──────────────────────────┘
                       │  mysql2 (Connection Pool)
┌──────────────────────▼──────────────────────────┐
│                 Data Layer                       │
│          MySQL Relational Database              │
│  (Users, Units, Bills, Complaints, Parking...)  │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
KDU_P1111_Apartment_Management_System/
│
├── README.md                        # This file
├── SETUP.md                         # Local setup guide
├── TECHNICAL_DOCUMENTATION.md       # Full system architecture & API docs
│
├── backend/                         # Express Node.js API Server
│   ├── config/
│   │   └── db.js                    # MySQL2 connection pool
│   ├── controllers/                 # Business logic handlers
│   │   ├── authController.js        # Auth, approvals, profile, stats
│   │   ├── billController.js        # Invoice management
│   │   ├── complaintController.js   # Complaint assignment & tracking
│   │   ├── facilityController.js    # Amenity reservations
│   │   ├── noticeController.js      # Notice board publishing
│   │   ├── parkingController.js     # Parking slot operations
│   │   └── unitController.js        # Unit setup & assignments
│   ├── db/
│   │   ├── migration.sql            # Schema definition
│   │   └── seed.js                  # Full DB setup & seed data script
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT validation & role guards
│   ├── routes/                      # Express route definitions
│   │   ├── authRoutes.js
│   │   ├── billRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── facilityRoutes.js
│   │   ├── noticeRoutes.js
│   │   ├── parkingRoutes.js
│   │   └── unitRoutes.js
│   ├── server.js                    # App entry point & middleware setup
│   ├── .env                         # Local environment variables (not committed)
│   └── package.json
│
└── frontend/                        # Vite + React Frontend Client
    ├── public/                      # Static assets
    └── src/
        ├── assets/                  # Icons & design materials
        ├── components/
        │   ├── Admin/
        │   │   └── AdminDashboard.jsx       # Unified Admin & Staff dashboard
        │   ├── Layout/
        │   │   └── Navbar.jsx               # Shared navigation bar
        │   ├── Maintenance/
        │   │   └── MaintenanceDashboard.jsx  # Work order tracker
        │   └── Resident/
        │       └── ResidentDashboard.jsx     # Homeowner/Tenant portal
        ├── context/
        │   └── AuthContext.jsx      # Global auth state (login/logout/register)
        ├── pages/
        │   ├── Dashboard.jsx        # Role-based dashboard redirector
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── NotFound.jsx
        ├── App.jsx                  # React Router configuration
        └── main.jsx                 # DOM mount entry point
```

---

## 🗄 Database Schema

The database consists of **7 primary tables** with foreign key relationships:

```
USERS ──────┬──── UNITS ──────── PARKING_MANAGEMENT
            │       │
            │       └─────────── BILLS
            │
            ├──── COMPLAINTS (submitter + assigned_staff)
            ├──── FACILITY_RESERVATIONS
            └──── NOTICES
```

| Table | Description |
| :--- | :--- |
| `users` | Profiles, credentials, roles, and approval status |
| `units` | Physical apartment units with owner/tenant links |
| `parking_management` | Permanent and guest parking slots |
| `complaints` | Maintenance requests with priority and assignment |
| `facility_reservations` | Common amenity bookings |
| `notices` | Community announcements and broadcasts |
| `bills` | Utility and maintenance invoices per unit |

---

## 🔐 Role-Based Access Control

| Feature Area | Admin | Staff | Maintenance | Homeowner | Tenant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **User Approvals** | ✅ Full | ✅ Full | 👁 Read | ❌ | ❌ |
| **Manage Units** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Issue Bills** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Pay Bills** | 👁 Read | 👁 Read | ❌ | ✅ Own | ✅ Own |
| **Publish Notices** | ✅ Full | ✅ Full | ❌ | 👁 Read | 👁 Read |
| **Manage Parking** | ✅ Full | ✅ Full | ❌ | 🅿 Guest Req | 🅿 Guest Req |
| **Manage Facilities** | ✅ Approve | ✅ Approve | ❌ | 📅 Request | 📅 Request |
| **Resolve Complaints** | 👤 Assign | 👤 Assign | ✅ Resolve | 📝 Submit/View Own | 📝 Submit/View Own |
| **Tenant Linking** | ❌ | ❌ | ❌ | ✅ Approve | 🔗 Link to Owner |

---

## 📡 API Reference

All protected routes require: `Authorization: Bearer <jwt_token>`

### Authentication & Users — `/api/auth`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Sign in and receive JWT |
| `GET` | `/homeowners` | Public | Fetch approved homeowners (for tenant linking) |
| `GET` | `/pending-approvals` | Admin / Staff | Get registrations awaiting approval |
| `POST` | `/approve` | Admin / Staff | Approve or reject a user |
| `GET` | `/admin-dashboard-stats` | Admin / Staff | Aggregate dashboard statistics |
| `GET` | `/residents` | Admin / Staff | List all homeowners and tenants |
| `GET` | `/resident-dashboard-stats` | Resident | Personal metrics |
| `PUT` | `/profile` | Auth | Update own profile |

### Units — `/api/units`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Admin / Staff | List all units |
| `POST` | `/` | Admin / Staff | Create a unit |
| `PUT` | `/:id` | Admin / Staff | Update a unit |
| `DELETE` | `/:id` | Admin / Staff | Delete a unit |

### Complaints — `/api/complaints`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | View complaints (role-filtered) |
| `POST` | `/` | Resident / Tenant | Submit a complaint |
| `PUT` | `/:id` | Staff / Maintenance | Update status / assign |
| `DELETE` | `/:id` | Admin / Staff | Remove complaint |

### Facilities — `/api/facilities`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reservations` | Authenticated | View reservations (role-filtered) |
| `POST` | `/reserve` | Resident / Tenant | Request a booking |
| `PUT` | `/reservations/:id` | Admin / Staff | Approve or reject |

### Parking — `/api/parking`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | View all parking slots |
| `POST` | `/allocate` | Admin / Staff | Allocate permanent slot |
| `POST` | `/guest` | Resident / Tenant | Request guest parking |
| `PUT` | `/guest/:id` | Admin / Staff | Approve or reject |

### Notices — `/api/notices`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Fetch all notices |
| `POST` | `/` | Admin / Staff | Publish a notice |
| `DELETE` | `/:id` | Admin / Staff | Delete a notice |

### Bills — `/api/bills`
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | View bills (role-filtered) |
| `POST` | `/` | Admin / Staff | Issue a new bill |
| `PUT` | `/:id/pay` | Resident / Staff | Mark bill as paid |

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

- **Node.js** v16.x or higher → [nodejs.org](https://nodejs.org)
- **Git** → [git-scm.com](https://git-scm.com)
- **MySQL Server** → [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

### 1. Clone the Repository

```bash
git clone https://github.com/Kavindu-J22/KDU_P1111_Apartment_Management_System.git
cd KDU_P1111_Apartment_Management_System
```

### 2. Configure Environment Variables

**Backend** — create/edit `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=apartment_management_system
JWT_SECRET=your_secure_random_secret_key
```

**Frontend** *(optional — only if backend is on a non-default address)*
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Set Up the Database

```bash
cd backend
npm install
npm run seed
```

> This single command creates the database, all tables, applies schema patches, and seeds all test data.

### 4. Start the Backend Server

```bash
# Inside the backend/ directory
npm run dev
```

The API will be running at: `http://localhost:5000`

### 5. Start the Frontend Dev Server

```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

Open your browser and navigate to: **`http://localhost:5173`**

---

## 🔑 Test Credentials

Use these pre-seeded accounts to explore different role dashboards:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@apartment.com` | `AdminPass123!` |
| **Staff** | `staff@apartment.com` | `StaffPass123!` |
| **Maintenance** | `maintenance@apartment.com` | `MaintenancePass123!` |
| **Homeowner** | `homeowner@apartment.com` | `OwnerPass123!` |

---

## 📄 Documentation

| Document | Description |
| :--- | :--- |
| [`SETUP.md`](./SETUP.md) | Step-by-step local setup guide |
| [`TECHNICAL_DOCUMENTATION.md`](./TECHNICAL_DOCUMENTATION.md) | Full architecture, schema, and API reference |

---

## 📝 License

This project was developed as a **Final Year Academic Project** for **KDU (General Sir John Kotelawala Defence University)**. It is intended for educational purposes.

---

<div align="center">
  <sub>Built with ❤️ as a Final Year Project — KDU P1111</sub>
</div>
