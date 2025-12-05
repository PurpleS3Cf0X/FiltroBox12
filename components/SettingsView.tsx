import React from 'react';
import { Settings, User, Bell, Shield, Lock, HardDrive, Smartphone } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-gray-400" /> 
            Platform Settings
        </h2>
        <p className="text-secondary mt-1">Manage your environment, API keys, and notification preferences.</p>
      </div>

      <div className="space-y-8">
        {/* API Configuration */}
        <section className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" /> API Gateways
                </h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Default LLM Provider</label>
                        <select className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none transition-colors">
                            <option>OpenAI (GPT-4)</option>
                            <option>Anthropic (Claude 3)</option>
                            <option>Google (Gemini Pro)</option>
                            <option>Custom Webhook</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Environment</label>
                        <select className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none transition-colors">
                            <option>Production</option>
                            <option>Staging</option>
                            <option>Development</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Webhook Endpoint URL</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value="https://api.filtrobox12ai.internal/v1/sanitize" 
                            readOnly
                            className="flex-1 bg-background border border-gray-700 rounded-lg px-4 py-2 text-gray-300 font-mono text-sm" 
                        />
                        <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Rotate Key
                        </button>
                    </div>
                </div>
            </div>
        </section>

        {/* Local Processing */}
        <section className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-primary" /> Docker & Local Processing
                </h3>
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-gray-700 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-200">Ollama Container</h4>
                            <p className="text-xs text-gray-500">Running on localhost:11434</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm text-green-500 font-medium">Active</span>
                    </div>
                </div>
                
                <div className="text-sm text-gray-400">
                    <p>When enabled, PII detection happens entirely within your VPC or local machine using the Dockerized Ollama instance. No data leaves your network.</p>
                </div>
            </div>
        </section>

        {/* Account */}
        <section className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-warning" /> Account & Security
                </h3>
            </div>
            <div className="p-6 space-y-4">
                 <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-gray-200 text-sm font-medium">Audit Logs</h4>
                        <p className="text-xs text-gray-500">Keep a record of all sanitized requests.</p>
                    </div>
                    <button className="text-accent text-sm hover:underline">Configure Retention</button>
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-gray-200 text-sm font-medium">2FA Authentication</h4>
                        <p className="text-xs text-gray-500">Secure access to the FiltroBox dashboard.</p>
                    </div>
                    <button className="bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded text-xs font-medium transition-colors">Enable</button>
                 </div>
            </div>
        </section>
      </div>
    </div>
  );
};