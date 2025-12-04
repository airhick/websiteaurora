# Dashboard Configuration Guide

This guide explains how to configure your Aurora dashboard with real Supabase data.

## 📁 Configuration File Location

The dashboard configuration is located in: `lib/dashboard-config.ts`

## 🔧 How to Configure Your Dashboard

### 1. **Basic Configuration**

Open `lib/dashboard-config.ts` and modify the `currentDashboardConfig` export at the bottom:

```typescript
// For empty state (no data)
export const currentDashboardConfig = defaultDashboardConfig;

// For sample data (testing)
export const currentDashboardConfig = sampleDashboardConfig;

// For real data (when you implement Supabase integration)
export const currentDashboardConfig = await fetchDashboardDataFromSupabase();
```

### 2. **Manual Data Input**

To manually input your data, modify the `defaultDashboardConfig` object:

```typescript
export const defaultDashboardConfig: DashboardConfig = {
  hasData: true, // Set to true when you have data
  
  callStats: {
    totalCalls: 1247,        // Your total call count
    todayCalls: 23,          // Calls received today
    avgCallDuration: '4m 32s', // Average call duration
    successRate: 94.2,       // Success rate percentage
    peakHour: '2:00 PM',     // Busiest hour
    topCallType: 'Appointment Booking' // Most common call type
  },
  
  weeklyCalls: [
    { day: 'Mon', calls: 45, duration: 180 },
    { day: 'Tue', calls: 52, duration: 210 },
    // ... add your weekly data
  ],
  
  callTypes: [
    { type: 'Appointment Booking', count: 456, percentage: 36.6 },
    { type: 'General Inquiry', count: 312, percentage: 25.0 },
    // ... add your call type data
  ],
  
  hourlyData: [
    { hour: '8 AM', calls: 12 },
    { hour: '9 AM', calls: 28 },
    // ... add your hourly data
  ],
  
  recentCalls: [
    { 
      time: '2:34 PM', 
      type: 'Appointment Booking', 
      duration: '3m 45s', 
      status: 'Completed' 
    },
    // ... add your recent calls
  ],
  
  growthMetrics: {
    totalCallsGrowth: '+12.5%',    // vs last month
    todayCallsGrowth: '+8.2%',      // vs yesterday
    avgDurationGrowth: '-2.1%',    // vs last week
    successRateGrowth: '+1.3%'     // vs last month
  }
};
```

### 3. **Supabase Integration**

To connect to your Supabase database, implement the `fetchDashboardDataFromSupabase()` function:

```typescript
export async function fetchDashboardDataFromSupabase(): Promise<DashboardConfig> {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Fetch call data
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Process and return formatted data
    return processSupabaseData(calls);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return defaultDashboardConfig;
  }
}
```

### 4. **Data Processing**

Implement the `processSupabaseData()` function to transform your raw Supabase data:

```typescript
function processSupabaseData(rawData: any[]): DashboardConfig {
  // Calculate total calls
  const totalCalls = rawData.length;
  
  // Calculate today's calls
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = rawData.filter(call => 
    call.created_at.startsWith(today)
  ).length;
  
  // Calculate average duration
  const avgDuration = rawData.reduce((sum, call) => 
    sum + call.duration_seconds, 0
  ) / totalCalls;
  
  // Calculate success rate
  const successfulCalls = rawData.filter(call => 
    call.status === 'completed'
  ).length;
  const successRate = (successfulCalls / totalCalls) * 100;
  
  // Group by call type
  const callTypeGroups = rawData.reduce((groups, call) => {
    const type = call.call_type || 'Unknown';
    groups[type] = (groups[type] || 0) + 1;
    return groups;
  }, {});
  
  const callTypes = Object.entries(callTypeGroups).map(([type, count]) => ({
    type,
    count: count as number,
    percentage: ((count as number) / totalCalls) * 100
  }));
  
  // Group by hour
  const hourlyGroups = rawData.reduce((groups, call) => {
    const hour = new Date(call.created_at).getHours();
    const hourStr = `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
    groups[hourStr] = (groups[hourStr] || 0) + 1;
    return groups;
  }, {});
  
  const hourlyData = Object.entries(hourlyGroups).map(([hour, calls]) => ({
    hour,
    calls: calls as number
  }));
  
  // Get recent calls
  const recentCalls = rawData.slice(0, 5).map(call => ({
    time: new Date(call.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    type: call.call_type || 'Unknown',
    duration: `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`,
    status: call.status === 'completed' ? 'Completed' : 
            call.status === 'transferred' ? 'Transferred' : 'Failed'
  }));
  
  return {
    hasData: true,
    callStats: {
      totalCalls,
      todayCalls,
      avgCallDuration: `${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s`,
      successRate: Math.round(successRate * 10) / 10,
      peakHour: '2:00 PM', // Calculate from hourly data
      topCallType: callTypes[0]?.type || 'N/A'
    },
    weeklyCalls: [], // Calculate from raw data
    callTypes,
    hourlyData,
    recentCalls,
    growthMetrics: {
      totalCallsGrowth: '+12.5%', // Calculate from historical data
      todayCallsGrowth: '+8.2%',
      avgDurationGrowth: '-2.1%',
      successRateGrowth: '+1.3%'
    }
  };
}
```

## 📊 Dashboard Features

### **Key Metrics Cards**
- Total Calls
- Today's Calls  
- Average Duration
- Success Rate

### **Charts & Graphs**
- **Weekly Call Volume**: Line chart showing daily call trends
- **Call Types Distribution**: Pie chart with call categories
- **Hourly Distribution**: Bar chart showing peak calling times
- **Recent Activity**: List of latest calls with status

### **No Data States**
When `hasData: false`, the dashboard shows:
- "No Data Available" messages
- Helpful icons and descriptions
- Empty state designs

## 🚀 Quick Start

1. **For Testing**: Set `currentDashboardConfig = sampleDashboardConfig`
2. **For Empty State**: Set `currentDashboardConfig = defaultDashboardConfig`
3. **For Real Data**: Implement Supabase integration and set `currentDashboardConfig = await fetchDashboardDataFromSupabase()`

## 📝 Data Format Requirements

### Call Records
Your Supabase `calls` table should have these fields:
- `id`: Unique identifier
- `created_at`: Timestamp
- `duration_seconds`: Call duration in seconds
- `call_type`: Type of call (e.g., 'Appointment Booking')
- `status`: Call status ('completed', 'transferred', 'failed')

### Example Supabase Table Structure
```sql
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL,
  call_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'transferred', 'failed')),
  caller_phone TEXT,
  notes TEXT
);
```

## 🔄 Real-time Updates

To enable real-time updates, you can:
1. Use Supabase Realtime subscriptions
2. Implement periodic data fetching
3. Add manual refresh buttons
4. Use WebSocket connections

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All screen sizes

## 🎨 Customization

You can customize:
- Colors and themes
- Chart types and styles
- Data refresh intervals
- Display formats
- Additional metrics

---

**Need Help?** Check the dashboard configuration file for detailed examples and implementation guidance.
