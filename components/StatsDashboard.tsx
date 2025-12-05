import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUpRight, Activity } from 'lucide-react';

const data = [
  { name: 'Mon', detections: 40 },
  { name: 'Tue', detections: 30 },
  { name: 'Wed', detections: 20 },
  { name: 'Thu', detections: 27 },
  { name: 'Fri', detections: 18 },
  { name: 'Sat', detections: 23 },
  { name: 'Sun', detections: 34 },
];

const pieData = [
  { name: 'Email', value: 400 },
  { name: 'Credit Card', value: 300 },
  { name: 'API Keys', value: 300 },
  { name: 'SSN', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const StatsDashboard: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 animate-fade-in">
        <div className="bg-surface/50 border border-gray-800 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-gray-200">Weekly Interceptions</h3>
                    <p className="text-xs text-gray-500">Sensitive data blocked per day</p>
                </div>
                <div className="bg-primary/10 p-2 rounded text-primary">
                    <Activity className="w-4 h-4" />
                </div>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            cursor={{fill: '#334155', opacity: 0.4}}
                        />
                        <Bar dataKey="detections" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-surface/50 border border-gray-800 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-gray-200">Threat Distribution</h3>
                    <p className="text-xs text-gray-500">By PII Type</p>
                </div>
                <div className="bg-accent/10 p-2 rounded text-accent">
                    <ArrowUpRight className="w-4 h-4" />
                </div>
            </div>
             <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                             contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                             itemStyle={{ color: '#e2e8f0' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Custom Legend */}
                <div className="space-y-2 ml-4">
                     {pieData.map((entry, index) => (
                         <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                             {entry.name}
                         </div>
                     ))}
                </div>
            </div>
        </div>
    </div>
  );
};
