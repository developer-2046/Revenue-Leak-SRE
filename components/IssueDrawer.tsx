import { useState } from 'react';
import { LeakIssue, FunnelRecord, FixPack } from '@/lib/types';
import { generateFixPack } from '@/lib/fix-generator';
import { X, Zap, CheckCircle, Copy, Slack } from 'lucide-react';

interface IssueDrawerProps {
    issue: LeakIssue | null;
    record: FunnelRecord | null;
    onClose: () => void;
    onRunFix: (pack: FixPack) => void;
}

export function IssueDrawer({ issue, record, onClose, onRunFix }: IssueDrawerProps) {
    const [fixPack, setFixPack] = useState<FixPack | null>(null);

    if (!issue || !record) return null;

    const handleGenerateValues = () => {
        const pack = generateFixPack(issue, record);
        setFixPack(pack);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{issue.issue_type}</h2>
                        <p className="text-sm text-gray-500">Record: {record.name} ({record.company})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Context Card */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide mb-2">Why this matters</h3>
                        <p className="text-gray-900 mb-2">{issue.explanation}</p>
                        <div className="flex justify-between items-end mt-4">
                            <div>
                                <span className="text-xs text-gray-500 uppercase">Estimated Loss</span>
                                <p className="text-2xl font-bold text-rose-600">${issue.estimated_loss_usd?.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Fix Section */}
                    <div>
                        {!fixPack ? (
                            <button
                                onClick={handleGenerateValues}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
                            >
                                <Zap /> Generate Fix Pack
                            </button>
                        ) : (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2 text-indigo-700 mb-2">
                                    <CheckCircle size={20} />
                                    <h3 className="font-bold text-lg">Fix Pack Generated</h3>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700 flex justify-between">
                                        <span>Action Plan: {fixPack.title}</span>
                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">ID: {fixPack.fix_id}</span>
                                    </div>
                                    <div className="p-4">
                                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                            {fixPack.steps.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>

                                {fixPack.email_draft && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <h4 className="font-bold text-blue-900 mb-2 text-sm uppercase">Email Draft</h4>
                                        <div className="bg-white p-3 rounded border border-blue-100 text-sm text-gray-800 whitespace-pre-wrap font-mono">
                                            <div className="text-gray-500 mb-2">Subject: {fixPack.email_draft.subject}</div>
                                            {fixPack.email_draft.body}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                                        Automation Payload
                                        <Copy size={14} className="cursor-pointer text-gray-400 hover:text-gray-600" />
                                    </h4>
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto font-mono">
                                        {JSON.stringify(fixPack.automation_payload, null, 2)}
                                    </pre>
                                </div>

                                <div className="pt-4 sticky bottom-0 bg-white pb-6 border-t border-gray-100">
                                    <button
                                        onClick={() => onRunFix(fixPack)}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                    >
                                        <Slack /> Run Fix #1 (Live)
                                    </button>
                                    <p className="text-center text-xs text-gray-400 mt-2">Triggers Slack webhook & logs activity</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
