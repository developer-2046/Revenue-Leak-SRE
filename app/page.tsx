'use client';

import { useState, useEffect, useMemo } from 'react';
import { FunnelRecord, LeakIssue, FixPack, Incident, TimelineEvent } from '@/lib/types';
import { generateSampleData } from '@/lib/sample-data';
import { parseCSV } from '@/lib/csv';
import { scanForLeaks } from '@/lib/scanner';
import { calculateImpact } from '@/lib/impact';
import { computeIncident, IncidentManager } from '@/lib/incident';
import { applyFixPack } from '@/lib/applyFix';
import { SLOManager, DEFINED_SLOS } from '@/lib/slo';
import { Upload, PlayCircle, Siren, Layout, Monitor, ShieldCheck, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import { IssueDrawer } from '@/components/IssueDrawer';
import { logAuditEvent } from '@/lib/audit';
import { IncidentHeader, ErrorBudgetWidget, TimelinePanel, TopCausesWidget, AffectedSegmentsWidget } from '@/components/WarRoom';
import { SLOGauge } from '@/components/SLOGauge';
import { VerificationReport } from '@/components/VerificationReport';
import { cn } from '@/lib/utils'; // Assuming this exists or I'll implement a simple one

// Helper for conditional classes if cn doesn't exist
function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export default function Home() {
    const [data, setData] = useState<FunnelRecord[]>([]);
    const [issues, setIssues] = useState<LeakIssue[]>([]);
    const [incident, setIncident] = useState<Incident | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [slos, setSlos] = useState(DEFINED_SLOS);

    // Presentation Modes
    const [demoMode, setDemoMode] = useState(false);
    const [presentationMode, setPresentationMode] = useState(false);
    const [savedRevenue, setSavedRevenue] = useState(0);
    const [verificationReport, setVerificationReport] = useState<{ before: number, after: number, saved: number } | null>(null);

    // Bingo Logic
    const [bingoState, setBingoState] = useState({ sla: false, stale: false, dupe: false, owner: false, hygiene: false });

    const selectedIssue = issues.find(i => i.issue_id === selectedIssueId) || null;
    const selectedRecord = selectedIssue ? data.find(r => r.id === selectedIssue.record_id) || null : null;

    // Refresh Timeline Interval
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeline([...IncidentManager.getTimeline()]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const runAnalysis = (records: FunnelRecord[], preserveRevenue = false) => {
        // 1. Scan
        const found = scanForLeaks(records);

        // 2. Estimate Impact
        const priced = found.map(issue => {
            const r = records.find(rec => rec.id === issue.record_id);
            if (!r) return issue;
            const loss = calculateImpact(r, issue.issue_type);
            return { ...issue, estimated_loss_usd: loss };
        });

        setIssues(priced);

        // 3. Incident & SLOs
        const totalRisk = priced.reduce((acc, curr) => acc + (curr.estimated_loss_usd || 0), 0);
        const newIncident = computeIncident(priced, records);
        setIncident(newIncident);

        const newSlos = SLOManager.calculateSLOStatus(records, priced);
        setSlos(newSlos);

        // Update Bingo
        if (priced.some(i => i.issue_type === 'SLA_BREACH_UNTOUCHED')) setBingoState(p => ({ ...p, sla: true }));
        if (priced.some(i => i.issue_type === 'STALE_OPP')) setBingoState(p => ({ ...p, stale: true }));
        if (priced.some(i => i.issue_type === 'DUPLICATE_SUSPECT')) setBingoState(p => ({ ...p, dupe: true }));
        if (priced.some(i => i.issue_type === 'UNASSIGNED_OWNER')) setBingoState(p => ({ ...p, owner: true }));
        if (priced.some(i => i.issue_type.includes('NEXT_STEP'))) setBingoState(p => ({ ...p, hygiene: true }));

        if (!preserveRevenue) {
            // Only strictly needed if we want to reset saved revenue on new file load
        }
    };

    const handleRunFullDemo = async () => {
        setDemoMode(true);
        IncidentManager.clear();
        setSavedRevenue(0);
        setBingoState({ sla: false, stale: false, dupe: false, owner: false, hygiene: false });
        IncidentManager.addEvent('MANUAL_NOTE', 'Started Deterministic Demo Sequence');

        // 1. Load Data
        let csvText = '';
        try {
            const res = await fetch('/demo_funnel.csv');
            if (res.ok) {
                const text = await res.text();
                // Basic validation
                if (text && !text.trim().startsWith('<!DOCTYPE')) {
                    csvText = text;
                }
            }
        } catch (e) {
            console.warn("Demo fetch failed, using fallback", e);
        }

        // Fallback Data
        if (!csvText) {
            console.log("Using embedded fallback data");
            csvText = `id,type,name,email,domain,company,source,region,owner,stage,created_at,last_touch_at,next_step,value_usd,notes
101,lead,Sarah Connor,sarah@sky.net,sky.net,Skynet Cyberdyne,inbound,NA,,New,2023-10-25T08:00:00Z,,,5000,Urgent inquiry - SLA Breach
102,lead,John Doe,jdoe@acme.com,acme.com,Acme Corp,web,NA,Alice,Qualified,2023-10-26T09:00:00Z,2023-10-26T09:30:00Z,Follow up call,10000,
103,opp,Nakatomi Deal,hans@gruber.inc,gruber.inc,Nakatomi Plaza,outbound,NA,Alice,Negotiation,2023-09-01T10:00:00Z,2023-09-05T10:00:00Z,,150000,Stale Opp - No touch 45 days
104,lead,Ellen Ripley,ellen@weyland.yutani,weyland.yutani,Weyland Yutani,referral,EMEA,,New,2023-10-24T10:00:00Z,,,1200,Unassigned and untouched
105,lead,E. Ripley,eripley@weyland.yutani,weyland.yutani,Weyland Yutani,web,EMEA,Bob,New,2023-10-25T11:00:00Z,2023-10-25T11:05:00Z,Qualify,1200,Duplicate of 104
106,opp,Stark Industries,tony@stark.com,stark.com,Stark Ind,upsell,NA,Bob,Proposal,2023-10-10T10:00:00Z,2023-10-12T10:00:00Z,,200000,Missing Next Step
107,lead,Bruce Wayne,bruce@wayne.ent,wayne.ent,Wayne Enterprises,event,NA,Charlie,New,2023-10-26T12:00:00Z,,,50000,Fresh lead - OK
108,opp,Initech Upgrade,peter@initech.com,initech.com,Initech,inbound,NA,Alice,Discovery,2023-10-20T14:00:00Z,2023-10-20T14:30:00Z,Demo scheduled,25000,
109,lead,Neo Anderson,neo@matrix.org,matrix.org,The Matrix,web,APAC,,New,2023-10-23T08:00:00Z,,,8000,Unassigned - Routing Issue
110,opp,Tyrell Corp AI,eldon@tyrell.com,tyrell.com,Tyrell Corp,outbound,NA,Dave,Closed Won,2023-08-01T10:00:00Z,2023-08-15T10:00:00Z,Onboarding,500000,Won - Ignore
111,opp,Massive Dynamic,bell@massive.dyn,massive.dyn,Massive Dynamic,referral,NA,Bob,Negotiation,2023-09-15T10:00:00Z,2023-09-20T10:00:00Z,,75000,Stale > 30 days
112,lead,Roy Batty,roy@tyrell.com,tyrell.com,Tyrell Corp,web,NA,,New,2023-10-26T13:00:00Z,,,0,Unassigned lead for existing customer
113,lead,Deckard,rick@lapd.gov,lapd.gov,LAPD,referral,NA,Alice,Qualified,2023-10-22T09:00:00Z,2023-10-22T09:30:00Z,,2000,Missing Next Step
114,opp,Cyberpunk 2077,v@nightcity.net,nightcity.net,Arasaka,inbound,APAC,Charlie,Proposal,2023-10-01T10:00:00Z,2023-10-15T10:00:00Z,Contract review,90000,
115,lead,GLaDOS,glados@aperture.sci,aperture.sci,Aperture Science,web,NA,,New,2023-10-21T08:00:00Z,,,15000,Untouched > 4 days (SLA Breach)
116,opp,Black Mesa,gordon@blackmesa.org,blackmesa.org,Black Mesa,outbound,NA,Bob,Discovery,2023-10-05T10:00:00Z,2023-10-05T10:30:00Z,,40000,Missing Next Step
117,lead,Chell,chell@aperture.sci,aperture.sci,Aperture Science,referral,NA,Alice,New,2023-10-25T14:00:00Z,2023-10-25T14:10:00Z,Qualify,15000,Duplicate of 115 domain
118,opp,Umbrella Corp,wesker@umbrella.com,umbrella.com,Umbrella Corp,bound,EMEA,Charlie,Negotiation,2023-09-10T10:00:00Z,2023-09-12T10:00:00Z,,300000,Stale High Value
119,lead,Leon Kennedy,leon@rpd.gov,rpd.gov,RPD,web,NA,Dave,Qualified,2023-10-26T10:00:00Z,2023-10-26T10:30:00Z,Demo,5000,
120,lead,Jill Valentine,jill@stars.org,stars.org,STARS,referral,EMEA,,New,2023-10-20T08:00:00Z,,,3000,Unassigned - Forgotten`;
        }

        const parsed = parseCSV(csvText);
        setData(parsed);
        runAnalysis(parsed);

        // 2. Auto-Navigate to worst issue
        setTimeout(() => {
            const currentIssues = scanForLeaks(parsed);
            const priced = currentIssues.map(issue => {
                const r = parsed.find(rec => rec.id === issue.record_id);
                if (!r) return issue;
                const loss = calculateImpact(r, issue.issue_type);
                return { ...issue, estimated_loss_usd: loss };
            });

            const biggest = priced.sort((a, b) => b.estimated_loss_usd - a.estimated_loss_usd)[0];
            if (biggest) {
                setSelectedIssueId(biggest.issue_id);
                IncidentManager.addEvent('MANUAL_NOTE', `identified top issue: ${biggest.issue_type} ($${biggest.estimated_loss_usd})`);
            }
        }, 1500);
    };

    const handleRunFix = async (pack: FixPack) => {
        // 1. Post to Slack (Simulated)
        IncidentManager.addEvent('FIXPACK_GENERATED', `Fix Pack '${pack.title}' initiated via DSL`);

        // 2. Apply Fix Locally
        const { updatedRecords, appliedActionSummary } = applyFixPack(data, pack);

        // Calculate saved revenue from the fixed issue
        const fixedIssue = issues.find(i => i.issue_id === selectedIssueId);
        const savedAmount = fixedIssue ? fixedIssue.estimated_loss_usd : 0;
        setSavedRevenue(prev => prev + savedAmount);

        // Verification Logic
        const leaksBefore = issues.length;

        setData(updatedRecords);
        runAnalysis(updatedRecords, true); // this updates 'issues' state async

        // Show Verification Report
        logAuditEvent('APPLY_FIX', appliedActionSummary, pack.fix_id);

        // Determine leaks after (approximation since state update is async)
        // In a real app we'd use useEffect or a callback. Here we re-scan immediately.
        const reScan = scanForLeaks(updatedRecords);
        setVerificationReport({
            before: leaksBefore,
            after: reScan.length,
            saved: savedAmount
        });

        // Close drawer
        setSelectedIssueId(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const parsed = parseCSV(csv);
            setData(parsed);
            runAnalysis(parsed);
        };
        reader.readAsText(file);
    };

    return (
        <div className={classNames("min-h-screen bg-gray-50/50 font-sans", presentationMode ? "" : "")}>
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white -z-10" />

            {/* Verification Modal */}
            {verificationReport && (
                <VerificationReport
                    leaksBefore={verificationReport.before}
                    leaksAfter={verificationReport.after}
                    revenueSaved={verificationReport.saved}
                    onDismiss={() => setVerificationReport(null)}
                />
            )}

            {/* War Room Header */}
            {incident && incident.status === 'open' && (
                <div className="bg-gray-900 border-b-4 border-red-600 p-4 sticky top-0 z-40 shadow-2xl">
                    <div className="max-w-7xl mx-auto flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <Siren className="text-red-500 animate-pulse" size={32} />
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase">War Room</h1>
                                <div className="flex gap-2">
                                    <span className="text-xs font-mono text-red-400">INCIDENT ACTIVE</span>
                                    {savedRevenue > 0 && (
                                        <span className="text-xs font-mono text-green-400 font-bold animate-pulse">
                                            +${savedRevenue.toLocaleString()} RECOVERED
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-gray-500 font-bold uppercase">Budget Left</p>
                                <p className="text-xl font-mono font-bold">
                                    ${Math.max(0, incident.error_budget_usd - incident.total_at_risk_usd).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPresentationMode(!presentationMode)}
                                    className={`p-2 rounded hover:bg-gray-800 ${presentationMode ? 'text-blue-400' : 'text-gray-400'}`}
                                    title="Presentation Mode"
                                >
                                    <Monitor size={20} />
                                </button>
                                {demoMode && (
                                    <button onClick={handleRunFullDemo} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold uppercase text-xs tracking-widest shadow-lg transition-transform active:scale-95">
                                        Reset Demo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`max-w-7xl mx-auto p-8 ${presentationMode ? 'max-w-full px-12' : ''}`}>

                {/* Standard Header */}
                {(!incident || incident.status !== 'open') && (
                    <header className="mb-8 flex items-center justify-between animate-in slide-in-from-top">
                        <div className="flex items-center gap-3 text-indigo-700">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <Sparkles size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-gray-900">Revenue Leak SRE</h1>
                                <p className="text-xs text-indigo-600 font-bold tracking-wide uppercase">GTM Reliability Engineering</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                                <Upload size={16} />
                                Upload CSV
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                            </label>
                            <button
                                onClick={handleRunFullDemo}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md shadow-lg hover:from-purple-700 hover:to-indigo-700 text-sm font-bold transition-all border border-purple-500 animate-bounce-subtle"
                            >
                                <PlayCircle size={18} />
                                START DEMO MODE
                            </button>
                        </div>
                    </header>
                )}

                {/* Main Dashboard */}
                {incident && incident.status === 'open' && (
                    <div className="space-y-6 animate-in fade-in duration-700">
                        {/* Summary Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <IncidentHeader incident={incident} /> {/* This handles the big red card */}
                            <div className="col-span-1 md:col-span-3 grid grid-cols-3 gap-8">
                                <ErrorBudgetWidget incident={incident} />
                                <div className="bg-white p-8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-center items-center hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Saved Revenue</h3>
                                    <p className="text-5xl font-black text-green-600 font-mono tracking-tighter">+${savedRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Leak Bingo</h3>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                                        {/* Bingo Grid */}
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${bingoState.sla ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                            <span className={bingoState.sla ? "text-gray-900 font-bold line-through decoration-red-500 decoration-2" : "text-gray-400"}>SLA Breach</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${bingoState.stale ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                            <span className={bingoState.stale ? "text-gray-900 font-bold line-through decoration-red-500 decoration-2" : "text-gray-400"}>Stale Opp</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${bingoState.dupe ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                            <span className={bingoState.dupe ? "text-gray-900 font-bold line-through decoration-red-500 decoration-2" : "text-gray-400"}>Duplication</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${bingoState.owner ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                            <span className={bingoState.owner ? "text-gray-900 font-bold line-through decoration-red-500 decoration-2" : "text-gray-400"}>Owner Fix</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SLO & Timeline Row */}
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-8 space-y-8">
                                {/* SLO Gauges */}
                                <div className="grid grid-cols-3 gap-8">
                                    {slos.map(slo => <SLOGauge key={slo.id} slo={slo} />)}
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <TopCausesWidget causes={incident.top_causes} />
                                    <AffectedSegmentsWidget segments={incident.affected_segments} />
                                </div>

                                {/* Findings List with Filters */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-gray-700">Detected Anomalies ({issues.length})</h3>
                                    </div>
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">$ Impact</th>
                                                <th className="px-6 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {issues.slice(0, 10).map((issue) => {
                                                const record = data.find(r => r.id === issue.record_id);
                                                return (
                                                    <tr key={issue.issue_id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${issue.severity >= 8 ? 'bg-red-100 text-red-800' :
                                                                issue.severity >= 5 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                SEV {issue.severity}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{issue.issue_type}</td>
                                                        <td className="px-6 py-4 text-gray-500">{record?.name}</td>
                                                        <td className="px-6 py-4 font-mono text-gray-900 font-bold">${issue.estimated_loss_usd?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    console.log("Clicked Issue:", issue.issue_id, "Record ID:", issue.record_id);
                                                                    setSelectedIssueId(issue.issue_id);
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-900 font-bold hover:underline"
                                                            >
                                                                View Fix
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="col-span-4 space-y-6">
                                <TimelinePanel events={timeline} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Debugging: State Mismatch Detection (Remove in Prod) */}
            {selectedIssueId && !selectedIssue && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setSelectedIssueId(null)}>
                    <div className="bg-red-50 border-2 border-red-500 p-8 rounded-xl max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-red-600 mb-4 flex items-center gap-2"><Siren className="animate-pulse" /> CRITICAL STATE ERROR</h2>
                        <p className="font-mono text-xs bg-red-100 p-2 rounded mb-4">selectedIssueId: "{selectedIssueId}"</p>
                        <p className="text-gray-800 font-medium mb-4">
                            The application state contains the ID, but the Issue object could not be found in the `issues` array.
                        </p>
                        <div className="text-xs font-mono text-gray-500 overflow-y-auto max-h-32 bg-white p-2 border border-gray-200">
                            Available IDs: {issues.map(i => i.issue_id).join(', ')}
                        </div>
                        <button className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg" onClick={() => setSelectedIssueId(null)}>
                            Dismiss & Reset
                        </button>
                    </div>
                </div>
            )}

            {selectedIssueId && selectedIssue && !selectedRecord && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setSelectedIssueId(null)}>
                    <div className="bg-orange-50 border-2 border-orange-500 p-8 rounded-xl max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-orange-600 mb-4 flex items-center gap-2"><AlertTriangle /> ORPHANED ISSUE</h2>
                        <p className="text-gray-800 font-medium mb-4">
                            Issue found, but the associated Record (ID: {selectedIssue.record_id}) is missing from the dataset.
                        </p>
                        <p className="font-mono text-xs bg-orange-100 p-2 rounded mb-4">Search ID: "{String(selectedIssue.record_id)}"</p>
                        <button className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg" onClick={() => setSelectedIssueId(null)}>
                            Dismiss & Reset
                        </button>
                    </div>
                </div>
            )}

            <IssueDrawer
                issue={selectedIssue}
                record={selectedRecord}
                onClose={() => setSelectedIssueId(null)}
                onRunFix={handleRunFix}
            />
            {/* Debug Footer */}
            <div className="fixed bottom-0 left-0 bg-black text-white text-xs p-1 opacity-70 pointer-events-none z-[100]">
                Selected: {selectedIssueId || 'None'} | Issues: {issues.length} | Data: {data.length} | Last ID Type: {issues[0] ? typeof issues[0].issue_id : '?'}
            </div>
        </div>
    );
}
