
import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, Shield, Lock, HardDrive, Smartphone, RefreshCw, AlertCircle, Check, Cloud, Server, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { OllamaSettings, OllamaModel, CloudSettings } from '../types';

interface SettingsViewProps {
    ollamaSettings: OllamaSettings;
    onUpdateSettings: (settings: OllamaSettings) => void;
    cloudSettings: CloudSettings;
    onUpdateCloudSettings: (settings: CloudSettings) => void;
    activeEngine: 'GEMINI' | 'OLLAMA';
    onUpdateEngine: (engine: 'GEMINI' | 'OLLAMA') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    ollamaSettings, 
    onUpdateSettings, 
    cloudSettings,
    onUpdateCloudSettings,
    activeEngine, 
    onUpdateEngine 
}) => {
  const [localOllamaSettings, setLocalOllamaSettings] = useState<OllamaSettings>(ollamaSettings);
  const [localCloudSettings, setLocalCloudSettings] = useState<CloudSettings>(cloudSettings);
  
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [geminiKeyError, setGeminiKeyError] = useState<string | null>(null);

  // Sync state changes to parent
  useEffect(() => {
    onUpdateSettings(localOllamaSettings);
  }, [localOllamaSettings, onUpdateSettings]);

  useEffect(() => {
    onUpdateCloudSettings(localCloudSettings);
  }, [localCloudSettings, onUpdateCloudSettings]);


  // Validate Ollama URL
  useEffect(() => {
    if (!localOllamaSettings.url) {
        setUrlError('URL is required');
        return;
    }
    try {
        new URL(localOllamaSettings.url);
        setUrlError(null);
    } catch (_) {
        setUrlError('Invalid URL format');
    }
  }, [localOllamaSettings.url]);

  // Validate Gemini Key format
  const handleGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalCloudSettings({ ...localCloudSettings, apiKey: val });
      
      if (val && !val.startsWith('AIza')) {
          setGeminiKeyError('Invalid API Key format (should start with AIza)');
      } else {
          setGeminiKeyError(null);
      }
  };

  const handleChangeOllama = (field: keyof OllamaSettings, value: string) => {
      setLocalOllamaSettings({ ...localOllamaSettings, [field]: value });
      setFetchSuccess(false);
  };

  const fetchModels = async () => {
    if (urlError) return;
    
    setIsFetchingModels(true);
    setFetchSuccess(false);
    try {
        const headers: Record<string, string> = {};
        if (localOllamaSettings.apiKey) {
            headers['Authorization'] = `Bearer ${localOllamaSettings.apiKey}`;
        }

        const response = await fetch(`${localOllamaSettings.url.replace(/\/$/, '')}/api/tags`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Failed to connect: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
            setModels(data.models);
            setFetchSuccess(true);
            if (!localOllamaSettings.model && data.models.length > 0) {
                handleChangeOllama('model', data.models[0].name);
            }
        } else {
            throw new Error("Invalid response format");
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    } finally {
        setIsFetchingModels(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 animate-fade-in pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-gray-400" /> 
            Platform Settings
        </h2>
        <p className="text-secondary mt-1">Manage your analysis pipeline and environment security.</p>
      </div>

      {/* Global Engine Selection */}
      <section className="mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Primary Inference Engine</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => onUpdateEngine('GEMINI')}
                className={`relative p-4 rounded-xl border flex items-start gap-4 transition-all ${
                    activeEngine === 'GEMINI' 
                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                    : 'bg-surface border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                  <div className={`p-3 rounded-full ${activeEngine === 'GEMINI' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-500'}`}>
                      <Cloud className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                      <h3 className={`font-bold ${activeEngine === 'GEMINI' ? 'text-white' : 'text-gray-300'}`}>Cloud Engine</h3>
                      <p className="text-sm text-gray-500 mt-1">Google Gemini 2.5 Flash</p>
                      <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${localCloudSettings.apiKey ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                          <span className={`text-xs ${localCloudSettings.apiKey ? 'text-yellow-400' : 'text-green-400'}`}>
                              {localCloudSettings.apiKey ? 'Custom Key Active' : 'Authenticated (Environment)'}
                          </span>
                      </div>
                  </div>
                  {activeEngine === 'GEMINI' && (
                      <div className="absolute top-4 right-4">
                          <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                  )}
              </button>

              <button 
                onClick={() => onUpdateEngine('OLLAMA')}
                className={`relative p-4 rounded-xl border flex items-start gap-4 transition-all ${
                    activeEngine === 'OLLAMA' 
                    ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-surface border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                  <div className={`p-3 rounded-full ${activeEngine === 'OLLAMA' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-500'}`}>
                      <Server className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                      <h3 className={`font-bold ${activeEngine === 'OLLAMA' ? 'text-white' : 'text-gray-300'}`}>Local Engine</h3>
                      <p className="text-sm text-gray-500 mt-1">Docker / Ollama Instance</p>
                       <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${fetchSuccess ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          <span className={`text-xs ${fetchSuccess ? 'text-green-400' : 'text-gray-500'}`}>
                             {fetchSuccess ? 'Connected to Localhost' : 'Connection Pending'}
                          </span>
                      </div>
                  </div>
                   {activeEngine === 'OLLAMA' && (
                      <div className="absolute top-4 right-4">
                          <CheckCircle className="w-5 h-5 text-accent" />
                      </div>
                  )}
              </button>
          </div>
      </section>

      <div className="space-y-8">
        
        {/* Gemini Configuration (Cloud) */}
        <section className={`bg-surface border border-gray-800 rounded-xl overflow-hidden shadow-lg transition-opacity duration-300 ${activeEngine === 'GEMINI' ? 'opacity-100 ring-1 ring-primary/30' : 'opacity-40 grayscale-[0.5]'}`}>
            <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Google Gemini Configuration
                </h3>
            </div>
            <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Service Provider</label>
                        <input type="text" disabled value="Google Cloud Vertex AI / AI Studio" className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            API Key {localCloudSettings.apiKey && <span className="text-yellow-500 text-xs ml-2">(Custom Key Active)</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type={showApiKey ? "text" : "password"} 
                                value={localCloudSettings.apiKey}
                                onChange={handleGeminiKeyChange}
                                placeholder="Use Environment Key (Default)"
                                className={`w-full bg-background border rounded-lg px-4 py-2 text-white focus:outline-none pl-10 ${
                                    geminiKeyError 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-700 focus:border-primary'
                                }`}
                            />
                            <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                            <button 
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {geminiKeyError && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {geminiKeyError}
                            </p>
                        )}
                        {!localCloudSettings.apiKey && (
                            <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Using secure environment variable (`process.env.API_KEY`)
                            </p>
                        )}
                    </div>
                 </div>
            </div>
        </section>

        {/* Ollama Configuration (Local) */}
        <section className={`bg-surface border border-gray-800 rounded-xl overflow-hidden shadow-lg transition-opacity duration-300 ${activeEngine === 'OLLAMA' ? 'opacity-100 ring-1 ring-accent/30' : 'opacity-50 grayscale-[0.5]'}`}>
            <div className="p-6 border-b border-gray-800 bg-gray-900/30">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-accent" /> Docker & Local Processing (Ollama)
                </h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-4">
                    <div className="p-2 bg-gray-700/50 rounded-full text-gray-300 shrink-0">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200">Local Privacy Engine</h4>
                        <p className="text-xs text-gray-400 mt-1">
                            Configure your local Ollama instance to run PII checks entirely within your infrastructure. 
                            Ensure CORS is enabled on your Ollama server if accessing from a browser.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Ollama URL
                        </label>
                        <input 
                            type="text" 
                            value={localOllamaSettings.url}
                            onChange={(e) => handleChangeOllama('url', e.target.value)}
                            placeholder="http://localhost:11434"
                            className={`w-full bg-background border rounded-lg px-4 py-2 text-white focus:outline-none transition-colors ${urlError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-accent'}`}
                        />
                        {urlError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {urlError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                             Ollama API Key <span className="text-gray-600 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={localOllamaSettings.apiKey}
                                onChange={(e) => handleChangeOllama('apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none pl-10"
                            />
                            <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        </div>
                    </div>
                </div>

                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Selected Model
                        </label>
                        <select 
                            value={localOllamaSettings.model}
                            onChange={(e) => handleChangeOllama('model', e.target.value)}
                            disabled={models.length === 0}
                            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>Select a model...</option>
                            {models.map(m => (
                                <option key={m.name} value={m.name}>{m.name} ({Math.round(m.size / 1024 / 1024 / 1024)}GB)</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={fetchModels}
                        disabled={!!urlError || isFetchingModels}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[42px] border border-gray-700"
                    >
                        {isFetchingModels ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {fetchSuccess ? 'Refreshed' : 'Fetch Models'}
                    </button>
                </div>
                 
                 {fetchSuccess && (
                     <p className="text-xs text-green-500 flex items-center gap-1">
                         <Check className="w-3 h-3" /> Successfully connected to Ollama instance.
                     </p>
                 )}
            </div>
        </section>

      </div>
    </div>
  );
};
