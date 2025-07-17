# Budget Buddy - Personal Finance Backend API

A comprehensive backend API for Budget Buddy, a personal finance management application built with Supabase Edge Functions.

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login with email/password
- JWT-based authentication with Supabase Auth
- Secure session handling
- User profile management

### 💰 Transaction Management
- Full CRUD operations for income and expense tracking
- Advanced filtering and sorting capabilities
- Category-based organization
- Monthly and yearly aggregations

### 🧮 Budget Planning
- Create and manage budgets by category
- Monthly and yearly budget periods
- Real-time spending tracking against budgets
- Overspending alerts and warnings

### 📊 Analytics & Insights
- Monthly spending and income summaries
- Category-wise spending breakdowns
- Net savings calculations and trends
- Comprehensive dashboard data

### 🤖 AI-Powered Financial Suggestions
- OpenAI integration for personalized financial advice
- Spending pattern analysis
- Budget optimization recommendations
- Automated financial insights

### 🔔 Notification System
- Budget overspending alerts
- Monthly financial reports
- Activity reminders for inactive users
- Email notification templates

## 🛠 Tech Stack

- **Runtime**: Deno with Supabase Edge Functions
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini
- **Email**: Ready for integration with SendGrid/Resend
- **Security**: Row Level Security (RLS) policies

## 📁 API Endpoints

### Authentication (`/functions/v1/auth`)
```
POST /register    - Register new user
POST /login       - User login
POST /logout      - User logout
GET  /profile     - Get user profile
```

### Transactions (`/functions/v1/transactions`)
```
GET    /                    - Get all transactions (with filters)
POST   /                    - Create new transaction
GET    /:id                 - Get specific transaction
PUT    /:id                 - Update transaction
DELETE /:id                 - Delete transaction
```

### Budgets (`/functions/v1/budgets`)
```
GET    /                    - Get all budgets
POST   /                    - Create new budget
GET    /summary             - Get budget summary with spending
GET    /:id                 - Get specific budget
PUT    /:id                 - Update budget
DELETE /:id                 - Delete budget
```

### Analytics (`/functions/v1/analytics`)
```
GET /monthly        - Monthly spending and income summary
GET /categories     - Spending breakdown by category
GET /net-savings    - Net savings analysis with trends
GET /dashboard      - Comprehensive dashboard data
```

### AI Suggestions (`/functions/v1/ai-suggestions`)
```
POST /              - Generate AI financial suggestions
GET  /              - Get stored suggestions
```

### Categories (`/functions/v1/categories`)
```
GET    /            - Get all categories
POST   /            - Create custom category
GET    /:id         - Get specific category
PUT    /:id         - Update category
DELETE /:id         - Delete category
```

### Notifications (`/functions/v1/notifications`)
```
POST /budget-alerts      - Check and send budget alerts
POST /monthly-report     - Generate monthly report
POST /activity-reminder  - Send activity reminders
```

## 🗄 Database Schema

### Core Tables
- **profiles** - User profile information
- **categories** - Income and expense categories
- **transactions** - Financial transactions
- **budgets** - Budget limits by category
- **ai_suggestions** - AI-generated financial advice

### Key Features
- Row Level Security (RLS) on all tables
- Automatic timestamps with triggers
- Foreign key constraints for data integrity
- Optimized indexes for performance
- Default categories pre-populated

## 🔒 Security Features

- JWT authentication with Supabase
- Row Level Security policies
- User data isolation
- Input validation and sanitization
- CORS headers configured
- Environment variable protection

## 📊 Query Parameters & Filters

### Transactions
- `type` - Filter by income/expense
- `category` - Filter by category ID
- `start_date` / `end_date` - Date range filtering
- `limit` / `offset` - Pagination

### Analytics
- `year` / `month` - Time period filtering
- `period` - monthly/yearly/all-time
- `type` - income/expense for category analysis

### Budgets
- `period` - monthly/yearly
- `year` / `month` - Specific time period

## 🚀 Deployment

The backend is deployed as Supabase Edge Functions, providing:
- Global edge deployment
- Automatic scaling
- Built-in monitoring
- Environment variable management

## 🔧 Environment Variables

Required environment variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key (optional)
```

## 📈 Performance Optimizations

- Database indexes on frequently queried columns
- Efficient aggregation queries
- Pagination support
- Caching strategies for AI suggestions
- Optimized RLS policies

## 🧪 Testing

The API includes comprehensive error handling and validation:
- Input validation for all endpoints
- Proper HTTP status codes
- Detailed error messages
- Authentication checks
- Data integrity validation

## 🔄 Future Enhancements

- Multi-currency support
- Shared household budgets
- Export functionality (CSV/PDF)
- Push notifications
- Advanced analytics
- Machine learning insights
- Recurring transaction automation

## 📝 Usage Examples

### Create Transaction
```javascript
const response = await fetch('/functions/v1/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Grocery Shopping',
    amount: 85.50,
    type: 'expense',
    category_id: 'category-uuid',
    date: '2024-01-15',
    notes: 'Weekly groceries'
  })
})
```

### Get Analytics
```javascript
const response = await fetch('/functions/v1/analytics/monthly?year=2024&month=1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Generate AI Suggestions
```javascript
const response = await fetch('/functions/v1/ai-suggestions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

This backend provides a robust, scalable foundation for the Budget Buddy personal finance application with comprehensive features for modern financial management.