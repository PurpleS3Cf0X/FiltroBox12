
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
  AlertOctagon,
  Siren,
  ListFilter
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

  // Group entities by type to show "Flagged Rules"
  const flaggedRules = useMemo(() => {
      const stats: Record<string, { count: number, level: SensitivityLevel }> = {};
      result.entities.forEach(e => {
          if (!stats[e.type]) {
              stats[e.type] = { count: 0, level: e.level };
          }
          stats[e.type].count++;
          // Upgrade level if we find a higher sensitivity for the same type (rare but safe)
          if (e.level === SensitivityLevel.HIGH) stats[e.type].level = SensitivityLevel.HIGH;
      });
      return Object.entries(stats).sort((a, b) => {
          // Sort by Priority (High > Med > Low), then by Count
          const priority = { [SensitivityLevel.HIGH]: 3, [SensitivityLevel.MEDIUM]: 2, [SensitivityLevel.LOW]: 1 };
          const diff = priority[b[1].level] - priority[a[1].level];
          return diff !== 0 ? diff : b[1].count - a[1].count;
      });
  }, [result.entities]);

  // Sort individual entities for the list (High -> Low)
  const sortedEntities = useMemo(() => {
    return [...result.entities].sort((a, b) => {
        const priority = { [SensitivityLevel.HIGH]: 3, [SensitivityLevel.MEDIUM]: 2, [SensitivityLevel.LOW]: 1 };
        return priority[b.level] - priority[a.level];
    });
  }, [result.entities]);

  // Dynamically generate the preview based on active toggles
  const dynamicSanitizedText = useMemo(() => {
    let text = result.originalText;
    // Sort entities by length desc to avoid partial replacement issues (basic approach)
    const sortedByLen = [...result.entities].sort((a, b) => b.text.length - a.text.length);
    
    sortedByLen.forEach(entity => {
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
    
    // Sort by position (simulated here by finding index)
    const entitiesWithIndex = result.entities.map(e => {
        const idx = text.indexOf(e.text); 
        return { ...e, idx };
    }).filter(e => e.idx !== -1).sort((a, b) => a.idx - b.idx);

    if (entitiesWithIndex.length === 0) return <span>{text}</span>;

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
    <div className="w-full max-w-[1600px] mx-auto p-4 animate-fade-in pb-20">
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-accent" /> 
                    Analysis Complete
                </h2>
                <div className="flex items-center gap-4 mt-2">
                    <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-xs font-mono border border-gray-700">
                        {result.processingTime}ms processing
                    </span>
                    <span className={`px-3 py-1 rounded text-xs font-bold border ${result.riskScore > 70 ? 'bg-red-500/10 text-red-400 border-red-500/20' : result.riskScore > 30 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                        Risk Score: {result.riskScore}/100
                    </span>
                </div>
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

        {/* AI Insight Section (Summary) */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <FileText className="w-32 h-32 text-white" />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-2 text-primary mb-1">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">AI Executive Summary</span>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{result.classification}</h3>
                    <p className="text-gray-400 leading-relaxed max-w-4xl text-sm md:text-base">
                        {result.summary}
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Rules & Detections (4 cols wide) */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Section: Flagged Rules / Policy Violations */}
                <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                            <Siren className="w-4 h-4 text-red-400" /> Policy Violations
                        </h3>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                            {flaggedRules.length} Rules Triggered
                        </span>
                    </div>
                    <div className="p-2">
                        {flaggedRules.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500/50" />
                                No policy violations detected.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {flaggedRules.map(([type, stats]) => (
                                    <div key={type} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                stats.level === SensitivityLevel.HIGH ? 'bg-red-500' :
                                                stats.level === SensitivityLevel.MEDIUM ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}></div>
                                            <span className="text-sm font-medium text-gray-300">{type}</span>
                                        </div>
                                        <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-1 rounded">
                                            {stats.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Section: Individual Detections List */}
                <div className="bg-surface rounded-xl border border-gray-800 h-[500px] flex flex-col shadow-lg">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-primary" /> Detection Log
                        </h3>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                            {result.entities.length} Total
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {sortedEntities.length === 0 ? (
                             <div className="text-center text-gray-500 py-10">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>Clean document.</p>
                             </div>
                        ) : (
                            sortedEntities.map((entity) => {
                                const isActive = activeEntities.has(entity.id);
                                return (
                                    <div 
                                        key={entity.id}
                                        onClick={() => toggleEntity(entity.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                                            isActive 
                                            ? 'bg-gray-800/80 border-gray-700 hover:border-gray-600' 
                                            : 'bg-transparent border-transparent hover:bg-gray-800/30 opacity-60'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <AlertOctagon className={`w-3 h-3 ${
                                                    entity.level === SensitivityLevel.HIGH ? 'text-red-500' :
                                                    entity.level === SensitivityLevel.MEDIUM ? 'text-orange-500' : 'text-blue-500'
                                                }`} />
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                                                    entity.level === SensitivityLevel.HIGH ? 'bg-red-500/10 text-red-400' :
                                                    entity.level === SensitivityLevel.MEDIUM ? 'bg-orange-500/10 text-orange-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                    {entity.type}
                                                </span>
                                            </div>
                                            {isActive ? <Eye className="w-3 h-3 text-gray-400" /> : <EyeOff className="w-3 h-3 text-gray-500" />}
                                        </div>
                                        <div className="text-sm font-mono text-gray-300 truncate pl-5" title={entity.text}>
                                            {entity.text}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Main Content Preview (8 cols wide) */}
            <div className="lg:col-span-8 space-y-4">
                <div className="bg-surface rounded-xl border border-gray-800 h-[700px] flex flex-col shadow-2xl">
                    <div className="flex items-center border-b border-gray-800 bg-gray-900/30">
                        <button
                            onClick={() => setMode('HIGHLIGHT')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                                mode === 'HIGHLIGHT' ? 'border-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                            }`}
                        >
                            Analysis View <span className="text-xs text-gray-600 ml-2">(Edit Redactions)</span>
                        </button>
                        <button
                            onClick={() => setMode('SANITIZED')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                                mode === 'SANITIZED' ? 'border-accent text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                            }`}
                        >
                            Output Preview <span className="text-xs text-gray-600 ml-2">(Final Payload)</span>
                        </button>
                    </div>

                    <div className="relative flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-gray-300 custom-scrollbar">
                        {mode === 'HIGHLIGHT' ? (
                             <div className="whitespace-pre-wrap break-words">
                                {renderHighlightedText()}
                             </div>
                        ) : (
                            <div className="whitespace-pre-wrap break-words text-accent/90">
                                {dynamicSanitizedText}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-800 bg-gray-900/80 backdrop-blur flex justify-between items-center text-xs text-gray-500">
                        <span>Characters: {result.originalText.length}</span>
                        <div className="flex items-center gap-2">
                             <AlertTriangle className="w-3 h-3 text-warning" />
                             <span>Redacted data is permanently removed from the payload.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
