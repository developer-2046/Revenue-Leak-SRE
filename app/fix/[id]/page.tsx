'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FunnelRecord, LeakIssue, FixPack } from '@/lib/types';
import { generateSampleData } from '@/lib/sample-data'; // Fallback
import { parseCSV } from '@/lib/csv';
import { scanForLeaks } from '@/lib/scanner';
import { calculateImpact } from '@/lib/impact';
import { generateFixPack } from '@/lib/fix-generator';
import { FixPackPreview } from '@/components/IssueDrawer'; // We might need to extract this or inline it
import { ArrowRight, ShieldCheck, AlertTriangle, Microscope, Zap, CheckCircle, Home, Siren } from 'lucide-react';
import { ImpactedRecord } from '@/lib/fixpack';

// Duplicate FixPackPreview here to avoid export mess if it wasn't exported
function FixPackDiff({ record, impactedRecord, steps }: { record: FunnelRecord, impactedRecord: ImpactedRecord, steps: string[] }) {
    if (!impactedRecord || !impactedRecord.changes) return null;

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden font-mono text-sm shadow-inner">
            <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
                <span className="text-gray-400">Proposed Changes ({impactedRecord.changes.length})</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    ID: {record.id}
                </span>
            </div>
            <div className="p-4 space-y-1">
                {impactedRecord.changes.map((change: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-4">
                        <div className="col-span-3 text-gray-500 text-right">{change.field}:</div>
                        <div className="col-span-9 flex gap-2">
                            <span className="text-red-400 line-through opacity-70">
                                {String(change.oldValue ?? 'null')}
                            </span>
                            <span className="text-gray-600">→</span>
                            <span className="text-green-400 font-bold">
                                {String(change.newValue)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FixPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [issue, setIssue] = useState<LeakIssue | null>(null);
    const [record, setRecord] = useState<FunnelRecord | null>(null);
    const [fixPack, setFixPack] = useState<FixPack | null>(null);
    const [diff, setDiff] = useState<ImpactedRecord | null>(null);
    const [isApplied, setIsApplied] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            // Re-fetch logic (similar to Home)
            let records: FunnelRecord[] = [];
            try {
                const res = await fetch('/demo_funnel.csv');
                if (res.ok) {
                    const text = await res.text();
                    if (text && !text.trim().startsWith('<!DOCTYPE')) {
                        records = parseCSV(text);
                    }
                }
            } catch (e) {
                console.error("Fetch failed", e);
            }

            // Fallback
            if (records.length === 0) {
                // Use embedded data if fetch fails (same as main page fallback)
                // For now, let's assume fetch works or use sample
                records = parseCSV(`id,type,name,email,domain,company,source,region,owner,stage,created_at,last_touch_at,next_step,value_usd,notes
101,lead,Sarah Connor,sarah@sky.net,sky.net,Skynet Cyberdyne,inbound,NA,,New,2023-10-25T08:00:00Z,,,5000,Urgent inquiry - SLA Breach
102,lead,John Smith,john@matrix.com,matrix.com,MetaCortex,outbound,NA,Alice,Contacted,2023-10-24T09:00:00Z,2023-10-26T10:00:00Z,Call scheduled,10000,
103,lead,Darth Vader,vader@empire.gov,empire.gov,Galactic Empire,referral,EMEA,,New,2023-10-20T08:00:00Z,,,50000,
104,opp,Ellen Ripley,ripley@weyland.corp,weyland.corp,Weyland-Yutani,inbound,NA,Bob,Negotiation,2023-09-01T08:00:00Z,2023-10-10T08:00:00Z,,150000,Ghosting?
105,opp,Marty McFly,marty@hillvalley.edu,hillvalley.edu,Hill Valley HS,outbound,NA,Charlie,Qualified,2023-10-01T08:00:00Z,2023-10-27T08:00:00Z,Send proposal,25000,
106,lead,T-800,terminator@sky.net,sky.net,Skynet Cyberdyne,inbound,NA,,New,2023-10-26T08:00:00Z,,,5000,Duplicate suspect?
107,lead,Neo Anderson,neo@matrix.com,matrix.com,MetaCortex,inbound,NA,Alice,New,2023-10-26T09:30:00Z,,,10000,Duplicate
108,opp,James Bond,007@mi6.gov.uk,mi6.gov.uk,Her Majesty Secret Service,outbound,EMEA,Dave,Discovery,2023-10-15T08:00:00Z,2023-10-16T08:00:00Z,Schedule demo,75000,
109,opp,Indiana Jones,indy@marshall.edu,marshall.edu,Marshall College,referral,NA,Bob,Proposal,2023-09-15T08:00:00Z,2023-10-28T08:00:00Z,Review contract,45000,
110,lead,Luke Skywalker,luke@alliance.org,alliance.org,Rebel Alliance,inbound,NA,,New,2023-10-22T08:00:00Z,,,12000,
111,lead,Han Solo,han@falcon.ship,falcon.ship,Smugglers Inc,outbound,,Charlie,New,2023-10-25T08:00:00Z,,,8000,Routing error
112,opp,Frodo Baggins,frodo@shire.com,shire.com,Ring Bearers Ltd,referral,EMEA,Dave,Closed Won,2023-08-01T08:00:00Z,2023-10-28T08:00:00Z,,1000000,
113,lead,Gandalf Grey,gandalf@wizard.net,wizard.net,Order of Istari,inbound,EMEA,,New,2023-10-21T08:00:00Z,,,500000,Unassigned
114,lead,Harry Potter,harry@hogwarts.edu,hogwarts.edu,Ministry of Magic,inbound,EMEA,,New,2023-10-23T08:00:00Z,,,20000,
115,opp,Tony Stark,tony@stark.com,stark.com,Stark Industries,inbound,NA,Alice,Proposal,2023-09-20T08:00:00Z,2023-10-01T08:00:00Z,,5000000,Stale
116,lead,Bruce Wayne,bruce@wayne.com,wayne.com,Wayne Enterprises,outbound,NA,,New,2023-10-24T08:00:00Z,,,2500000,
117,lead,Clark Kent,clark@dailyplanet.com,dailyplanet.com,Daily Planet,inbound,NA,Bob,Contacted,2023-10-26T08:00:00Z,2023-10-26T09:00:00Z,Interview,500,
118,lead,Peter Parker,peter@bugle.com,bugle.com,Daily Bugle,inbound,NA,Alice,New,2023-10-25T14:00:00Z,,,200,`);
            }

            // Analysis
            const issues = scanForLeaks(records);
            const priced = issues.map(iss => {
                const r = records.find(rec => rec.id === iss.record_id);
                if (!r) return iss;
                const loss = calculateImpact(r, iss.issue_type);
                return { ...iss, estimated_loss_usd: loss };
            });

            const targetIssue = priced.find(i => i.issue_id === id);

            if (targetIssue) {
                setIssue(targetIssue);
                const rec = records.find(r => r.id === targetIssue.record_id);
                setRecord(rec || null);
            }

            setLoading(false);
        }
        loadData();
    }, [id]);

    const handleGenerateValues = () => {
        if (!issue || !record) return;
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

    const handleExecute = () => {
        setIsApplied(true);
        // Delay then redirect
        setTimeout(() => {
            router.push(`/?fixed_issue=${id}&saved=${issue?.estimated_loss_usd}`);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!issue || !record) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Issue Not Found</h1>
                    <p className="text-gray-500 mb-6">Could not locate issue ID: {id}</p>
                    <button onClick={() => router.push('/')} className="text-indigo-600 hover:underline">Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors uppercase tracking-wide text-xs"
                    >
                        <Home size={16} />
                        War Room
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{issue.issue_type}</h2>
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider">
                                SEV {issue.severity}
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium text-sm mt-1">
                            {record.name} - {record.company} <span className="text-gray-300">|</span> ID: {issue.issue_id}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Context & RCA */}
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex items-center gap-3 mb-4 text-blue-700">
                            <AlertTriangle size={24} />
                            <h3 className="text-xl font-bold">What Happened</h3>
                        </div>
                        <p className="text-gray-700 text-lg leading-relaxed">{issue.explanation}</p>
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                            <span className="text-gray-500 font-bold text-sm uppercase">Estimated Loss</span>
                            <span className="text-2xl font-mono font-black text-gray-900">-${issue.estimated_loss_usd?.toLocaleString()}</span>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                        <div className="flex items-center gap-3 mb-4 text-orange-700">
                            <Microscope size={24} />
                            <h3 className="text-xl font-bold">Root Cause Analysis</h3>
                        </div>
                        <p className="text-gray-700 mb-4">{issue.root_cause_guess || 'Standard operating procedure violation detected.'}</p>
                        {issue.blast_radius && (
                            <div className="flex flex-wrap gap-2">
                                {issue.blast_radius.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase border border-gray-200">{tag}</span>
                                ))}
                            </div>
                        )}
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
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all font-sans flex items-center justify-center gap-2"
                                    >
                                        <Zap size={20} /> Generate Fix Pack
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
                                            <FixPackDiff record={record} impactedRecord={diff} steps={fixPack.workflow_steps} />
                                        </div>
                                    )}
                                    <div className="border-t border-gray-100 pt-6">
                                        {!isApplied ? (
                                            <button
                                                onClick={handleExecute}
                                                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                            >
                                                <ShieldCheck /> Execute Fix Pack
                                            </button>
                                        ) : (
                                            <button disabled className="w-full py-4 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                                                <CheckCircle /> Fix Applied Successfully. Redirecting...
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
    );
}
