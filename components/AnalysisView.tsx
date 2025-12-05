
import React, { useState, useMemo } from 'react';
import { AnalysisResult, PiiEntity, SensitivityLevel } from '../types';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  Info
} from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  onBack: () => void;
  onSend: (sanitizedText: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onBack, onSend }) => {
  const [mode, setMode] = useState<'HIGHLIGHT' | 'SANITIZED'>('HIGHLIGHT');
  const [activeEntities, setActiveEntities] = useState<Set<string>>(
    new Set(result.entities.map(e => e.id))
  );

  const toggleEntity = (id: string) => {
    const next = new Set(activeEntities);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setActiveEntities(next);
  };

  // Dynamically generate the preview based on active toggles
  const dynamicSanitizedText = useMemo(() => {
    let text = result.originalText;
    // Sort entities by length desc to avoid partial replacement issues (basic approach)
    const sortedEntities = [...result.entities].sort((a, b) => b.text.length - a.text.length);
    
    sortedEntities.forEach(entity => {
      if (activeEntities.has(entity.id)) {
        // Use a split/join to replace all occurrences for this demo
        text = text.split(entity.text).join(entity.replacement);
      }
    });
    return text;
  }, [result.originalText, result.entities, activeEntities]);

  // Render text with highlights
  const renderHighlightedText = () => {
    let parts: React.ReactNode[] = [];
    const text = result.originalText;

    // We need to find the indices of the entities in the text
    // For this simple implementation, we will locate them sequentially
    // Note: In production, index data should come from the backend to handle duplicate words correctly
    
    // Sort by position (simulated here by finding index)
    const entitiesWithIndex = result.entities.map(e => {
        const idx = text.indexOf(e.text); 
        return { ...e, idx };
    }).filter(e => e.idx !== -1).sort((a, b) => a.idx - b.idx);

    // Simple robust highlighting approach: 
    // This is a simplified "first match" highlighter. 
    // A robust one requires exact start/end offsets from the AI.
    
    if (entitiesWithIndex.length === 0) return <span>{text}</span>;

    // Use a regex splitter approach for visualization if simple
    // Or just overlay logic. Let's try a regex construction for all entities.
    const patterns = result.entities.map(e => e.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!patterns) return <span>{text}</span>;

    const regex = new RegExp(`(${patterns})`, 'g');
    const splitText = text.split(regex);

    return splitText.map((part, index) => {
      const match = result.entities.find(e => e.text === part);
      if (match) {
         const isActive = activeEntities.has(match.id);
         const colorClass = match.level === SensitivityLevel.HIGH 
            ? 'bg-red-500/30 text-red-200 border-red-500/50' 
            : match.level === SensitivityLevel.MEDIUM
            ? 'bg-orange-500/30 text-orange-200 border-orange-500/50'
            : 'bg-blue-500/30 text-blue-200 border-blue-500/50';
         
         return (
            <span 
                key={index} 
                className={`relative inline-block border-b-2 px-1 rounded cursor-pointer transition-colors ${isActive ? colorClass : 'bg-transparent border-transparent text-gray-400'}`}
                onClick={() => toggleEntity(match.id)}
                title={`Click to ${isActive ? 'reveal' : 'redact'}`}
            >
                {part}
                {isActive && (
                    <span className="absolute -top-3 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                    </span>
                )}
            </span>
         );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in">
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-accent" /> 
                    Analysis Complete
                </h2>
                <p className="text-secondary mt-1">
                    Found <span className="text-white font-mono font-bold">{result.entities.length}</span> sensitive items. 
                    Risk Score: <span className={`${result.riskScore > 70 ? 'text-danger' : result.riskScore > 30 ? 'text-warning' : 'text-accent'}`}>{result.riskScore}/100</span>
                </p>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={onBack}
                    className="px-4 py-2 text-sm text-secondary hover:text-white transition-colors"
                >
                    Discard
                </button>
                <button 
                    onClick={() => onSend(dynamicSanitizedText)}
                    className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
                >
                    Approve & Send <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Document Context Card */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-200">Document Context</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-700 text-gray-300 border border-gray-600">
                            {result.classification}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">
                        {result.summary}
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar - Detected Items */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-surface rounded-xl p-4 border border-gray-800 h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-200">Detections</h3>
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400 font-mono">
                            {result.processingTime}ms
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {result.entities.length === 0 ? (
                             <div className="text-center text-gray-500 py-10">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No sensitive data found.</p>
                             </div>
                        ) : (
                            result.entities.map((entity) => {
                                const isActive = activeEntities.has(entity.id);
                                return (
                                    <div 
                                        key={entity.id}
                                        onClick={() => toggleEntity(entity.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            isActive 
                                            ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                                            : 'bg-transparent border-transparent hover:bg-gray-800/30 opacity-60'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                entity.level === SensitivityLevel.HIGH ? 'bg-red-500/20 text-red-400' :
                                                entity.level === SensitivityLevel.MEDIUM ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {entity.type}
                                            </span>
                                            {isActive ? <Eye className="w-3 h-3 text-gray-400" /> : <EyeOff className="w-3 h-3 text-gray-500" />}
                                        </div>
                                        <div className="text-sm font-mono text-gray-300 truncate" title={entity.text}>
                                            {entity.text}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3" /> {entity.replacement}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Preview */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-surface rounded-xl border border-gray-800 h-[600px] flex flex-col">
                    <div className="flex items-center border-b border-gray-800">
                        <button
                            onClick={() => setMode('HIGHLIGHT')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                                mode === 'HIGHLIGHT' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            Analysis View
                        </button>
                        <button
                            onClick={() => setMode('SANITIZED')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                                mode === 'SANITIZED' ? 'border-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            Output Preview
                        </button>
                    </div>

                    <div className="relative flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-gray-300">
                        {mode === 'HIGHLIGHT' ? (
                             <div className="whitespace-pre-wrap break-words">
                                {renderHighlightedText()}
                             </div>
                        ) : (
                            <div className="whitespace-pre-wrap break-words text-accent/80">
                                {dynamicSanitizedText}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center text-xs text-gray-500">
                        <span>Characters: {result.originalText.length}</span>
                        <div className="flex items-center gap-2">
                             <AlertTriangle className="w-3 h-3 text-warning" />
                             <span>Always verify before sending.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
