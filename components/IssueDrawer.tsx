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
        <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col justify-center items-center overflow-hidden">

            {/* Drawer (Now Page Slab) */}
            <div className="relative w-full max-w-7xl h-5/6 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
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
                    <button onClick={onClose} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors text-gray-700 font-bold text-sm uppercase tracking-wide">
                        <ArrowRight className="rotate-180" size={16} /> Go Back
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50/50">

                    <div className="space-y-6">

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

                    </div>

                    {/* Right Column: Fix Action */}
                    <div className="h-full">
                        <div className="bg-white h-full p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                            <div className="flex items-center gap-3 mb-6 text-green-700">
                                <Zap size={24} />
                                <h3 className="text-xl font-bold">Remediation Plan</h3>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                {!fixPack ? (
                                    <div className="text-center">
                                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Zap size={32} className="text-gray-400" />
                                        </div>
                                        <h4 className="text-gray-900 font-bold text-lg mb-2">Automated Fix Available</h4>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Our engine has generated a safe, atomic fix pack for this issue. Click below to review.</p>
                                        <button
                                            onClick={handleGenerateValues}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all font-sans"
                                        >
                                            Generate Fix Pack
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="space-y-4">
                                            {fixPack.steps.map((step, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mt-0.5">{i + 1}</div>
                                                    <p className="text-gray-800 font-medium">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {diff && (
                                            <div className="mt-6 border-t border-gray-100 pt-6">
                                                <FixPackPreview record={record} impactedRecord={diff} steps={fixPack.workflow_steps} />
                                            </div>
                                        )}
                                        <div className="border-t border-gray-100 pt-6">
                                            {!isApplied ? (
                                                <button
                                                    onClick={handleApprove}
                                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                                >
                                                    <ShieldCheck /> Execute Fix Pack
                                                </button>
                                            ) : (
                                                <button disabled className="w-full py-4 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                                                    <CheckCircle /> Fix Applied Successfully
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
