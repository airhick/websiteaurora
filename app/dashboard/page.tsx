'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { fetchDashboardDataFromSupabase, fetchCompaniesFromSupabase, DashboardConfig } from '@/lib/dashboard-config'

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [companyId, setCompanyId] = useState<number>(1) // Default to company ID 1
  const [companies, setCompanies] = useState<Array<{id: number, name: string}>>([])
  const [companyLoading, setCompanyLoading] = useState(true)
  
  // AI Call Test Feature States
  const [showCallTest, setShowCallTest] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<any>(null)
  const [callTestLoading, setCallTestLoading] = useState(false)
  const [callStatus, setCallStatus] = useState('')
  const [isCallActive, setIsCallActive] = useState(false)
  const [vapiInstance, setVapiInstance] = useState<any>(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Dashboard configuration from real-time data
  const config = dashboardConfig
  const hasData = config?.hasData || false
  const callStats = config?.callStats || {
    totalCalls: 0,
    todayCalls: 0,
    avgCallDuration: '0m 0s',
    successRate: 0,
    peakHour: 'N/A',
    topCallType: 'N/A'
  }
  const weeklyCalls = config?.weeklyCalls || []
  const callTypes = config?.callTypes || []
  const hourlyData = config?.hourlyData || []
  const recentCalls = config?.recentCalls || []
  const growthMetrics = config?.growthMetrics || {
    totalCallsGrowth: 'N/A',
    todayCallsGrowth: 'N/A',
    avgDurationGrowth: 'N/A',
    successRateGrowth: 'N/A'
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        window.location.href = '/'
      } else {
        // Fetch companies and dashboard data when session is available
        loadCompanies()
        loadDashboardData(companyId)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        window.location.href = '/'
      } else {
        // Fetch companies and dashboard data when session changes
        loadCompanies()
        loadDashboardData(companyId)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  // Separate useEffect for Google Maps - wait for component to render
  useEffect(() => {
    // Wait for the component to fully render before loading Google Maps
    const timer = setTimeout(() => {
      if (!window.googleMapsLoaded) {
        loadGoogleMapsAPI()
      }
    }, 1000) // Wait 1 second for component to render

    return () => clearTimeout(timer)
  }, [])


  // Function to load companies
  const loadCompanies = async () => {
    try {
      setCompanyLoading(true)
      console.log('🔄 Loading companies...')
      const companiesData = await fetchCompaniesFromSupabase()
      console.log('🏢 Companies loaded:', companiesData)
      setCompanies(companiesData)
      
      // Set default company to first one if available
      if (companiesData.length > 0 && companyId === 1) {
        setCompanyId(companiesData[0].id)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setCompanyLoading(false)
    }
  }

  // Function to load dashboard data
  const loadDashboardData = async (companyId: number) => {
    try {
      setDataLoading(true)
      console.log(`🔄 Loading dashboard data for company ID: ${companyId}`)
      const config = await fetchDashboardDataFromSupabase(companyId)
      console.log('📊 Dashboard data loaded:', config)
      setDashboardConfig(config)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Load Google Maps API - prevent multiple loads
  const loadGoogleMapsAPI = () => {
    if (typeof window !== 'undefined') {
      // Prevent multiple loads
      if (window.googleMapsLoaded) {
        console.log('✅ Google Maps API already loaded (prevented duplicate)')
        return
      }

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps API already loaded')
        window.googleMapsLoaded = true
        setTimeout(() => initGoogleMaps(), 100)
        return
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('⏳ Google Maps script already exists, waiting for load...')
        // Wait for the script to load
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            console.log('✅ Google Maps API loaded after waiting')
            window.googleMapsLoaded = true
            initGoogleMaps()
          } else {
            setTimeout(checkGoogleMaps, 200)
          }
        }
        checkGoogleMaps()
        return
      }

      console.log('🔄 Loading Google Maps API...')
      
      // Create a unique callback name to avoid conflicts
      const callbackName = `initGoogleMaps_${Date.now()}`
      window[callbackName] = () => {
        console.log('✅ Google Maps API loaded via callback')
        window.googleMapsLoaded = true
        initGoogleMaps()
        // Clean up the callback
        delete window[callbackName]
      }
      
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC1zqymSXocGXuCEVvpzXERWYwIzimV0Oo&libraries=places&callback=${callbackName}`
      script.async = true
      script.defer = true
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps API:', error)
        console.error('Script src:', script.src)
      }
      script.onload = () => {
        console.log('📦 Google Maps script loaded')
      }
      
      document.head.appendChild(script)
      console.log('📤 Google Maps script added to head')
    }
  }

  // Initialize Google Maps Autocomplete - prevent multiple initializations
  const initGoogleMaps = () => {
    console.log('🔧 Initializing Google Maps Autocomplete...')
    
    // Prevent multiple initializations
    if (window.googleMapsInitialized) {
      console.log('✅ Google Maps Autocomplete already initialized (prevented duplicate)')
      return
    }
    
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      // Wait for the input element to be available
      const waitForInput = () => {
        const input = document.getElementById('businessSearch') as HTMLInputElement
        if (input) {
          console.log('✅ Found business search input, setting up autocomplete')
          
          try {
            const autocomplete = new window.google.maps.places.Autocomplete(input, {
              types: ['establishment'],
              fields: ['place_id', 'name', 'formatted_address', 'formatted_phone_number', 
                       'website', 'types', 'opening_hours', 'url']
            })

            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace()
              console.log('📍 Place selected:', place)
              
              if (place.place_id) {
                setSelectedPlace(place)
                console.log('✅ Place set in state:', place.name)
              } else {
                console.warn('⚠️ No place_id found for selected place')
              }
            })
            
            console.log('✅ Google Maps Autocomplete initialized successfully')
            window.googleMapsInitialized = true
            setGoogleMapsLoaded(true)
            
          } catch (error) {
            console.error('❌ Error initializing autocomplete:', error)
          }
        } else {
          console.log('⏳ Business search input not found yet, waiting...')
          // Try again in a bit, but limit retries
          if (!window.googleMapsRetryCount) {
            window.googleMapsRetryCount = 0
          }
          if (window.googleMapsRetryCount < 5) {
            window.googleMapsRetryCount++
            setTimeout(() => {
              console.log(`🔄 Retrying to find business search input... (attempt ${window.googleMapsRetryCount})`)
              waitForInput()
            }, 500)
          } else {
            console.error('❌ Max retries reached for Google Maps initialization')
          }
        }
      }
      
      waitForInput()
    } else {
      console.error('❌ Google Maps API not available')
      console.log('Available:', {
        window: typeof window !== 'undefined',
        google: typeof window !== 'undefined' && !!window.google,
        maps: typeof window !== 'undefined' && !!window.google?.maps,
        places: typeof window !== 'undefined' && !!window.google?.maps?.places
      })
    }
  }

  // Handle AI call test
  const handleAICallTest = async () => {
    if (!selectedPlace || !selectedPlace.place_id) {
      alert('Please select a business from the autocomplete dropdown')
      return
    }

    setShowCallTest(true)
    setCallTestLoading(true)
    setCallStatus('Setting up AI assistant...')

    try {
      // Prepare business data
      const businessData = {
        place_id: selectedPlace.place_id,
        name: selectedPlace.name || '',
        address: selectedPlace.formatted_address || '',
        phone: selectedPlace.formatted_phone_number || '',
        website: selectedPlace.website || selectedPlace.url || '',
        types: selectedPlace.types ? selectedPlace.types.join(', ') : '',
        opening_hours: selectedPlace.opening_hours ? 
          selectedPlace.opening_hours.weekday_text ? 
          selectedPlace.opening_hours.weekday_text.join(' | ') : '' : '',
        opening_now: selectedPlace.opening_hours?.isOpen() ? 'oui' : 'non',
        maps_url: selectedPlace.url || `https://www.google.com/maps/place/?q=place_id:${selectedPlace.place_id}`
      }

      console.log('📤 Sending to webhook:', businessData)
      setCallStatus('Creating AI assistant...')

      // Send to n8n webhook via API route (server-side proxy to avoid CORS)
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessData)
      })

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`)
      }

      setCallStatus('Processing assistant data...')
      const assistantData = await response.json()
      console.log('📥 Received webhook response:', assistantData)
      console.log('📋 Full response structure:', JSON.stringify(assistantData, null, 2))

      // Extract assistant ID from response - match the working HTML logic exactly
      const assistantId = assistantData.id || assistantData[0]?.id
      
      if (!assistantId) {
        console.error('❌ No assistant ID found in response:', assistantData)
        throw new Error('No assistant ID received from webhook')
      }
      
      console.log('🎯 Attempting to use assistant ID:', assistantId)
      console.log('⚠️ NOTE: This ID must be from Vapi Assistant API, not Session API')

      console.log('🚀 Starting call with assistant ID:', assistantId)

      // Start Vapi call
      setCallStatus('Initializing call...')
      await startVapiCall(assistantId)

    } catch (error: any) {
      console.error('Error:', error)
      setCallStatus('Error: ' + (error?.message || 'Unknown error'))
      setCallTestLoading(false)
    }
  }

  // Start Vapi call
  const startVapiCall = async (assistantId: string) => {
    try {
      console.log('🎯 Starting Vapi call with assistant ID:', assistantId)
      console.log('🔍 Assistant ID type:', typeof assistantId)
      console.log('🔍 Assistant ID length:', assistantId.length)
      
      // Load Vapi Web SDK if not already loaded - using script tag like working HTML
      if (!window.Vapi) {
        console.log('📦 Loading Vapi Web SDK via script tag (like working HTML)...')
        
        // Check if Vapi script is already in DOM
        const existingScript = document.querySelector('script[src*="vapi-ai/web"]')
        if (existingScript) {
          console.log('⚠️ Vapi script tag already exists in DOM, removing it first')
          existingScript.remove()
        }
        
        // Try multiple CDN sources with fallback
        const cdnSources = [
          'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js',
          'https://unpkg.com/@vapi-ai/web@latest/dist/index.js',
          'https://cdn.jsdelivr.net/npm/@vapi-ai/web@2.5.0/dist/index.js',
          'https://unpkg.com/@vapi-ai/web@2.5.0/dist/index.js'
        ]
        
        let loaded = false
        
        for (let i = 0; i < cdnSources.length && !loaded; i++) {
          try {
            console.log(`🔄 Trying CDN source ${i + 1}: ${cdnSources[i]}`)
            
            // Create fresh script tag for each attempt
            const script = document.createElement('script')
            script.src = cdnSources[i]
            script.async = true
            script.crossOrigin = 'anonymous'
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.log(`⏰ Timeout for source ${i + 1}`)
                document.head.removeChild(script)
                reject(new Error('Vapi Web SDK loading timeout'))
              }, 15000) // Increased to 15 seconds
              
              script.onload = () => {
                clearTimeout(timeout)
                console.log(`✅ Vapi Web SDK script ${i + 1} loaded`)
                
                // Check if Vapi is available
                const checkVapi = () => {
                  if (window.Vapi) {
                    console.log('✅ Vapi constructor available:', typeof window.Vapi)
                    loaded = true
                    resolve(true)
                  } else {
                    console.log('⏳ Waiting for Vapi to be available...')
                    setTimeout(() => {
                      if (window.Vapi) {
                        console.log('✅ Vapi constructor available after delay:', typeof window.Vapi)
                        loaded = true
                        resolve(true)
                      } else {
                        document.head.removeChild(script)
                        reject(new Error('Vapi not available after script load'))
                      }
                    }, 2000) // Increased wait time
                  }
                }
                checkVapi()
              }
              
              script.onerror = (error) => {
                clearTimeout(timeout)
                console.error(`❌ Vapi Web SDK source ${i + 1} failed:`, error)
                document.head.removeChild(script)
                reject(error)
              }
              
              document.head.appendChild(script)
            })
            
          } catch (error: any) {
            console.log(`❌ CDN source ${i + 1} failed:`, error.message)
            if (i === cdnSources.length - 1) {
              throw new Error('All Vapi CDN sources failed to load')
            }
          }
        }
        
      } else {
        console.log('✅ Vapi Web SDK already loaded')
      }

      // Initialize Vapi instance
      console.log('🔧 Initializing Vapi instance...')
      console.log('🔑 Using Vapi API key: bcaecdb0-dcb7-4301-b524-1ff6a18373ce')
      console.log('🔍 Vapi constructor available:', typeof window.Vapi)
      
      let vapi: any
      
      try {
        vapi = new window.Vapi('bcaecdb0-dcb7-4301-b524-1ff6a18373ce')
        console.log('✅ Vapi instance created successfully')
        setVapiInstance(vapi)
        setIsCallActive(true)
        setCallStatus('Connecting to assistant...')
      } catch (vapiError: any) {
        console.error('❌ Error creating Vapi instance:', vapiError)
        throw vapiError
      }

      // Set up event listeners
      vapi.on('call-start', () => {
        console.log('📞 Call started')
        setCallStatus('Call in progress...')
        setCallTestLoading(false)
      })
      
      vapi.on('call-end', () => {
        console.log('📞 Call ended')
        setCallStatus('Call ended')
        setIsCallActive(false)
        setCallTestLoading(false)
        setTimeout(() => {
          setShowCallTest(false)
          setCallStatus('')
        }, 2000)
      })
      
      vapi.on('speech-start', () => {
        console.log('🎤 Assistant speaking')
        setCallStatus('Assistant speaking...')
      })
      
      vapi.on('speech-end', () => {
        console.log('🎤 Assistant stopped speaking')
        setCallStatus('Listening...')
      })
      
      vapi.on('error', (error: any) => {
        console.error('❌ Vapi error:', error)
        setCallStatus('Error: ' + (error?.message || 'Unknown error'))
        setIsCallActive(false)
        setCallTestLoading(false)
      })

      // Start the call
      console.log('🚀 Starting call with assistant:', assistantId)
      console.log('🔍 About to call vapi.start() with:', {
        assistantId: assistantId,
        type: typeof assistantId,
        length: assistantId.length
      })
      console.log('🔍 Vapi instance:', vapi)
      console.log('🔍 Vapi.start method:', typeof vapi.start)
      
      try {
        console.log('📞 Calling vapi.start()...')
        await vapi.start(assistantId)
        console.log('✅ vapi.start() called successfully')
      } catch (startError: any) {
        console.error('❌ Error in vapi.start():', startError)
        console.error('❌ Start error details:', {
          message: startError?.message,
          stack: startError?.stack,
          name: startError?.name
        })
        throw startError
      }

    } catch (error: any) {
      console.error('❌ Error starting call:', error)
      setCallStatus('Error starting call: ' + (error?.message || 'Unknown error'))
      setIsCallActive(false)
      setCallTestLoading(false)
    }
  }

  // End call
  const endCall = () => {
    if (vapiInstance) {
      vapiInstance.stop()
    }
  }

  const startTest = () => {
    setIsTesting(true)
    setCallStatus('Initiating call...')
    
    setTimeout(() => {
      setCallStatus('Connected! Aurora is handling the call...')
    }, 2000)
    
    setTimeout(() => {
      setCallStatus('Call completed successfully. Summary sent to your email.')
      setIsTesting(false)
    }, 8000)
  }

  if (loading || dataLoading || companyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-900 text-2xl font-bold mb-4">
            {loading ? 'Loading your dashboard...' : 
             companyLoading ? 'Loading companies...' : 
             'Fetching real-time data...'}
          </div>
          {(dataLoading || companyLoading) && (
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          )}
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/logos/logoblakc.png" 
              alt="Aurora Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-xl font-semibold text-gray-900">aurora</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Company Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Company:</label>
              <select
                value={companyId}
                onChange={(e) => {
                  const newCompanyId = parseInt(e.target.value)
                  setCompanyId(newCompanyId)
                  loadDashboardData(newCompanyId)
                }}
                disabled={companyLoading}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {companyLoading ? (
                  <option>Loading companies...</option>
                ) : companies.length > 0 ? (
                  companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))
                ) : (
                  <option value={1}>No companies found</option>
                )}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              {session.user.user_metadata?.avatar_url ? (
                <img 
                  src={session.user.user_metadata.avatar_url} 
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                  <span className="text-white font-bold text-sm">
                    {session.user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-gray-900 font-medium text-sm">
                  {session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User'}
                </span>
                <span className="text-gray-500 text-xs">
                  {session.user.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Call Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and analyze your AI receptionist performance
          </p>
        </div>

        {/* AI Call Test with Real Business */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Live AI Call Test</h2>
              <p className="text-sm text-gray-600">Search for any business and test Aurora AI receptionist</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${googleMapsLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  Google Maps: {googleMapsLoaded ? 'Loaded' : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
          
          {!showCallTest ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    id="businessSearch"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Search for a business (e.g., Starbucks, McDonald's, Pizza Hut)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={handleAICallTest}
                  disabled={!businessName.trim() || !selectedPlace}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Start AI Call
                </button>
              </div>
              
              {selectedPlace && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{selectedPlace.name}</div>
                      <div className="text-sm text-gray-600 mb-1">{selectedPlace.formatted_address}</div>
                      {selectedPlace.formatted_phone_number && (
                        <div className="text-sm text-gray-600">{selectedPlace.formatted_phone_number}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Call Interface */}
              <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                {/* Logo with pulse animation */}
                <div className="relative w-40 h-40 mb-6">
                  <div className={`absolute inset-0 rounded-full ${isCallActive ? 'bg-blue-500 animate-ping' : 'bg-gray-300'} opacity-20`}></div>
                  <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-blue-200">
                    <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
                
                {/* Call Status */}
                <div className="text-center mb-6">
                  <div className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedPlace?.name || 'Business'}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{callStatus}</div>
                  {callTestLoading && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Setting up AI assistant...</span>
                    </div>
                  )}
                </div>
                
                {/* End Call Button */}
                <button
                  onClick={endCall}
                  disabled={!isCallActive}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  End Call
                </button>
              </div>
              
              {/* Business Info */}
              {selectedPlace && (
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <h5 className="font-semibold text-gray-900 mb-3">Calling:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div><strong>Name:</strong> {selectedPlace.name}</div>
                    <div><strong>Address:</strong> {selectedPlace.formatted_address}</div>
                    {selectedPlace.formatted_phone_number && (
                      <div><strong>Phone:</strong> {selectedPlace.formatted_phone_number}</div>
                    )}
                    {selectedPlace.website && (
                      <div><strong>Website:</strong> <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{selectedPlace.website}</a></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">{callStats.totalCalls.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
                {growthMetrics.totalCallsGrowth}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Calls</p>
                <p className="text-3xl font-bold text-gray-900">{callStats.todayCalls}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
                {growthMetrics.todayCallsGrowth}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs yesterday</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900">{callStats.avgCallDuration}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${hasData ? 'text-red-600' : 'text-gray-400'}`}>
                {growthMetrics.avgDurationGrowth}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last week</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">{callStats.successRate}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
                {growthMetrics.successRateGrowth}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Weekly Call Volume Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Call Volume</h3>
            {hasData ? (
              <div className="h-64">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Chart area */}
                  <g transform="translate(40, 20)">
                    {/* Y-axis labels */}
                    {[0, 15, 30, 45, 60].map((value, index) => (
                      <g key={value}>
                        <text x="-5" y={160 - (value * 2.67)} textAnchor="end" className="text-xs fill-gray-500">
                          {value}
                        </text>
                        <line x1="0" y1={160 - (value * 2.67)} x2="320" y2={160 - (value * 2.67)} stroke="#e5e7eb" strokeWidth="1"/>
                      </g>
                    ))}
                    
                    {/* Data points and line */}
                    {weeklyCalls.map((day, index) => {
                      const x = (index * 45) + 20
                      const y = 160 - (day.calls * 2.67)
                      return (
                        <g key={day.day}>
                          <circle cx={x} cy={y} r="4" fill="#3B82F6" className="hover:r-6 transition-all"/>
                          <text x={x} y="185" textAnchor="middle" className="text-xs fill-gray-600">{day.day}</text>
                          <text x={x} y="195" textAnchor="middle" className="text-xs fill-gray-900 font-medium">{day.calls}</text>
                          {index > 0 && (
                            <line 
                              x1={((index - 1) * 45) + 20} 
                              y1={160 - (weeklyCalls[index - 1].calls * 2.67)} 
                              x2={x} 
                              y2={y} 
                              stroke="#3B82F6" 
                              strokeWidth="2"
                              className="animate-pulse"
                            />
                          )}
                        </g>
                      )
                    })}
                  </g>
                </svg>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No Data Available</p>
                  <p className="text-gray-400 text-sm">Start receiving calls to see analytics</p>
                </div>
              </div>
            )}
          </div>

          {/* Call Types Distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Call Types Distribution</h3>
            {hasData ? (
              <div className="h-64">
                <svg width="100%" height="100%" viewBox="0 0 300 200" className="overflow-visible">
                  <g transform="translate(150, 100)">
                    {/* Pie chart */}
                    {(() => {
                      let currentAngle = 0
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                      return callTypes.map((type, index) => {
                        const angle = (type.percentage / 100) * 360
                        const startAngle = currentAngle
                        const endAngle = currentAngle + angle
                        currentAngle += angle
                        
                        const startAngleRad = (startAngle - 90) * Math.PI / 180
                        const endAngleRad = (endAngle - 90) * Math.PI / 180
                        
                        const x1 = Math.cos(startAngleRad) * 60
                        const y1 = Math.sin(startAngleRad) * 60
                        const x2 = Math.cos(endAngleRad) * 60
                        const y2 = Math.sin(endAngleRad) * 60
                        
                        const largeArcFlag = angle > 180 ? 1 : 0
                        
                        const pathData = [
                          `M 0 0`,
                          `L ${x1} ${y1}`,
                          `A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          `Z`
                        ].join(' ')
                        
                        return (
                          <path
                            key={type.type}
                            d={pathData}
                            fill={colors[index]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        )
                      })
                    })()}
                    
                    {/* Center circle */}
                    <circle cx="0" cy="0" r="25" fill="white" />
                    <text x="0" y="5" textAnchor="middle" className="text-sm font-bold fill-gray-900">
                      {callStats.totalCalls}
                    </text>
                    <text x="0" y="20" textAnchor="middle" className="text-xs fill-gray-500">
                      Total Calls
                    </text>
                  </g>
                  
                  {/* Legend */}
                  <g transform="translate(20, 20)">
                    {callTypes.map((type, index) => {
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                      return (
                        <g key={type.type} transform={`translate(0, ${index * 25})`}>
                          <rect width="12" height="12" fill={colors[index]} rx="2" />
                          <text x="20" y="9" className="text-xs fill-gray-700 font-medium">
                            {type.type} ({type.percentage}%)
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </svg>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No Data Available</p>
                  <p className="text-gray-400 text-sm">Call distribution will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hourly Distribution and Test Interface */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Hourly Call Distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Hourly Call Distribution</h3>
            {hasData ? (
              <div className="h-64">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="hourlyGrid" width="33" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 33 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hourlyGrid)" />
                  
                  {/* Chart area */}
                  <g transform="translate(30, 20)">
                    {/* Y-axis labels */}
                    {[0, 10, 20, 30, 40, 50].map((value, index) => (
                      <g key={value}>
                        <text x="-5" y={160 - (value * 3.2)} textAnchor="end" className="text-xs fill-gray-500">
                          {value}
                        </text>
                        <line x1="0" y1={160 - (value * 3.2)} x2="340" y2={160 - (value * 3.2)} stroke="#e5e7eb" strokeWidth="1"/>
                      </g>
                    ))}
                    
                    {/* Bar chart */}
                    {hourlyData.map((hour, index) => {
                      const x = (index * 28) + 5
                      const height = (hour.calls / 50) * 160
                      const y = 160 - height
                      return (
                        <g key={hour.hour}>
                          <rect 
                            x={x} 
                            y={y} 
                            width="20" 
                            height={height} 
                            fill="#3B82F6" 
                            className="hover:fill-blue-600 transition-colors cursor-pointer"
                            rx="2"
                          />
                          <text x={x + 10} y="175" textAnchor="middle" className="text-xs fill-gray-600">
                            {hour.hour}
                          </text>
                          <text x={x + 10} y="185" textAnchor="middle" className="text-xs fill-gray-900 font-medium">
                            {hour.calls}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </svg>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Peak hour: {callStats.peakHour}</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No Data Available</p>
                  <p className="text-gray-400 text-sm">Hourly patterns will appear here</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Call Activity</h3>
          {hasData ? (
            <div className="space-y-4">
              {recentCalls.map((call, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">{call.type}</div>
                      <div className="text-sm text-gray-500">{call.time} • {call.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      call.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium mb-2">No Recent Activity</p>
              <p className="text-gray-400 text-sm">Call logs will appear here once you start receiving calls</p>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
