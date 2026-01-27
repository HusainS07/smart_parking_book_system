# 🅿️ Smart Parking Booking System

A comprehensive Next.js-based parking booking platform that allows users to book parking slots, manage their wallet, make payments, and administrators to manage parking lots. The system features real-time slot availability, wallet integration, and automated payment processing.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)

---

## ✨ Features

- **User Authentication**: NextAuth.js integration for secure authentication
- **Parking Lot Management**: Admins can create and manage parking lots with multiple slots
- **Real-time Slot Availability**: Live slot booking with Redis caching
- **Wallet System**: Digital wallet with top-up and deduction functionality
- **Payment Integration**: Razorpay integration for secure payment processing
- **Booking Management**: Users can view, modify, and cancel bookings
- **Admin Dashboard**: Complete admin panel for approving/rejecting lot requests
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Help & Support**: Contact system for user inquiries
- **Profile Management**: User profiles with picture uploads

---

## 🛠️ Technology Stack

**Frontend:**
- Next.js 14+
- React
- CSS3
- NextAuth.js

**Backend:**
- Next.js API Routes
- Node.js
- Express (via API routes)

**Database & Cache:**
- MongoDB
- Redis (for caching and real-time operations)

**Payment:**
- Razorpay API

**Other Tools:**
- ESLint (Code linting)
- PostCSS
- Worker threads for background jobs

---

## 📁 Project Structure

### Root Level Files

```
├── clear-queue.mjs              # Redis queue cleanup utility
├── inspect-redis.mjs            # Redis inspection tool for debugging
├── verify-setup.js              # Setup verification script
├── worker.mjs                   # Background worker for async tasks
├── package.json                 # Project dependencies
├── next.config.mjs              # Next.js configuration
├── postcss.config.mjs           # PostCSS configuration
├── jsconfig.json                # JavaScript configuration
├── eslint.config.mjs            # ESLint configuration
└── README.md                    # Project documentation
```

### `/app` - Next.js Application & Routes

**Main Pages:**
```
app/
├── layout.js                    # Root layout wrapper
├── page.js                      # Home page
├── globals.css                  # Global styles
├── about/
│   └── page.js                  # About page
├── admin_page/
│   └── page.js                  # Admin dashboard
├── book/
│   ├── page.js                  # Booking interface
│   └── BookClient.js            # Client-side booking logic
├── help/
│   └── page.js                  # Help/FAQ page
├── login/
│   └── page.js                  # Login page
├── profile/
│   └── page.js                  # User profile page
├── signup/
│   └── page.js                  # Registration page
└── wallet/
    └── page.js                  # Wallet management page
```

**API Routes (`/api`):**
```
api/
├── admin/                       # Admin operations
│   └── lots/
│       ├── approve/
│       │   └── route.js         # Approve parking lot requests
│       ├── pending/
│       │   └── route.js         # Get pending lot approvals
│       └── reject/
│       │   └── route.js         # Reject parking lot requests 
│       └── topup-requests/
│           └── route.js         # Handle top-up requests
├── auth/
│   └── [...]nextauth]/
│       └── route.js             # NextAuth.js authentication handler
├── bookings/
│   └── [email]/
│       └── route.js             # Get bookings by user email
├── contact/
│   └── route.js                 # Contact form submission
├── health/
│   └── route.js                 # Health check endpoint
├── lots/
│   └── route.js                 # Get/create parking lots
├── payments/
│   ├── cancel-order/
│   │   └── route.js             # Cancel payment order
│   └── create-order/
│       └── route.js             # Create payment order (Razorpay)
├── profile/
│   └── [email]/
│       └── route.js             # Get/update user profile
├── register/
│   └── route.js                 # User registration endpoint
├── slots/
│   ├── route.js                 # Get available slots
│   └── book/
│       └── route.js             # Book a parking slot
├── test-refresh/
│   └── route.js                 # Test slot refresh endpoint
├── user/
│   └── [email]/
│       └── route.js             # Get user information
├── wallet/
│   ├── amount/
│   │   └── route.js             # Get wallet balance
│   ├── deduct/
│   │   └── route.js             # Deduct from wallet
│   └── topup/
│       └── route.js             # Add funds to wallet
├── webhooks/
│   └── bookings/
│       └── route.js             # Webhook for booking updates
└── workers/                     # Background job endpoints
    ├── cleanup/
    │   └── route.js             # Clean up expired bookings
    ├── health/
    │   └── route.js             # Worker health check
    ├── manage/
    │   └── route.js             # Manage worker jobs
    └── status/
        └── route.js             # Get worker status
```

### `/components` - Reusable React Components

```
components/
├── Footer.js                    # Footer component
├── Navbar.js                    # Navigation bar component
├── SessionWrapper.js            # NextAuth session provider wrapper
└── UploadProfilePicture.js      # Profile picture upload component
```

### `/lib` - Utility Libraries & Core Logic

