import { useState } from 'react';
import { LeakIssue, FunnelRecord, FixPack } from '@/lib/types';
import { generateFixPack } from '@/lib/fix-generator';
import { X, Zap, CheckCircle, Copy, Slack, ShieldCheck, History, AlertTriangle, Microscope, ArrowRight } from 'lucide-react';
import { FixPackPreview } from './FixPackPreview';
import { ImpactedRecord } from '@/lib/fixpack';
import { logAuditEvent } from '@/lib/audit';

interface IssueDrawerProps {
    issue: LeakIssue | null;
    record: FunnelRecord | null;
    onClose: () => void;
    onRunFix: (pack: FixPack) => void;
}

export function IssueDrawer({ issue, record, onClose, onRunFix }: IssueDrawerProps) {
    const [fixPack, setFixPack] = useState<FixPack | null>(null);
    const [diff, setDiff] = useState<ImpactedRecord | null>(null);
    const [isApplied, setIsApplied] = useState(false);

    if (!issue || !record) {
        console.log("IssueDrawer: Missing props", { issue, record });
        return null;
    }
    console.log("IssueDrawer: Rendering", { type: issue.issue_type, recordId: record.id });

    const handleGenerateValues = () => {
        const pack = generateFixPack(issue, record);
        setFixPack(pack);

        // Simulate diff generation based on fix type
        const changes = [];
        if (issue.issue_type === 'SLA_BREACH_UNTOUCHED') {
            changes.push({ field: 'last_touch_at', oldValue: record.last_touch_at, newValue: 'Now' });
            changes.push({ field: 'owner', oldValue: record.owner, newValue: 'Antigravity' });
        } else if (issue.issue_type === 'UNASSIGNED_OWNER') {
            changes.push({ field: 'owner', oldValue: null, newValue: 'Antigravity' });
        } else if (issue.issue_type === 'STALE_OPP') {
            changes.push({ field: 'last_touch_at', oldValue: record.last_touch_at, newValue: 'Now' });
            changes.push({ field: 'notes', oldValue: record.notes, newValue: (record.notes || '') + ' [Rescued]' });
        } else if (issue.issue_type === 'DUPLICATE_SUSPECT') {
            changes.push({ field: 'notes', oldValue: record.notes, newValue: (record.notes || '') + ' [Merged]' });
            changes.push({ field: 'status', oldValue: 'Active', newValue: 'Archived (Merged)' });
        } else if (issue.issue_type === 'NO_NEXT_STEP') {
            changes.push({ field: 'next_step', oldValue: null, newValue: 'Follow up task' });
        } else {
            changes.push({ field: 'notes', oldValue: record.notes, newValue: (record.notes || '') + ' [Fixed]' });
        }

        setDiff({
            recordId: record.id,
            changes: changes as any
        });
    };

    const handleApprove = () => {
        if (!fixPack) return;
        onRunFix(fixPack);
        setIsApplied(true);
        logAuditEvent('APPLY_FIX', `Applied fix ${fixPack.fix_id} to record ${record.id}`, record.id);
    };

    // Restore initial state on issue change
    if (isApplied && fixPack && fixPack.fix_id !== `fix_${issue.issue_id}`) {
        setIsApplied(false);
        setFixPack(null);
    }

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-gray-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-white">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider">
                                SEV {issue.severity}
                            </span>
                            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">ID: {issue.issue_id}</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{issue.issue_type}</h2>
                        <p className="text-gray-500 font-medium">{record.name} • {record.company}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">

                    {/* SECTION 1: WHAT */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="bg-blue-500/5 w-1 absolute top-0 bottom-0 left-0"></div>
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">What Happened?</h3>
                                <p className="text-gray-600 leading-relaxed">{issue.explanation}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-8 border-t border-gray-100 pt-4">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Impact</span>
                                <span className="text-xl font-bold text-gray-900 font-mono">-${issue.estimated_loss_usd.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Budget Burn</span>
                                <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                                    -{issue.error_budget_impact} pts
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: WHY */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="bg-orange-500/5 w-1 absolute top-0 bottom-0 left-0"></div>
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-50 text-orange-600 p-3 rounded-lg shrink-0">
                                <Microscope size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">Why It Happened</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-gray-700 font-medium mb-1">Root Cause Analysis</p>
                                        <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {issue.root_cause_guess || 'Automated analysis suggests a process gap in the sales handover workflow.'}
                                        </p>
                                    </div>

                                    {issue.blast_radius && issue.blast_radius.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Blast Radius</span>
                                            <div className="flex flex-wrap gap-2">
                                                {issue.blast_radius.map(tag => (
                                                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md uppercase tracking-wide border border-gray-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: HOW */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="bg-green-500/5 w-1 absolute top-0 bottom-0 left-0"></div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg shrink-0">
                                <Zap size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Remediation Plan</h3>
                        </div>

                        {!fixPack ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-4 text-sm font-medium">Automated Fix Pack Available</p>
                                <button
                                    onClick={handleGenerateValues}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    <Zap size={18} /> Generate Remediation Plan
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Action Plan */}
                                <div className="ml-2 pl-6 border-l-2 border-indigo-100 space-y-6 relative">
                                    {fixPack.steps.map((step, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-800 text-sm font-medium leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>

                                {diff && (
                                    <div className="mt-6">
                                        <FixPackPreview record={record} impactedRecord={diff} steps={fixPack.workflow_steps} />
                                    </div>
                                )}

                                <div className="pt-6 border-t border-gray-100">
                                    {!isApplied ? (
                                        <button
                                            onClick={handleApprove}
                                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                                        >
                                            <ShieldCheck size={20} /> Execute Fix Pack
                                        </button>
                                    ) : (
                                        <button disabled className="w-full py-4 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-lg flex items-center justify-center gap-3 cursor-not-allowed">
                                            <CheckCircle size={20} /> Fix Applied Successfully
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
