# Aurora Dashboard - Database Integration Setup Guide

## 🎯 Overview

This guide will help you set up the Aurora Dashboard with full database integration, real-time analytics, and comprehensive data tools. The system now includes:

- **Real-time data fetching** from Supabase
- **Advanced analytics engine** with calculations and insights
- **Data manipulation tools** for export, import, and reporting
- **Comprehensive database schema** for call analytics
- **Performance metrics** and predictive analytics

## 🚀 Quick Start

### 1. Database Setup

First, you need to set up your Supabase database with the provided schema:

```bash
# Connect to your Supabase database and run the schema
psql "postgresql://postgres.dkgkqcngqqknyznrsmnx:Lee7wak123@@aws-1-eu-west-2.pooler.supabase.com:6543/postgres" -f database-schema.sql
```

### 2. Environment Configuration

Your `.env.local` file is already configured with the new database URL:

```env
# Direct Postgres (server-only)
DATABASE_URL=postgresql://postgres.dkgkqcngqqknyznrsmnx:Lee7wak123@@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## 📊 Database Schema

The database includes the following tables:

### Core Tables
- **`users`** - User profiles and authentication data
- **`call_sessions`** - Individual call records
- **`call_interactions`** - Detailed conversation tracking
- **`call_outcomes`** - Call results and outcomes

### Analytics Tables
- **`daily_metrics`** - Aggregated daily statistics
- **`hourly_metrics`** - Hour-by-hour analytics
- **`weekly_metrics`** - Weekly aggregations and growth metrics

### Key Features
- **Row Level Security (RLS)** - Users can only access their own data
- **Automatic calculations** - Triggers and functions for real-time metrics
- **Performance indexes** - Optimized for fast queries
- **Data validation** - Constraints and checks for data integrity

## 🔧 API Services

### Database Service (`lib/database-service.ts`)

The main service for all database operations:

```typescript
import { createDatabaseService } from '@/lib/database-service'

const dbService = createDatabaseService(userId)

// Create a call session
const session = await dbService.createCallSession({
  phone_number: '+1-555-0123',
  call_type: 'appointment_booking',
  status: 'completed'
})

// Get dashboard data
const dashboardData = await dbService.getDashboardData()

// Generate test data
const testSessions = await dbService.generateTestData()
```

### Calculations Engine (`lib/calculations-engine.ts`)

Advanced analytics and calculations:

```typescript
import { createCalculationsEngine } from '@/lib/calculations-engine'

const engine = createCalculationsEngine(dbService)

// Get comprehensive analytics
const analytics = await engine.calculateAnalytics('week')

// Performance metrics
const performance = await engine.calculatePerformanceMetrics()

// Predictive analytics
const forecast = await engine.calculatePredictiveAnalytics()
```

### Data Tools (`lib/data-tools.ts`)

Data manipulation and reporting tools:

```typescript
import { createDataTools } from '@/lib/data-tools'

const tools = createDataTools(dbService, calculationsEngine)

// Export data
const csvData = await tools.exportCallData({
  format: 'csv',
  dateRange: { start: new Date(), end: new Date() },
  includeInteractions: true
})

// Generate reports
const report = await tools.generateReport({
  name: 'Weekly Report',
  timeRange: 'week',
  format: 'html'
})