```
lib/
├── dbConnect.js                 # MongoDB connection handler
├── redis.js                     # Redis client configuration
├── redis-edge.js                # Edge function Redis utilities
├── ratelimiter.js               # Rate limiting logic
├── paymentQueue.js              # Payment processing queue
├── paymentWorker.js             # Background payment worker
└── slotfetch.js                 # Slot fetching and caching logic
```

### `/models` - Database Schemas (MongoDB)

```
models/
├── user.js                      # User schema (email, password, profile)
├── wallet.js                    # Wallet schema (balance, transactions)
├── ParkingLot.js                # Parking lot schema (location, capacity)
├── parkingslots.js              # Parking slots schema (status, type)
├── payment.js                   # Payment schema (orders, transactions)
├── TopUpReq.js                  # Top-up request schema
├── RateLimit.js                 # Rate limit tracking schema
└── help.js                      # Help/support ticket schema
```

### `/public` - Static Assets

```
public/
└── uploads/                     # User-uploaded profile pictures
```

### `/utils` - Helper Functions

```
utils/
└── refreshSlotDates.js          # Utility to refresh and update slot dates
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB instance
- Redis server
- Razorpay account (for payments)

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd smart_parking_book_system
npm install
```

### Step 2: Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret

# Email (Optional for contact forms)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=noreply@smartparking.com
```

### Step 3: Run Development Server
```bash
npm run dev
```

Access the application at `http://localhost:3000`

### Step 4: Verify Setup
```bash
npm run verify-setup
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth authentication endpoint
- `POST /api/register` - User registration

### Bookings
- `GET /api/bookings/[email]` - Get user bookings
- `POST /api/slots/book` - Book a parking slot
- `POST /api/webhooks/bookings` - Booking webhook handler

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/cancel-order` - Cancel payment order

### Wallet
- `GET /api/wallet/amount` - Get wallet balance
- `POST /api/wallet/topup` - Top-up wallet
- `POST /api/wallet/deduct` - Deduct from wallet

### Parking Lots
- `GET /api/lots` - Get all parking lots
- `POST /api/admin/lots/approve` - Approve lot (Admin)
- `POST /api/admin/lots/reject` - Reject lot (Admin)
- `GET /api/admin/lots/pending` - Get pending lots (Admin)

### Slots
- `GET /api/slots` - Get available slots
- `POST /api/slots` - Get slots by lot ID

### User Profile
- `GET /api/profile/[email]` - Get user profile
- `POST /api/user/[email]` - Update user info

### Utility
- `GET /api/health` - Health check
- `POST /api/contact` - Submit contact form

---

## 🗄️ Database Models

### User Model
```javascript
{
  email: String,
  password: String (hashed),
  name: String,
  phone: String,
  profilePicture: String (URL),
  createdAt: Date,
  updatedAt: Date
}
```

### Parking Lot Model
```javascript
{
  name: String,
  location: String,
  totalSlots: Number,
  pricePerHour: Number,
  owner: ObjectId (ref: User),
  status: String (pending/approved/rejected),
  createdAt: Date
}
```

### Parking Slot Model
```javascript
{
  lotId: ObjectId (ref: ParkingLot),
  slotNumber: String,
  status: String (available/booked/maintenance),
  bookingDate: Date,
  currentBooking: ObjectId (ref: Booking),
  createdAt: Date
}
```

### Payment Model
```javascript
{
  userId: ObjectId (ref: User),
  orderId: String,
  amount: Number,
  status: String (pending/completed/failed),
  paymentMethod: String,
  createdAt: Date
}
```

### Wallet Model
```javascript
{
  userId: ObjectId (ref: User),
  balance: Number,
  transactions: [{
    type: String,
    amount: Number,
    timestamp: Date
  }]
}
```

---

## ⚙️ Configuration Files

### `next.config.mjs`
Next.js configuration for build optimization and environment variables.

### `postcss.config.mjs`
PostCSS configuration for CSS processing.

### `jsconfig.json`
JavaScript project settings and path aliases.

### `eslint.config.mjs`
Code quality and style enforcement rules.

---

## 💡 Usage

### For Users
1. Sign up or log in to your account
2. Navigate to "Book" to browse available parking lots
3. Select a parking lot and available slot
4. Proceed to payment (uses wallet or Razorpay)
5. View bookings in profile
6. Manage wallet top-ups

### For Admins
1. Log in with admin credentials
2. Access admin dashboard
3. Review pending parking lot approval requests
4. Approve or reject requests
5. Monitor system statistics
6. Manage user top-up requests

### Background Jobs
The system runs background workers for:
- Cleaning up expired bookings
- Processing payment queues
- Monitoring system health

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

---

## 📝 License

This project is part of the Smart Booking System coursework at VJTI, Semester 4, Software Engineering.

---

## 📞 Support

For issues, questions, or support, please use the help section in the application or contact through the contact form.

**Last Updated:** December 2025
