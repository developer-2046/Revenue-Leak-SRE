import { FixPack, FixPackStep } from '@/lib/types';
import { Terminal, Code, ArrowRight } from 'lucide-react';

interface FixPackDSLViewerProps {
    steps: FixPackStep[];
}

export function FixPackDSLViewer({ steps }: FixPackDSLViewerProps) {
    if (!steps || steps.length === 0) return null;

    return (
        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-lg overflow-hidden font-mono text-sm leading-relaxed shadow-inner">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-2 text-gray-300">
                    <Terminal size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Fix Pack DSL Preview</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-50"></div>
                </div>
            </div>
            <div className="p-4 text-green-400 overflow-x-auto">
                <div className="flex flex-col gap-2">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 group">
                            <span className="text-gray-600 select-none w-6 text-right">{idx + 1}</span>
                            <div>
                                <span className="text-purple-400 font-bold">{step.action}</span>
                                <span className="text-gray-500"> (</span>
                                <span className="text-blue-300">
                                    {Object.entries(step.params || {}).map(([k, v]) => `${k}="${v}"`).join(', ')}
                                </span>
                                <span className="text-gray-500">)</span>
                                <div className="text-gray-500 text-xs mt-0.5 ml-2 border-l border-gray-700 pl-2 italic">
                                    // {step.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800 text-gray-500 text-xs">
                    <span className="animate-pulse">_</span>
                </div>
            </div>
        </div>
    );
}
