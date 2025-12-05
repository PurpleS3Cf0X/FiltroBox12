
import React, { useState, useEffect } from 'react';
import { Rule, SensitivityLevel, PiiType } from '../types';
import { Settings, Plus, ToggleLeft, ToggleRight, Database, X, AlertCircle, Save, Play, Check, Edit, Trash2, Search, Filter } from 'lucide-react';

interface RulesConfigProps {
  rules: Rule[];
  onToggle: (id: string) => void;
  onAdd: (rule: Rule) => void;
  onUpdate: (rule: Rule) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

export const RulesConfig: React.FC<RulesConfigProps> = ({ rules, onToggle, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; pattern?: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Testing State
  const [testData, setTestData] = useState('');
  const [testResult, setTestResult] = useState<{ match: boolean; message: string } | null>(null);

  const [formState, setFormState] = useState<{
    name: string;
    description: string;
    pattern: string;
    level: SensitivityLevel;
  }>({
    name: '',
    description: '',
    pattern: '',
    level: SensitivityLevel.MEDIUM
  });

  // Filtered Rules
  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTestRegex = () => {
    if (!formState.pattern) {
        setTestResult({ match: false, message: 'Enter a regex pattern above first.' });
        return;
    }
    if (!testData) {
        setTestResult({ match: false, message: 'Enter sample data to test.' });
        return;
    }

    try {
        const regex = new RegExp(formState.pattern);
        const match = regex.exec(testData);
        if (match) {
            setTestResult({ match: true, message: `Match Found: "${match[0]}"` });
        } else {
            setTestResult({ match: false, message: 'No match found.' });
        }
    } catch (e) {
        setTestResult({ match: false, message: 'Invalid Regex syntax.' });
    }
  };

  const handleOpenModal = (rule?: Rule) => {
      setError(null);
      setFieldErrors({});
      setTestData('');
      setTestResult(null);

      if (rule) {
          setEditingId(rule.id);
          setFormState({
              name: rule.name,
              description: rule.description,
              pattern: rule.pattern || '',
              level: rule.level
          });
      } else {
          setEditingId(null);
          setFormState({
            name: '',
            description: '',
            pattern: '',
            level: SensitivityLevel.MEDIUM
          });
      }
      setIsModalOpen(true);
  };

  const handleSave = () => {
    setError(null);
    const newFieldErrors: { name?: boolean; pattern?: boolean } = {};
    let hasError = false;

    // Name Validation
    if (!formState.name.trim()) {
        newFieldErrors.name = true;
        setError('Rule name is required.');
        hasError = true;
    }
    
    // Regex Validation: Only validate if provided
    if (formState.pattern.trim()) {
        try {
            new RegExp(formState.pattern);
        } catch (e) {
            newFieldErrors.pattern = true;
            setError('Invalid Regular Expression format.');
            hasError = true;
        }
    }

    setFieldErrors(newFieldErrors);

    if (hasError) {
        return;
    }

    if (editingId) {
        // Update existing
        const originalRule = rules.find(r => r.id === editingId);
        if (originalRule) {
            const updatedRule: Rule = {
                ...originalRule,
                name: formState.name,
                description: formState.description,
                level: formState.level,
                pattern: formState.pattern || undefined,
            };
            onUpdate(updatedRule);
        }
    } else {
        // Create new
        const rule: Rule = {
            id: `custom-${Date.now()}`,
            name: formState.name,
            type: PiiType.CUSTOM,
            description: formState.description || 'Custom detection rule',
            enabled: true,
            level: formState.level,
            pattern: formState.pattern
        };
        onAdd(rule);
    }
    
    handleCloseModal();
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Are you sure you want to delete this rule?")) {
          onDelete(id);
      }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in relative">
       {/* Modal Overlay */}
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
               <div className="bg-surface border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                   <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
                       <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Rule' : 'Add Custom Rule'}</h3>
                       <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                           <X className="w-6 h-6" />
                       </button>
                   </div>
                   
                   <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                       {error && (
                           <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex items-center gap-2 text-red-400 text-sm">
                               <AlertCircle className="w-4 h-4" /> {error}
                           </div>
                       )}

                       <div>
                           <label className={`block text-sm font-medium mb-1 ${fieldErrors.name ? 'text-red-400' : 'text-gray-400'}`}>Rule Name</label>
                           <input 
                               type="text" 
                               value={formState.name}
                               onChange={e => setFormState({...formState, name: e.target.value})}
                               placeholder="e.g. Internal Project ID"
                               className={`w-full bg-background border rounded-lg px-4 py-2 text-white focus:outline-none transition-colors ${
                                   fieldErrors.name 
                                   ? 'border-red-500 focus:border-red-500 placeholder:text-red-500/50' 
                                   : 'border-gray-700 focus:border-primary'
                               }`}
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                           <input 
                               type="text" 
                               value={formState.description}
                               onChange={e => setFormState({...formState, description: e.target.value})}
                               placeholder="What does this detect?"
                               className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                           />
                       </div>

                       <div>
                           <label className={`block text-sm font-medium mb-1 ${fieldErrors.pattern ? 'text-red-400' : 'text-gray-400'}`}>
                               Regex Pattern {editingId && <span className="text-gray-600 font-normal">(Optional)</span>}
                           </label>
                           <input 
                               type="text" 
                               value={formState.pattern}
                               onChange={e => setFormState({...formState, pattern: e.target.value})}
                               placeholder="e.g. PROJ-\d{4}"
                               className={`w-full bg-background border rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none transition-colors ${
                                   fieldErrors.pattern 
                                   ? 'border-red-500 focus:border-red-500 placeholder:text-red-500/50' 
                                   : 'border-gray-700 focus:border-primary'
                               }`}
                           />
                           <p className={`text-[10px] mt-1 ${fieldErrors.pattern ? 'text-red-400' : 'text-gray-500'}`}>
                               {fieldErrors.pattern ? 'Invalid Regular Expression syntax.' : 'JavaScript RegExp format supported.'}
                           </p>
                       </div>

                       <div>
                           <label className="block text-sm font-medium text-gray-400 mb-1">Sensitivity Level</label>
                           <select 
                                value={formState.level}
                                onChange={e => setFormState({...formState, level: e.target.value as SensitivityLevel})}
                                className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                           >
                               <option value={SensitivityLevel.LOW}>LOW</option>
                               <option value={SensitivityLevel.MEDIUM}>MEDIUM</option>
                               <option value={SensitivityLevel.HIGH}>HIGH</option>
                           </select>
                       </div>

                        {/* Test Section */}
                        <div className="pt-4 border-t border-gray-800">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Test Rule Validity</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={testData}
                                    onChange={e => setTestData(e.target.value)}
                                    placeholder="Paste sample text to verify pattern..."
                                    className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono focus:border-primary focus:outline-none placeholder:text-gray-600"
                                />
                                <button 
                                    onClick={handleTestRegex}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg border border-gray-700 transition-colors"
                                    title="Run Regex Test"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                            </div>
                            {testResult && (
                                <div className={`mt-2 text-xs flex items-center gap-2 p-2 rounded ${testResult.match ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {testResult.match ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    <span className="font-mono truncate">{testResult.message}</span>
                                </div>
                            )}
                        </div>
                   </div>

                   <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 rounded-b-xl shrink-0">
                       <button 
                           onClick={handleCloseModal}
                           className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                       >
                           Cancel
                       </button>
                       <button 
                           onClick={handleSave}
                           className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                       >
                           <Save className="w-4 h-4" /> {editingId ? 'Update Rule' : 'Save Rule'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="text-primary" /> 
                    Filtering Rules
                </h2>
                <p className="text-secondary mt-1">Manage detection policies and custom patterns.</p>
            </div>
            <button 
                onClick={() => handleOpenModal()}
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
            >
                <Plus className="w-4 h-4" /> New Rule
            </button>
       </div>

       {/* Toolbar */}
       <div className="mb-6 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search rules..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:border-primary focus:outline-none"
                />
            </div>
            {/* Future: Add Filter Dropdown */}
       </div>

       {/* Table View */}
       <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900/50 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="p-5 font-medium w-24">Status</th>
                            <th className="p-5 font-medium">Rule Name</th>
                            <th className="p-5 font-medium">Pattern / Description</th>
                            <th className="p-5 font-medium w-32">Sensitivity</th>
                            <th className="p-5 font-medium text-right w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredRules.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No rules found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredRules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-5">
                                        <button 
                                            onClick={() => onToggle(rule.id)}
                                            className="focus:outline-none transition-transform active:scale-95"
                                            title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                                        >
                                            {rule.enabled ? (
                                                <ToggleRight className="w-8 h-8 text-accent" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-gray-600" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-primary/10 text-primary' : 'bg-gray-800 text-gray-500'}`}>
                                                <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className={`font-semibold ${rule.enabled ? 'text-gray-200' : 'text-gray-500'}`}>{rule.name}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{rule.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-sm text-gray-400">{rule.description}</div>
                                        {rule.pattern && (
                                            <code className="text-xs bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 mt-1 inline-block text-gray-300 font-mono">
                                                {rule.pattern}
                                            </code>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            rule.level === SensitivityLevel.HIGH ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            rule.level === SensitivityLevel.MEDIUM ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                            {rule.level}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(rule)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Edit Rule"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(rule.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Rule"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <div>Showing {filteredRules.length} rules</div>
                <div className="flex items