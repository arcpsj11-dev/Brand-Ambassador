import React, { useState } from 'react';
import { useExperimentStore } from '../../store/useExperimentStore';
import { Plus, Trash2, Play, Pause, Beaker, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExperimentManager: React.FC = () => {
    const { experiments, createExperiment, addVariant, setExperimentStatus, deleteExperiment } = useExperimentStore();
    const [isCreating, setIsCreating] = useState(false);

    // Form States
    const [newExpName, setNewExpName] = useState('');
    const [newExpStep, setNewExpStep] = useState<any>('STEP4_BODY');
    const [newExpDesc, setNewExpDesc] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createExperiment({
            name: newExpName,
            targetStep: newExpStep,
            description: newExpDesc,
            status: 'DRAFT'
        });
        setIsCreating(false);
        setNewExpName('');
    };

    const handleAddVariant = (expId: string) => {
        const name = prompt("Variant Name (e.g. B - Logical Tone):");
        if (!name) return;
        const promptContent = prompt("Enter Prompt Content (Use {{title}} for placeholders):");
        if (!promptContent) return;

        addVariant(expId, {
            id: Date.now().toString().slice(-4),
            name,
            promptContent,
            trafficWeight: 50,
            isActive: true,
        });
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black italic flex items-center gap-2">
                        <Beaker className="text-brand-primary" />
                        PROMPT LAB <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded not-italic">INTERNAL ONLY</span>
                    </h2>
                    <p className="text-gray-400 text-sm">A/B Testing & Evolution Engine</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"
                >
                    <Plus size={16} /> New Experiment
                </button>
            </header>

            {isCreating && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border border-brand-primary/50">
                    <h3 className="font-bold mb-4">Create New Experiment</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="Experiment Name"
                                className="bg-black/40 border border-white/10 p-2 rounded"
                                value={newExpName} onChange={e => setNewExpName(e.target.value)} required
                            />
                            <select
                                className="bg-black/40 border border-white/10 p-2 rounded"
                                value={newExpStep} onChange={e => setNewExpStep(e.target.value)}
                            >
                                <option value="STEP1_KEYWORDS">STEP 1: Keywords</option>
                                <option value="STEP2_TITLE">STEP 2: Title</option>
                                <option value="STEP3_INTRO">STEP 3: Intro</option>
                                <option value="STEP4_BODY">STEP 4: Body</option>
                                <option value="STEP5_TONE">STEP 5: Tone</option>
                            </select>
                        </div>
                        <input
                            placeholder="Hypothesis / Description"
                            className="bg-black/40 border border-white/10 p-2 rounded w-full"
                            value={newExpDesc} onChange={e => setNewExpDesc(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                            <button type="submit" className="bg-brand-primary text-black px-4 py-2 rounded font-bold">Create</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="grid gap-6">
                {experiments.map(exp => (
                    <div key={exp.id} className="glass-card p-6 relative group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold">{exp.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${exp.status === 'RUNNING' ? 'bg-green-500/20 text-green-500' :
                                            exp.status === 'DRAFT' ? 'bg-gray-500/20 text-gray-500' : 'bg-red-500/20 text-red-500'
                                        }`}>
                                        {exp.status}
                                    </span>
                                    <span className="text-xs border border-white/10 px-2 py-0.5 rounded text-gray-400">{exp.targetStep}</span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">{exp.description}</p>
                            </div>
                            <div className="flex gap-2">
                                {exp.status !== 'RUNNING' ? (
                                    <button onClick={() => setExperimentStatus(exp.id, 'RUNNING')} className="p-2 hover:bg-green-500/20 rounded text-green-500" title="Start">
                                        <Play size={18} />
                                    </button>
                                ) : (
                                    <button onClick={() => setExperimentStatus(exp.id, 'CLOSED')} className="p-2 hover:bg-yellow-500/20 rounded text-yellow-500" title="Pause/Close">
                                        <Pause size={18} />
                                    </button>
                                )}
                                <button onClick={() => deleteExperiment(exp.id)} className="p-2 hover:bg-red-500/20 rounded text-red-500" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Variants List */}
                        <div className="space-y-3">
                            {exp.variants.map(variant => (
                                <div key={variant.id} className="bg-black/20 rounded-lg p-4 border border-white/5 flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-brand-primary">{variant.name || variant.id}</span>
                                            {variant.isActive ? <CheckCircle2 size={14} className="text-green-500" /> : <span className="text-xs text-gray-600">INACTIVE</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1 font-mono">{variant.promptContent}</p>
                                    </div>
                                    <div className="flex items-center gap-6 px-4">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">TRIGGERS</div>
                                            <div className="font-mono font-bold text-lg">{variant.metrics.generationCount}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">WEIGHT</div>
                                            <div className="font-mono text-sm">{variant.trafficWeight}%</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            alert(variant.promptContent);
                                        }}
                                        className="text-xs text-gray-500 hover:text-white"
                                    >
                                        VIEW
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => handleAddVariant(exp.id)}
                                className="w-full py-3 border border-dashed border-white/10 rounded-lg text-gray-500 hover:text-white hover:border-white/30 transition-colors text-sm flex justify-center items-center gap-2"
                            >
                                <Plus size={14} /> Add Variant
                            </button>
                        </div>
                    </div>
                ))}

                {experiments.length === 0 && !isCreating && (
                    <div className="text-center py-20 text-gray-600">
                        <Beaker size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No active experiments. Start researching!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
