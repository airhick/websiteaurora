import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  Clock, 
  DollarSign, 
  Activity, 
  Search, 
  ChevronRight, 
  Settings, 
  Cpu, 
  MessageSquare, 
  Terminal, 
  ArrowLeft,
  Key,
  Shield,
  RefreshCw,
  ExternalLink,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  Zap,
  History,
  Briefcase
} from 'lucide-react';

/**
 * Vapi Client Dashboard
 * Tracks calls, transfers, live status, tool usage, and customer history.
 */

const VAPI_BASE_URL = 'https://api.vapi.ai';

// --- Components ---

const Badge = ({ children, type = 'default', className = '' }) => {
  const styles = {
    default: 'bg-slate-700 text-slate-200',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    error: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    live: 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type] || styles.default} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '', title, icon: Icon }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm ${className}`}>
    {(title || Icon) && (
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-400" />}
        <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wide">{title}</h3>
      </div>
    )}
    <div className="p-0">{children}</div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color = "indigo" }) => {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    blue: "text-blue-400 bg-blue-500/10",
  };
  
  return (
    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colors[color] || colors.indigo}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  // State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('vapi_private_key') || '');
  const [view, setView] = useState('dashboard'); // 'dashboard', 'call-detail'
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [callDetail, setCallDetail] = useState(null);
  const [assistantDetail, setAssistantDetail] = useState(null);
  const [error, setError] = useState(null);

  // Derived State (Stats)
  const stats = useMemo(() => {
    if (!calls.length) return { totalCalls: 0, transferred: 0, live: 0, totalCost: 0 };
    
    let transferred = 0;
    let live = 0;
    let totalCost = 0;

    calls.forEach(c => {
      // Cost
      totalCost += (c.cost || 0);

      // Live Status
      if (['in-progress', 'ringing', 'queued'].includes(c.status)) {
        live++;
      }

      // Transferred Logic (Heuristic based on endedReason or status)
      const reason = c.endedReason || '';
      if (reason.includes('forward') || reason.includes('transfer') || reason === 'customer-transferred-call') {
        transferred++;
      }
    });

    return {
      totalCalls: calls.length,
      transferred,
      live,
      totalCost: totalCost.toFixed(2)
    };
  }, [calls]);

  // Client History (Previous Exchanges)
  const clientHistory = useMemo(() => {
    if (!callDetail || !calls.length) return [];
    const phoneNumber = callDetail.customer?.number;
    if (!phoneNumber) return [];

    return calls
      .filter(c => c.customer?.number === phoneNumber && c.id !== callDetail.id)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 5); // Last 5 calls
  }, [callDetail, calls]);

  // --- API Functions ---

  const fetchCalls = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${VAPI_BASE_URL}/call`, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch calls. Check your API Key.');
      
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      setCalls(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallDetail = async (id) => {
    setLoading(true);
    setCallDetail(null);
    setAssistantDetail(null);
    try {
      // 1. Fetch Call
      const callRes = await fetch(`${VAPI_BASE_URL}/call/${id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!callRes.ok) throw new Error('Failed to fetch call details');
      const callData = await callRes.json();
      setCallDetail(callData);

      // 2. Fetch Assistant
      if (callData.assistantId) {
        const asstRes = await fetch(`${VAPI_BASE_URL}/assistant/${callData.assistantId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (asstRes.ok) {
          const asstData = await asstRes.json();
          setAssistantDetail(asstData);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  useEffect(() => {
    if (apiKey && view === 'dashboard') {
      fetchCalls();
    }
  }, [apiKey, view]);

  useEffect(() => {
    if (selectedCallId) {
      fetchCallDetail(selectedCallId);
    }
  }, [selectedCallId]);

  // --- Handlers ---

  const handleSaveKey = (key) => {
    setApiKey(key);
    localStorage.setItem('vapi_private_key', key);
    setView('dashboard');
  };

  const handleLogout = () => {
    setApiKey('');
    localStorage.removeItem('vapi_private_key');
    setCalls([]);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  // --- Sub-Components ---

  const LoginScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Vapi Client Portal</h1>
        <p className="text-slate-400 text-center mb-8">Enter your access key to view call analytics</p>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSaveKey(e.target.key.value); }}>
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                name="key"
                type="password" 
                defaultValue={apiKey}
                placeholder="sk-..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-600/20">
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );

  const ToolUsage = ({ messages }) => {
    if (!messages) return null;
    const tools = messages.filter(m => 
      m.role === 'tool' || 
      (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) ||
      m.type === 'function-call'
    );

    if (tools.length === 0) return <div className="p-4 text-slate-500 text-sm italic">No tools triggered.</div>;

    return (
      <div className="divide-y divide-slate-700/50">
        {tools.map((msg, idx) => {
          let toolName = "Unknown Tool";
          let toolArgs = "{}";
          let output = "";

          if (msg.toolCalls) {
            toolName = msg.toolCalls[0]?.function?.name;
            toolArgs = msg.toolCalls[0]?.function?.arguments;
          } else if (msg.role === 'tool') {
             toolName = `Result: ${msg.name || 'Tool'}`;
             output = msg.content;
          }

          return (
            <div key={idx} className="p-4 hover:bg-slate-750 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-500/10 rounded">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="font-mono text-emerald-300 font-semibold text-sm">{toolName}</span>
              </div>
              {toolArgs && toolArgs !== "{}" && (
                <div className="bg-slate-950/50 rounded p-3 mb-2 border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Action Details</div>
                  <code className="text-xs text-slate-300 font-mono break-all block">
                    {toolArgs}
                  </code>
                </div>
              )}
              {output && (
                 <div className="text-xs text-slate-400 pl-2 border-l-2 border-slate-700 mt-2">
                    <span className="text-slate-500 font-medium">Result:</span> {output.slice(0, 150)}{output.length > 150 ? '...' : ''}
                 </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const IntegratedTools = ({ assistant }) => {
      const tools = assistant?.model?.tools || [];
      if (tools.length === 0) return <div className="p-4 text-slate-500 text-sm italic">No tools configured for this agent.</div>;
      
      return (
          <div className="p-4 space-y-3">
              {tools.map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 p-1 bg-blue-500/10 rounded">
                          <Briefcase className="w-3 h-3 text-blue-400" />
                      </div>
                      <div>
                          <div className="text-sm font-medium text-slate-200 font-mono">{t.function?.name || t.type}</div>
                          <div className="text-xs text-slate-500">{t.function?.description || "No description provided."}</div>
                      </div>
                  </div>
              ))}
          </div>
      )
  }

  // --- Views ---

  if (!apiKey) return <LoginScreen />;

  if (view === 'call-detail' && callDetail) {
    const systemMessage = assistantDetail?.model?.messages?.find(m => m.role === 'system')?.content 
      || assistantDetail?.model?.systemMessage
      || "System prompt not found or accessible.";

    const isLive = ['in-progress', 'ringing'].includes(callDetail.status);
    const direction = callDetail.type === 'inboundPhoneCall' ? 'Inbound' : 'Outbound';

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-10">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <button 
                    onClick={() => { setView('dashboard'); setSelectedCallId(null); }}
                    className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                     {isLive && <Badge type="live" className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> LIVE CALL</Badge>}
                     <Badge type="info">{direction}</Badge>
                     <span className="font-mono text-slate-500 text-xs">{callDetail.id}</span>
                </div>
            </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Summary & Transcript Block */}
            <Card title="Call Intelligence" icon={MessageSquare} className="flex flex-col">
               {/* Summary Section */}
               <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Summary</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {callDetail.analysis?.summary || <span className="italic text-slate-500">Summary not generated yet. This typically appears after the call ends.</span>}
                    </p>
               </div>
               
               {/* Transcript Section */}
               <div className="bg-slate-900/50 p-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Transcript</h4>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {callDetail.messages?.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-slate-700 text-slate-200 rounded-bl-none'
                            }`}>
                            <div className="text-[10px] opacity-50 mb-1 capitalize font-bold">{msg.role}</div>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            </div>
                        </div>
                        ))}
                    </div>
               </div>
            </Card>

            {/* System Prompt */}
            <Card title="System Context" icon={Shield}>
                <div className="p-6 bg-slate-900/30">
                    <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-xs text-slate-400 font-mono bg-transparent p-0">
                            {systemMessage}
                        </pre>
                    </div>
                </div>
            </Card>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Key Metrics */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                    <div className="text-slate-500 text-xs uppercase mb-1">Duration</div>
                    <div className="text-xl font-mono text-white">{formatDuration(callDetail.duration)}</div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                    <div className="text-slate-500 text-xs uppercase mb-1">Cost</div>
                    <div className="text-xl font-mono text-emerald-400">${(callDetail.cost || 0).toFixed(4)}</div>
                </div>
             </div>

             {/* Customer History */}
             <Card title="Previous Exchanges" icon={History}>
                {clientHistory.length > 0 ? (
                    <div className="divide-y divide-slate-700/50">
                        {clientHistory.map(h => (
                            <div key={h.id} className="p-4 hover:bg-slate-750 transition-colors cursor-pointer" onClick={() => setSelectedCallId(h.id)}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-400">{formatTime(h.startedAt)}</span>
                                    <Badge type={h.status === 'ended' ? 'success' : 'warning'}>{h.status}</Badge>
                                </div>
                                <p className="text-xs text-slate-300 line-clamp-2">
                                    {h.analysis?.summary || "No summary available."}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-slate-500 text-sm">
                        No previous history found for this number in loaded calls.
                    </div>
                )}
             </Card>

             {/* Tools Triggered */}
             <Card title="Tools Triggered" icon={Cpu}>
                <div className="max-h-[300px] overflow-y-auto">
                    <ToolUsage messages={callDetail.messages} />
                </div>
             </Card>

             {/* Tools Integrated (Available) */}
             <Card title="Capabilities (Integrated)" icon={Briefcase}>
                <div className="max-h-[300px] overflow-y-auto bg-slate-900/30">
                    <IntegratedTools assistant={assistantDetail} />
                </div>
             </Card>

          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Vapi<span className="text-slate-500 font-normal">Monitor</span></span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchCalls} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white px-3 py-1.5">
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-200 text-sm">{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Calls" value={stats.totalCalls} icon={Phone} color="blue" />
          <StatCard title="Active / Live" value={stats.live} icon={Zap} color="rose" />
          <StatCard title="Transferred" value={stats.transferred} icon={PhoneForwarded} color="amber" />
          <StatCard title="Total Spend" value={`$${stats.totalCost}`} icon={DollarSign} color="emerald" />
        </div>

        {/* Calls List */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                All Activity
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-300">{calls.length}</span>
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search ID..." 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {calls.length === 0 && !loading && (
                   <tr>
                     <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                            <Phone className="w-8 h-8 mb-3 opacity-20" />
                            <p>No call data found.</p>
                        </div>
                     </td>
                   </tr>
                )}
                {calls.map((call) => (
                  <tr 
                    key={call.id} 
                    onClick={() => { setSelectedCallId(call.id); setView('call-detail'); }}
                    className="hover:bg-slate-750 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                        <Badge type={call.status === 'ended' ? 'default' : 'live'}>{call.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-300">
                            {call.type === 'inboundPhoneCall' ? <PhoneIncoming className="w-3 h-3 text-blue-400"/> : <PhoneOutgoing className="w-3 h-3 text-purple-400"/>}
                            <span className="capitalize">{call.type === 'inboundPhoneCall' ? 'Inbound' : 'Outbound'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatTime(call.startedAt || call.createdAt)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{formatDuration(call.duration)}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400 font-medium">${(call.cost || 0).toFixed(4)}</td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-white transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}