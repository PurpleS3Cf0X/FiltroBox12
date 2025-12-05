import React, { useState } from 'react';
import { Shield, Settings, Zap, UploadCloud, Terminal, Server, FileText, CheckCircle, Home, Sliders, LogOut } from 'lucide-react';
import { analyzeText } from './services/piiService';
import { AnalysisResult, ViewState, Rule, PiiType, SensitivityLevel } from './types';
import { AnalysisView } from './components/AnalysisView';
import { RulesConfig } from './components/RulesConfig';
import { StatsDashboard } from './components/StatsDashboard';
import { SettingsView } from './components/SettingsView';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [engine, setEngine] = useState<'GEMINI' | 'OLLAMA'>('GEMINI');
  const [showToast, setShowToast] = useState(false);

  // Lifted Rules State for persistence
  const [rules, setRules] = useState<Rule[]>([
    { 
      id: '1', 
      name: 'Credit Cards', 
      type: PiiType.CREDIT_CARD, 
      enabled: true, 
      description: 'Detects standard 16-digit card numbers', 
      level: SensitivityLevel.HIGH,
      pattern: '\\b(?:\\d[ -]*?){13,16}\\b'
    },
    { 
      id: '2', 
      name: 'Email Addresses', 
      type: PiiType.EMAIL, 
      enabled: true, 
      description: 'Detects standard email formats', 
      level: SensitivityLevel.MEDIUM,
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
    },
    { 
      id: '3', 
      name: 'US SSN', 
      type: PiiType.SSN, 
      enabled: true, 
      description: 'Detects Social Security Numbers', 
      level: SensitivityLevel.HIGH,
      pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b'
    },
    { 
      id: '4', 
      name: 'AWS API Keys', 
      type: PiiType.API_KEY, 
      enabled: true, 
      description: 'Detects AWS Access Key patterns', 
      level: SensitivityLevel.HIGH,
      pattern: '(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])'
    },
    { 
      id: '5', 
      name: 'IP Addresses', 
      type: PiiType.IP_ADDRESS, 
      enabled: false, 
      description: 'Detects IPv4 and IPv6 addresses', 
      level: SensitivityLevel.LOW,
      pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b'
    },
  ]);

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleAddRule = (newRule: Rule) => {
    setRules(prev => [...prev, newRule]);
  };

  const handleUpdateRule = (updatedRule: Rule) => {
    setRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate delay if network is too fast, to show the loader animation
    const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
    
    // Pass enabled rules to service (mock implementation for now)
    const analysisPromise = analyzeText(inputText);
    
    const [_, analysisResult] = await Promise.all([minDelay, analysisPromise]);
    
    setResult(analysisResult);
    setIsAnalyzing(false);
    setView('ANALYSIS');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setInputText(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSend = (sanitized: string) => {
    console.log("Sending to external API:", sanitized);
    setShowToast(true);
    setTimeout(() => {
        setShowToast(false);
        setView('LANDING');
        setInputText('');
    }, 3000);
  };

  return (
    <div className="flex h-screen bg-background text-gray-100 font-sans overflow-hidden">
      
      {/* Toast Notification */}
      {showToast && (
            <div className="fixed top-8 right-8 z-50 bg-surface border border-accent/50 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in">
                <CheckCircle className="text-accent w-6 h-6" />
                <div>
                    <h4 className="font-bold text-sm">Data Sent Securely</h4>
                    <p className="text-xs text-gray-400">Sanitized payload forwarded to endpoint.</p>
                </div>
            </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-gray-800 flex flex-col justify-between shrink-0 z-20">
          <div>
              {/* Logo Area */}
              <div className="h-16 flex items-center px-6 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">FiltroBox12ai</span>
                  </div>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-1">
                  <button 
                    onClick={() => setView('LANDING')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        (view === 'LANDING' || view === 'ANALYSIS') 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                      <Home className="w-4 h-4" />
                      Dashboard & Scan
                  </button>
                  <button 
                    onClick={() => setView('RULES')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        view === 'RULES' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                      <Sliders className="w-4 h-4" />
                      Filtering Rules
                  </button>
              </div>
          </div>

          {/* Bottom Sidebar */}
          <div className="p-4 border-t border-gray-800">
              <button 
                  onClick={() => setView('SETTINGS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2 ${
                    view === 'SETTINGS'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                  <Settings className="w-4 h-4" />
                  Settings
              </button>
              
              <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-gray-900/50 border border-gray-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      JD
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-medium text-white truncate">John Developer</p>
                      <p className="text-[10px] text-gray-500 truncate">Admin Workspace</p>
                  </div>
                  <LogOut className="w-3 h-3 text-gray-500 cursor-pointer hover:text-white" />
              </div>
          </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        
        {/* Header inside main content (optional, for title/actions) */}
        <header className="h-16 border-b border-gray-800 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
            <h2 className="text-sm font-medium text-gray-400">
                {view === 'LANDING' && 'Secure Scanning Console'}
                {view === 'ANALYSIS' && 'Analysis Results'}
                {view === 'RULES' && 'Configuration / Rules'}
                {view === 'SETTINGS' && 'System Configuration'}
            </h2>

            <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-gray-700">
                    <span className="text-xs text-gray-500 font-medium">ENGINE</span>
                    <div className="h-4 w-[1px] bg-gray-700"></div>
                    <button 
                        onClick={() => setEngine('GEMINI')}
                        className={`text-xs font-semibold transition-colors ${engine === 'GEMINI' ? 'text-accent' : 'text-gray-500'}`}
                    >
                        GEMINI 2.5
                    </button>
                    <button 
                        onClick={() => setEngine('OLLAMA')}
                        className={`text-xs font-semibold transition-colors ${engine === 'OLLAMA' ? 'text-accent' : 'text-gray-500'}`}
                        title="Local Docker Instance (Demo)"
                    >
                        OLLAMA
                    </button>
                </div>
            </div>
        </header>

        {/* Views */}
        <div className="p-4 md:p-8">
            {view === 'LANDING' && (
            <div className="max-w-5xl mx-auto w-full flex flex-col items-center animate-fade-in">
                
                {/* Hero Section */}
                <div className="text-center mb-10 space-y-4 pt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 text-blue-400 text-xs font-medium border border-blue-900/50 mb-2">
                        <Zap className="w-3 h-3" /> Privacy-First AI Pipeline
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 tracking-tight">
                        Filter what leaves.
                    </h1>
                    <p className="text-base text-gray-400 max-w-xl mx-auto">
                        Sanitize sensitive PII locally before sending to LLMs.
                    </p>
                </div>

                {/* Input Zone */}
                <div className="w-full bg-surface border border-gray-800 rounded-2xl shadow-2xl overflow-hidden group focus-within:border-primary/50 transition-colors duration-300">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2 font-mono">input_source.txt</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                                <UploadCloud className="w-3 h-3" /> Upload File
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                    
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your JSON, SQL dump, or prompt here..."
                        className="w-full h-64 bg-transparent p-6 text-sm font-mono text-gray-300 focus:outline-none resize-none placeholder:text-gray-700"
                        spellCheck={false}
                    />
                    
                    <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-xs text-gray-600 font-mono">
                            {inputText.length} chars
                        </span>
                        <button 
                            onClick={handleAnalyze}
                            disabled={!inputText.trim() || isAnalyzing}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                !inputText.trim() || isAnalyzing 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                            }`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Terminal className="w-4 h-4" /> Scan Payload
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Feature Grid / Dashboard Summary */}
                <StatsDashboard />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 pb-8">
                    {[
                        { icon: Server, title: "Docker Integration", desc: "Run Ollama or custom models locally to keep data completely on-prem." },
                        { icon: FileText, title: "Smart Parsing", desc: "Context-aware extraction for names, keys, and messy unstructured data." },
                        { icon: Shield, title: "Policy Enforcement", desc: "Define rigid rules for what can leave your environment." }
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl border border-gray-800 bg-surface/30 hover:bg-surface/50 transition-colors">
                            <item.icon className="w-6 h-6 text-gray-400 mb-3" />
                            <h3 className="font-semibold text-gray-200 mb-1">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                    ))}
                </div>

            </div>
            )}

            {view === 'ANALYSIS' && result && (
                <AnalysisView 
                    result={result} 
                    onBack={() => setView('LANDING')} 
                    onSend={handleSend}
                />
            )}

            {view === 'RULES' && (
                <RulesConfig 
                    rules={rules}
                    onToggle={handleToggleRule}
                    onAdd={handleAddRule}
                    onDelete={handleDeleteRule}
                    onUpdate={handleUpdateRule}
                />
            )}

            {view === 'SETTINGS' && (
                <SettingsView />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;