// Dashboard Configuration File
// Update this file with your Supabase data to populate the dashboard

export interface DashboardConfig {
  // Data availability flag - set to true when you have data
  hasData: boolean;
  
  // Key Metrics
  callStats: {
    totalCalls: number;
    todayCalls: number;
    avgCallDuration: string;
    successRate: number;
    peakHour: string;
    topCallType: string;
  };
  
  // Weekly Call Data
  weeklyCalls: Array<{
    day: string;
    calls: number;
    duration: number; // in minutes
  }>;
  
  // Call Types Distribution
  callTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  
  // Hourly Distribution
  hourlyData: Array<{
    hour: string;
    calls: number;
  }>;
  
  // Recent Activity
  recentCalls: Array<{
    time: string;
    type: string;
    duration: string;
    status: 'Completed' | 'Transferred' | 'Failed';
  }>;
  
  // Growth Percentages
  growthMetrics: {
    totalCallsGrowth: string;
    todayCallsGrowth: string;
    avgDurationGrowth: string;
    successRateGrowth: string;
  };
}

// Default configuration with sample data
export const defaultDashboardConfig: DashboardConfig = {
  hasData: false, // Set to true when you have real data
  
  callStats: {
    totalCalls: 0,
    todayCalls: 0,
    avgCallDuration: '0m 0s',
    successRate: 0,
    peakHour: 'N/A',
    topCallType: 'N/A'
  },
  
  weeklyCalls: [],
  
  callTypes: [],
  
  hourlyData: [],
  
  recentCalls: [],
  
  growthMetrics: {
    totalCallsGrowth: 'N/A',
    todayCallsGrowth: 'N/A',
    avgDurationGrowth: 'N/A',
    successRateGrowth: 'N/A'
  }
};

// Sample data configuration (for testing)
export const sampleDashboardConfig: DashboardConfig = {
  hasData: true,
  
  callStats: {
    totalCalls: 1247,
    todayCalls: 23,
    avgCallDuration: '4m 32s',
    successRate: 94.2,
    peakHour: '2:00 PM',
    topCallType: 'Appointment Booking'
  },
  
  weeklyCalls: [
    { day: 'Mon', calls: 45, duration: 180 },
    { day: 'Tue', calls: 52, duration: 210 },
    { day: 'Wed', calls: 38, duration: 165 },
    { day: 'Thu', calls: 61, duration: 245 },
    { day: 'Fri', calls: 48, duration: 195 },
    { day: 'Sat', calls: 23, duration: 95 },
    { day: 'Sun', calls: 18, duration: 72 }
  ],
  
  callTypes: [
    { type: 'Appointment Booking', count: 456, percentage: 36.6 },
    { type: 'General Inquiry', count: 312, percentage: 25.0 },
    { type: 'Support Request', count: 234, percentage: 18.8 },
    { type: 'Sales Inquiry', count: 189, percentage: 15.2 },
    { type: 'Complaint', count: 56, percentage: 4.5 }
  ],
  
  hourlyData: [
    { hour: '8 AM', calls: 12 },
    { hour: '9 AM', calls: 28 },
    { hour: '10 AM', calls: 35 },
    { hour: '11 AM', calls: 42 },
    { hour: '12 PM', calls: 38 },
    { hour: '1 PM', calls: 31 },
    { hour: '2 PM', calls: 45 },
    { hour: '3 PM', calls: 39 },
    { hour: '4 PM', calls: 33 },
    { hour: '5 PM', calls: 25 },
    { hour: '6 PM', calls: 18 },
    { hour: '7 PM', calls: 12 }
  ],
  
  recentCalls: [
    { time: '2:34 PM', type: 'Appointment Booking', duration: '3m 45s', status: 'Completed' },
    { time: '2:12 PM', type: 'General Inquiry', duration: '2m 18s', status: 'Completed' },
    { time: '1:58 PM', type: 'Support Request', duration: '5m 12s', status: 'Transferred' },
    { time: '1:45 PM', type: 'Sales Inquiry', duration: '4m 33s', status: 'Completed' },
    { time: '1:32 PM', type: 'Appointment Booking', duration: '2m 56s', status: 'Completed' }
  ],
  
  growthMetrics: {
    totalCallsGrowth: '+12.5%',
    todayCallsGrowth: '+8.2%',
    avgDurationGrowth: '-2.1%',
    successRateGrowth: '+1.3%'
  }
};

// Function to fetch companies from Supabase
export async function fetchCompaniesFromSupabase(): Promise<Array<{id: number, name: string}>> {
  try {
    // Import the adapted database service
    const { createAdaptedDatabaseService } = await import('./adapted-database-service')
    
    // Create adapted database service instance (use company ID 1 as default)
    const dbService = createAdaptedDatabaseService(1)
    
    // Fetch all companies
    const companies = await dbService.getAllCompanies()
    
    return companies.map(company => ({
      id: company.id,
      name: company.name
    }))
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [
      { id: 1, name: 'Company 1' },
      { id: 2, name: 'Company 2' },
      { id: 3, name: 'Company 3' }
    ];
  }
}

// Function to fetch data from Supabase using adapted service
export async function fetchDashboardDataFromSupabase(companyId: number): Promise<DashboardConfig> {
  try {
    // Import the adapted database service
    const { createAdaptedDatabaseService } = await import('./adapted-database-service')
    
    // Create adapted database service instance
    const dbService = createAdaptedDatabaseService(companyId)
    
    // Fetch real-time dashboard data
    const dashboardData = await dbService.getDashboardData()
    
    return dashboardData
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return defaultDashboardConfig;
  }
}

// Helper function to process Supabase data into dashboard config
function processSupabaseData(rawData: any[]): DashboardConfig {
  // TODO: Implement data processing logic
  // This function should take raw Supabase data and format it
  // into the DashboardConfig structure
  
  return defaultDashboardConfig;
}

// Export the current configuration
// Change this to 'sampleDashboardConfig' to see sample data
// Change this to 'defaultDashboardConfig' for empty state
// Change this to result of 'fetchDashboardDataFromSupabase()' for real data
export const currentDashboardConfig = defaultDashboardConfig;