// Data quality validation
const quality = await tools.validateDataQuality()
```

## 📈 Dashboard Features

### Real-time Metrics
- **Total Calls** - All-time call count
- **Today's Calls** - Current day statistics
- **Average Duration** - Mean call length
- **Success Rate** - Percentage of completed calls
- **Peak Hour** - Busiest time of day
- **Top Call Type** - Most common call category

### Visualizations
- **Weekly Call Volume** - Line chart showing daily trends
- **Call Types Distribution** - Pie chart of call categories
- **Hourly Distribution** - Bar chart of call patterns
- **Recent Activity** - Live feed of recent calls

### Growth Metrics
- **Call Volume Growth** - Week-over-week comparison
- **Duration Trends** - Average call length changes
- **Success Rate Changes** - Performance improvements
- **Satisfaction Trends** - Customer experience metrics

## 🧪 Testing

### Run Integration Tests

```bash
# Run the comprehensive test suite
npx ts-node test-integration.ts
```

The test suite includes:
- ✅ User management
- ✅ Test data generation
- ✅ Dashboard data fetching
- ✅ Analytics calculations
- ✅ Performance metrics
- ✅ Predictive analytics
- ✅ Data quality validation
- ✅ Call pattern analysis
- ✅ Data export
- ✅ Report generation

### Manual Testing

1. **Login** to the dashboard
2. **Generate test data** using the test interface
3. **View real-time metrics** updating automatically
4. **Export data** in various formats
5. **Generate reports** for analysis

## 🔍 Monitoring & Analytics

### Key Performance Indicators (KPIs)

1. **Call Volume**
   - Total calls processed
   - Daily/weekly/monthly trends
   - Peak usage patterns

2. **Success Metrics**
   - Completion rate
   - Transfer rate
   - Failure analysis

3. **Customer Experience**
   - Satisfaction scores
   - Average duration
   - Resolution time

4. **System Performance**
   - Response times
   - Efficiency metrics
   - Capacity utilization

### Insights & Recommendations

The system automatically generates insights based on your data:

- **Performance Alerts** - When metrics fall below thresholds
- **Trend Analysis** - Identifying patterns and changes
- **Capacity Planning** - Forecasting future needs
- **Optimization Suggestions** - Improving efficiency

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check environment variables
   echo $DATABASE_URL
   
   # Test connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Permission Errors**
   - Ensure RLS policies are properly configured
   - Check user authentication status
   - Verify database permissions

3. **Data Loading Issues**
   - Check network connectivity
   - Verify Supabase service status
   - Review error logs in browser console

### Debug Mode

Enable debug logging:

```typescript
// In your environment
DEBUG=true npm run dev
```

## 📚 API Reference

### Database Service Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `createCallSession` | Create new call record | `sessionData: Partial<CallSession>` |
| `updateCallSession` | Update existing call | `sessionId: string, updates: Partial<CallSession>` |
| `getDashboardData` | Get complete dashboard data | None |
| `getRecentCalls` | Get latest calls | `limit?: number` |
| `calculateDailyMetrics` | Calculate daily statistics | `date?: Date` |
| `generateTestData` | Create sample data | None |

### Calculations Engine Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `calculateAnalytics` | Comprehensive analytics | `timeRange: 'day' \| 'week' \| 'month'` |
| `calculatePerformanceMetrics` | Performance analysis | None |
| `calculatePredictiveAnalytics` | Forecasting | None |
| `calculateRealTimeMetrics` | Live metrics | None |

### Data Tools Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `exportCallData` | Export data | `options: DataExportOptions` |
| `importCallData` | Import data | `data: any[], options: DataImportOptions` |
| `generateReport` | Create reports | `config: ReportConfig` |
| `validateDataQuality` | Quality check | None |
| `analyzeCallPatterns` | Pattern analysis | `timeRange: 'day' \| 'week' \| 'month'` |

## 🚀 Production Deployment

### Environment Setup

1. **Production Database**
   - Use production Supabase instance
   - Configure proper RLS policies
   - Set up monitoring and alerts

2. **Security**
   - Enable HTTPS
   - Configure CORS properly
   - Set up rate limiting

3. **Performance**
   - Enable database connection pooling
   - Configure caching strategies
   - Set up CDN for static assets

### Monitoring

- **Database Performance** - Monitor query performance
- **API Response Times** - Track service latency
- **Error Rates** - Monitor failure rates
- **User Activity** - Track usage patterns

## 📞 Support

For technical support or questions:

1. **Check the logs** - Review browser console and server logs
2. **Run diagnostics** - Use the test integration script
3. **Review documentation** - Check this guide and code comments
4. **Database queries** - Use Supabase dashboard for direct queries

---

## 🎉 Congratulations!

Your Aurora Dashboard is now fully integrated with:
- ✅ Real-time database connectivity
- ✅ Advanced analytics engine
- ✅ Comprehensive data tools
- ✅ Automated calculations
- ✅ Performance monitoring
- ✅ Data quality validation

The system is ready for production use and will automatically scale with your call volume!
