'use client';

import { useState, useEffect } from 'react';
import { FunnelRecord, LeakIssue, FixPack, Incident, TimelineEvent } from '@/lib/types';
import { generateSampleData } from '@/lib/sample-data';
import { parseCSV } from '@/lib/csv';
import { scanForLeaks } from '@/lib/scanner';
import { estimateImpact } from '@/lib/estimator'; // Note: Ensure only one import
import { calculateReliabilityMetrics, ReliabilityMetrics } from '@/lib/reliability';
import { calculateImpact } from '@/lib/impact';
import { computeIncident, IncidentManager } from '@/lib/incident';
import { applyFixPack } from '@/lib/applyFix';
import { generateFixPack } from '@/lib/fix-generator';
import { Upload, Database, AlertTriangle, ShieldAlert, Zap, Activity, TrendingDown, History, PlayCircle, Siren } from 'lucide-react';
import { IssueDrawer } from '@/components/IssueDrawer';
import { getAuditLog, logAuditEvent } from '@/lib/audit';
import { IncidentHeader, ErrorBudgetWidget, TimelinePanel, TopCausesWidget, AffectedSegmentsWidget } from '@/components/WarRoom';

export default function Home() {
    const [data, setData] = useState<FunnelRecord[]>([]);
    const [issues, setIssues] = useState<LeakIssue[]>([]);
    const [reliability, setReliability] = useState<ReliabilityMetrics | null>(null);
    const [incident, setIncident] = useState<Incident | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [demoActive, setDemoActive] = useState(false);

    const selectedIssue = issues.find(i => i.issue_id === selectedIssueId) || null;
    const selectedRecord = selectedIssue ? data.find(r => r.id === selectedIssue.record_id) || null : null;

    // Refresh Timeline Interval
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeline([...IncidentManager.getTimeline()]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const runAnalysis = (records: FunnelRecord[]) => {
        // 1. Scan
        const found = scanForLeaks(records);

        // 2. Estimate Impact (Advanced)
        const priced = found.map(issue => {
            const r = records.find(rec => rec.id === issue.record_id);
            if (!r) return issue;
            const loss = calculateImpact(r, issue.issue_type);
            return { ...issue, estimated_loss_usd: loss };
        });

        setIssues(priced);

        // 3. Reliability & Incident
        const totalRisk = priced.reduce((acc, curr) => acc + (curr.estimated_loss_usd || 0), 0);
        setReliability(calculateReliabilityMetrics(records, totalRisk));

        const newIncident = computeIncident(priced, records);
        setIncident(newIncident);
    };

    const handleLoadSample = () => {
        const sample = generateSampleData();
        setData(sample);
        runAnalysis(sample);
    };

    const handleRunFullDemo = async () => {
        setDemoActive(true);
        IncidentManager.clear();
        IncidentManager.addEvent('MANUAL_NOTE', 'Started Deterministic Demo Sequence');

        // 1. Load Data
        const res = await fetch('/demo_funnel.csv');
        let csvText = await res.text();
        if (!csvText || csvText.includes('<!DOCTYPE')) {
            // Fallback if fetch fails or returns HTML (Next.js public folder issue maybe)
            // Using hardcoded fallback for robustness
            csvText = `id,type,name,email,domain,company,source,region,owner,stage,created_at,last_touch_at,next_step,value_usd,notes
101,lead,Sarah Connor,sarah@sky.net,sky.net,Skynet Cyberdyne,inbound,NA,,New,2023-10-25T08:00:00Z,,,5000,Urgent inquiry - SLA Breach
103,opp,Nakatomi Deal,hans@gruber.inc,gruber.inc,Nakatomi Plaza,outbound,NA,Alice,Negotiation,2023-09-01T10:00:00Z,2023-09-05T10:00:00Z,,150000,Stale Opp - No touch 45 days
104,lead,Ellen Ripley,ellen@weyland.yutani,weyland.yutani,Weyland Yutani,referral,EMEA,,New,2023-10-24T10:00:00Z,,,1200,Unassigned and untouched
107,opp,Stark Industries,tony@stark.com,stark.com,Stark Ind,upsell,NA,Bob,Proposal,2023-10-10T10:00:00Z,2023-10-12T10:00:00Z,,200000,Missing Next Step`;
        }

        const parsed = parseCSV(csvText);
        setData(parsed);
        runAnalysis(parsed);

        // 2. Identify Top Issue & Generate Fix
        setTimeout(() => {
            const currentIssues = scanForLeaks(parsed); // Re-scan to be sure? Or just use state if sync... state is async. 
            // Better re-run logic locally
            const priced = currentIssues.map(issue => {
                const r = parsed.find(rec => rec.id === issue.record_id);
                if (!r) return issue;
                const loss = calculateImpact(r, issue.issue_type);
                return { ...issue, estimated_loss_usd: loss };
            });

            const biggest = priced.sort((a, b) => b.estimated_loss_usd - a.estimated_loss_usd)[0];
            if (biggest) {
                const record = parsed.find(r => r.id === biggest.record_id);
                if (record) {
                    setSelectedIssueId(biggest.issue_id);
                    IncidentManager.addEvent('MANUAL_NOTE', `identified top issue: ${biggest.issue_type} on ${record.name}`);
                }
            }
        }, 1000);
    };

    const handleRunFix = async (pack: FixPack) => {
        // 1. Post to Slack
        try {
            const res = await fetch('/api/slack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: pack.slack_message || `Fix executed: ${pack.title}`,
                    payload: pack.automation_payload
                })
            });
            const json = await res.json();
            if (json.success) {
                // alert('Slack alert sent!');
                IncidentManager.addEvent('MANUAL_NOTE', 'Slack Alert Sent to #revenue-reliability');
            } else {
                IncidentManager.addEvent('MANUAL_NOTE', 'Simulated Slack Alert (Env var missing)');
            }
        } catch (e) {
            IncidentManager.addEvent('MANUAL_NOTE', 'Simulated Slack Alert (Network error)');
        }

        // 2. Apply Fix Locally (Values Update)
        const { updatedRecords, appliedActionSummary } = applyFixPack(data, pack);

        setData(updatedRecords);
        runAnalysis(updatedRecords);

        logAuditEvent('APPLY_FIX', appliedActionSummary, pack.fix_id);

        // Close drawer
        setSelectedIssueId(null);
        setDemoActive(false); // End demo sequence state
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
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* War Room Header if Incident Active */}
            {incident && incident.status === 'open' && (
                <div className="bg-gray-900 border-b-4 border-red-600 p-4 sticky top-0 z-40 shadow-2xl">
                    <div className="max-w-7xl mx-auto flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <Siren className="text-red-500 animate-pulse" size={32} />
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase">War Room</h1>
                                <p className="text-xs font-mono text-red-400">INCIDENT ACTIVE • REVENUE AT RISK</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-bold uppercase">Burn Rate</p>
                                <p className={`text-xl font-mono font-bold ${incident.burn_rate > 1 ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {(incident.burn_rate * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-bold uppercase">Budget Left</p>
                                <p className="text-xl font-mono font-bold">
                                    ${Math.max(0, incident.error_budget_usd - incident.total_at_risk_usd).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={handleRunFullDemo} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold uppercase text-sm tracking-widest shadow-lg transition-transform active:scale-95">
                                Restart Demo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto p-8">
                {/* Standard Header (only if no incident or scrolled) */}
                {(!incident || incident.status !== 'open') && (
                    <header className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-700">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <AlertTriangle size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Revenue Leak SRE</h1>
                                <p className="text-xs text-indigo-600 font-medium tracking-wide uppercase">GTM Stack Doctor</p>
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
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-md shadow-lg hover:bg-purple-700 text-sm font-bold transition-all border border-purple-500 animate-pulse"
                            >
                                <PlayCircle size={18} />
                                RUN FULL DEMO
                            </button>
                        </div>
                    </header>
                )}

                {incident && incident.status === 'open' && (
                    <div className="grid grid-cols-12 gap-6 mb-12">
                        <div className="col-span-8">
                            <IncidentHeader incident={incident} />
                            <div className="grid grid-cols-2 gap-6">
                                <TopCausesWidget causes={incident.top_causes} />
                                <AffectedSegmentsWidget segments={incident.affected_segments} />
                            </div>
                        </div>
                        <div className="col-span-4 space-y-6">
                            <ErrorBudgetWidget incident={incident} />
                            <TimelinePanel events={timeline} />
                        </div>
                    </div>
                )}

                {/* Legacy Dashboard View (for detailed record inspection) */}
                {data.length > 0 && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Live Funnel Data</h2>
                                <span className="text-sm text-gray-500">{data.length} records loaded</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Touch</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.slice(0, 10).map((row) => (
                                            <tr key={row.id} className={issues.find(i => i.record_id === row.id) ? 'bg-red-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.type === 'lead' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 flex flex-col">
                                                    <span>{row.name}</span>
                                                    <span className="text-xs text-gray-400">{row.company}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.stage}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">${row.value_usd?.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    {row.last_touch_at ? new Date(row.last_touch_at).toLocaleDateString() : 'Never'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    <span className="text-xs truncate max-w-[150px] inline-block">{row.notes}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {data.length > 10 && <p className="px-6 py-4 text-xs text-gray-400">Showing first 10 of {data.length} records...</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <IssueDrawer
                issue={selectedIssue}
                record={selectedRecord}
                onClose={() => setSelectedIssueId(null)}
                onRunFix={handleRunFix}
            />
        </div>
    );
}
