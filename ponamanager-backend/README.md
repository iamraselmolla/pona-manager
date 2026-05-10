# PonaTrack - Shrimp Seed (Pona/PL) ERP & Order Management System

A complete mobile ERP application for managing shrimp seed trading business with comprehensive order management, delivery tracking, payment processing, and financial reporting.

## 📱 Features

### Core Modules
- **Authentication**: Secure login with JWT
- **Customer Management**: Track all customer information and history
- **Order Management**: Create and manage shrimp seed orders (Golda, Bagda, Vannamei)
- **Delivery Management**: Record deliveries with quantity and mir calculations
- **Expense Tracking**: Manage daily business expenses by category
- **Daily Closing**: Close business day with complete financial summary
- **Reports**: Comprehensive daily/monthly reports with profit/loss analysis
- **Notifications**: Real-time alerts for due, deliveries, and closing reminders
- **Offline Support**: Full offline functionality with SQLite sync

### Business Metrics
- **Pona Type Tracking**: Golda PL, Bagda PL, Vannamei PL analytics
- **Mir Calculations**: Company mir and counting mir tracking
- **Commission Tracking**: Company commission and received commission
- **Monthly Reports**: Complete monthly business summary with all metrics
- **Profit/Loss Analysis**: Detailed P&L statements
- **Customer Due Reports**: Track outstanding customer payments
- **Expense Analysis**: Categorized expense tracking

## 🏗️ Tech Stack

### Frontend
- React Native with Expo
- TypeScript for type safety
- React Navigation for routing
- Zustand for state management
- Zod for validation
- SQLite for offline database
- React Hook Form for forms
- Axios for API calls
- NativeWind for styling
- Charts with react-native-chart-kit

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Helmet for security
- CORS enabled
- Rate limiting
- Morgan for logging

## 📁 Project Structure

```
ponatrack-frontend/
├── src/
│   ├── screens/        # All screen components
│   │   ├── auth/       # Login, splash
│   │   ├── dashboard/  # Main dashboard
│   │   ├── customers/  # Customer management
│   │   ├── orders/     # Order management
│   │   ├── delivery/   # Delivery tracking
│   │   ├── expenses/   # Expense management
│   │   ├── closing/    # Daily closing
│   │   ├── reports/    # Monthly/daily reports
│   │   ├── notifications/
│   │   └── settings/
│   ├── components/     # Reusable components
│   ├── navigation/     # Route definitions
│   ├── store/          # Zustand stores
│   ├── api/            # API service
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript types
│   └── constants/      # App constants
├── App.tsx
└── package.json

ponatrack-backend/
├── src/
│   ├── routes/         # API routes
│   │   ├── auth.ts
│   │   ├── customer.ts
│   │   ├── order.ts
│   │   ├── delivery.ts
│   │   ├── expense.ts
│   │   ├── dailyClosing.ts
│   │   ├── report.ts
│   │   ├── notification.ts
│   │   └── dashboard.ts
│   ├── middleware/     # Authentication
│   ├── services/       # Business logic
│   ├── index.ts        # Express app setup
├── prisma/
│   └── schema.prisma   # Database schema
├── .env.example
├── DEPLOYMENT.md
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn
- Expo CLI for mobile

### Frontend Setup
```bash
cd ponatrack-frontend
npm install
npx expo start
```

Press `a` for Android or `i` for iOS.

### Backend Setup
```bash
cd ponatrack-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Server will start at `http://localhost:5000`

## 📊 Monthly Report Example

The monthly report includes:
- **গলদা পোনা (Golda PL)**: Total PL, Sales, Profit
- **বাগদা পোনা (Bagda PL)**: Total PL, Sales, Profit  
- **ভানামেই পোনা (Vannamei PL)**: Total PL, Sales, Profit
- **খরচ (Expenses)**: Total expenses by category
- **কমিশন (Commission)**: Company commission & received
- **মীর (Mir)**: Company mir & counting mir
- **লাভ (Profit)**: Total monthly profit

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Helmet security headers
- SQL injection prevention (Prisma)
- Input validation with Zod

## 📱 Mobile App Features

- **Offline First**: Works completely offline with SQLite
- **Auto Sync**: Syncs data when online
- **Fast Performance**: Optimized React Native code
- **Dark Mode**: Optional dark theme
- **Bengali Support**: Full Bengali UI support
- **Auto Calculations**: Smart order/delivery calculations
- **Customer Lookup**: Quick customer search
- **Notification Alerts**: Push notifications

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/login              - User login
POST   /api/auth/register           - User registration
GET    /api/auth/profile            - Get user profile
```

### Customers
```
GET    /api/customers               - List all customers
GET    /api/customers/:id           - Get customer details
GET    /api/customers/mobile/:mobile - Search by mobile
POST   /api/customers               - Create customer
PUT    /api/customers/:id           - Update customer
DELETE /api/customers/:id           - Delete customer
GET    /api/customers/:id/orders    - Get customer orders
GET    /api/customers/:id/payments  - Get customer payments
```

### Orders
```
GET    /api/orders                  - List all orders
GET    /api/orders/:id              - Get order details
POST   /api/orders                  - Create order
PUT    /api/orders/:id              - Update order
PATCH  /api/orders/:id/cancel       - Cancel order
```

### Deliveries
```
GET    /api/deliveries              - List deliveries
GET    /api/deliveries/:id          - Get delivery details
POST   /api/deliveries              - Record delivery
PUT    /api/deliveries/:id          - Update delivery
```

### Expenses
```
GET    /api/expenses                - List expenses
POST   /api/expenses                - Add expense
PUT    /api/expenses/:id            - Update expense
DELETE /api/expenses/:id            - Delete expense
```

### Reports
```
GET    /api/reports/daily?date=     - Daily report
GET    /api/reports/monthly?month=  - Monthly report
GET    /api/reports/customer-due    - Customer due report
GET    /api/reports/expense         - Expense report
GET    /api/reports/profit-loss     - Profit/loss report
```

### Dashboard
```
GET    /api/dashboard/stats         - Dashboard statistics
```

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `customers` - Customer information
- `orders` - Order records
- `deliveries` - Delivery records
- `payments` - Payment records
- `expenses` - Daily expenses
- `daily_closings` - End-of-day summaries
- `monthly_reports` - Monthly business summaries
- `notifications` - System notifications

## 🚀 Deployment

### Mobile App
```bash
# Build Android APK
eas build --platform android

# Build iOS app
eas build --platform ios
```

### Backend
```bash
# Railway
railway up

# Docker
docker build -t ponatrack .
docker run -p 5000:5000 ponatrack

# Traditional VPS
npm run build
npm start
```

See `DEPLOYMENT.md` for detailed deployment options.

## 📱 Login Credentials (Development)

```
Email: admin@ponatrack.com
Password: admin123
```

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Open a pull request

## 📄 License

MIT License

## 📞 Support

For support, email support@ponatrack.com or create an issue in the repository.

---

**PonaTrack** - Complete Shrimp Seed Business Management Solution 🐟
