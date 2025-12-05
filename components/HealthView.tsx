
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Cpu, 
  Database, 
  Wifi, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Terminal,
  Box,
  HardDrive
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { OllamaSettings, OllamaModel } from '../types';

interface HealthViewProps {
    ollamaSettings: OllamaSettings;
}

export const HealthView: React.FC<HealthViewProps> = ({ ollamaSettings }) => {
  const [data, setData] = useState<{ time: string; rpm: number; latency: number }[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Ollama Health State
  const [isOllamaHealthy, setIsOllamaHealthy] = useState<boolean | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Simulate live data feed
  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const points = [];
      for (let i = 20; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 3000);
        points.push({
          time: t.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
          rpm: Math.floor(Math.random() * 50) + 120, // Random RPM between 120-170
          latency: Math.floor(Math.random() * 40) + 20, // Latency 20-60ms
        });
      }
      return points;
    };

    setData(generateData());

    const interval = setInterval(() => {
      setData(prev => {
        const nextTime = new Date();
        const newPoint = {
          time: nextTime.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
          rpm: Math.floor(Math.random() * 50) + 120,
          latency: Math.floor(Math.random() * 40) + 20,
        };
        return [...prev.slice(1), newPoint];
      });
      setLastUpdated(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Check Ollama Health Periodically
  useEffect(() => {
      const checkOllama = async () => {
          try {
            const headers: Record<string, string> = {};
            if (ollamaSettings.apiKey) {
                headers['Authorization'] = `Bearer ${ollamaSettings.apiKey}`;
            }

            const response = await fetch(`${ollamaSettings.url.replace(/\/$/, '')}/api/tags`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.models) {
                    setOllamaModels(data.models);
                }
                setIsOllamaHealthy(true);
            } else {
                setIsOllamaHealthy(false);
            }
          } catch (e) {
              console.error("Health check failed", e);
              setIsOllamaHealthy(false);
          } finally {
              setLastCheck(new Date());
          }
      };

      // Initial Check
      checkOllama();

      // Poll every 10 seconds
      const pollInterval = setInterval(checkOllama, 10000);
      return () => clearInterval(pollInterval);
  }, [ollamaSettings]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-20">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-green-500" /> 
                    System Health & Telemetry
                </h2>
                <p className="text-secondary mt-1">Real-time status of filtering engines and infrastructure.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-surface border border-gray-800 px-3 py-1.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Live updating ({lastUpdated.toLocaleTimeString()})
            </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Gemini Status */}
            <div className="bg-surface border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wifi className="w-12 h-12 text-blue-500" />
                </div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Database className="w-5 h-5" />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        <CheckCircle className="w-3 h-3" /> Operational
                    </span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Cloud Engine</h3>
                <p className="text-xl font-bold text-white mt-1">Gemini 2.5 Flash</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
                    <span>Latency</span>
                    <span className="text-gray-300 font-mono">142ms</span>
                </div>
            </div>

            {/* Docker Status (Live) */}
            <div className="bg-surface border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Server className="w-12 h-12 text-accent" />
                </div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                        <Cpu className="w-5 h-5" />
                    </div>
                    {isOllamaHealthy === true && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            <CheckCircle className="w-3 h-3" /> Online
                        </span>
                    )}
                    {isOllamaHealthy === false && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <XCircle className="w-3 h-3" /> Offline
                        </span>
                    )}
                    {isOllamaHealthy === null && (
                         <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/20">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Checking
                        </span>
                    )}
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Local Container</h3>
                <p className="text-xl font-bold text-white mt-1">Ollama / Docker</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
                    <span>Last Check</span>
                    <span className="text-gray-300 font-mono">{lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}</span>
                </div>
            </div>

            {/* Error Rate */}
            <div className="bg-surface border border-gray-800 rounded-xl p-5 shadow-lg">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">24h Window</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Error Rate</h3>
                <p className="text-xl font-bold text-white mt-1">0.04%</p>
                 <div className="mt-4 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[99%]"></div>
                </div>
            </div>

             {/* Quota Usage */}
             <div className="bg-surface border border-gray-800 rounded-xl p-5 shadow-lg">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">Monthly</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">API Quota</h3>
                <p className="text-xl font-bold text-white mt-1">42,503 <span className="text-xs font-normal text-gray-500">/ 1M req</span></p>
                 <div className="mt-4 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[4%]"></div>
                </div>
            </div>
        </div>

        {/* Telemetry Charts & Model List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface border border-gray-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-medium text-white mb-6">Throughput (Requests/Min)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                />
                                <Area type="monotone" dataKey="rpm" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRpm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Available Models List (Only if Ollama is Healthy) */}
                {isOllamaHealthy && (
                     <div className="bg-surface border border-gray-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Box className="w-4 h-4 text-accent" /> Available Local Models
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-500">
                                        <th className="pb-3 font-medium">Model Name</th>
                                        <th className="pb-3 font-medium">Size</th>
                                        <th className="pb-3 font-medium">Modified</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {ollamaModels.length === 0 ? (
                                        <tr><td colSpan={3} className="py-4 text-gray-500">No models found in Ollama library.</td></tr>
                                    ) : (
                                        ollamaModels.map(m => (
                                            <tr key={m.name} className="group hover:bg-white/5">
                                                <td className="py-3 font-mono text-gray-300 group-hover:text-white transition-colors">{m.name}</td>
                                                <td className="py-3 text-gray-500">{(m.size / 1024 / 1024 / 1024).toFixed(2)} GB</td>
                                                <td className="py-3 text-gray-500">{new Date(m.modified_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                     </div>
                )}
            </div>

            <div className="bg-surface border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col h-full max-h-[700px]">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-gray-400" /> System Logs
                </h3>
                <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-xs overflow-y-auto custom-scrollbar space-y-2 border border-gray-800">
                    <div className="text-green-400">[10:42:15] Service 'pii-scanner' health check passed.</div>
                    <div className="text-blue-400">[10:42:18] Job #4002 started. Engine: Gemini-Flash.</div>
                    <div className="text-blue-400">[10:42:19] Job #4002 completed. Time: 450ms.</div>
                    {isOllamaHealthy ? (
                        <div className="text-green-400">[{lastCheck?.toLocaleTimeString()}] Ollama Health Check: OK. {ollamaModels.length} models found.</div>
                    ) : isOllamaHealthy === false ? (
                         <div className="text-red-400">[{lastCheck?.toLocaleTimeString()}] Ollama Health Check: FAILED. Connection refused to {ollamaSettings.url}.</div>
                    ) : null}
                    <div className="text-gray-500">[10:43:01] Auto-scaling trigger: CPU &lt; 15%. No action.</div>
                    <div className="text-blue-400">[10:43:45] Incoming request payload size: 12KB.</div>
                    <div className="text-yellow-400">[10:44:02] Rule 'CREDIT_CARD' matched 2 entities.</div>
                    <div className="text-blue-400">[10:45:12] User 'admin' updated configuration.</div>
                    <div className="text-gray-500 animate-pulse">_</div>
                </div>
            </div>
        </div>
    </div>
  );
};
