'use client';

import { useState } from 'react';
import { FunnelRecord, LeakIssue, FixPack } from '@/lib/types';
import { generateSampleData } from '@/lib/sample-data';
import { parseCSV } from '@/lib/csv';
import { scanForLeaks } from '@/lib/scanner';
import { estimateImpact } from '@/lib/estimator';
import { Upload, Database, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { IssueDrawer } from '@/components/IssueDrawer';

export default function Home() {
    const [data, setData] = useState<FunnelRecord[]>([]);
    const [issues, setIssues] = useState<LeakIssue[]>([]);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

    const selectedIssue = issues.find(i => i.issue_id === selectedIssueId) || null;
    const selectedRecord = selectedIssue ? data.find(r => r.id === selectedIssue.record_id) || null : null;

    const handleLoadSample = () => {
        const sample = generateSampleData();
        setData(sample);
        setIssues([]);
    };

    const handleInjectChaos = () => {
        if (data.length === 0) {
            alert("Load data first before injecting chaos.");
            return;
        }
        const chaosData = [...data];
        const now = new Date();

        // 10 inbound leads, no owner, old
        for (let i = 0; i < 10; i++) {
            chaosData.push({
                id: `chaos_lead_${i}`,
                type: 'lead',
                name: `Chaos Lead ${i}`,
                email: `chaos${i}@test.com`,
                domain: `test${i}.com`,
                company: `Chaos Co ${i}`,
                source: 'inbound',
                region: 'NA',
                owner: null,
                stage: 'New',
                created_at: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
                last_touch_at: null,
                next_step: null,
                value_usd: 2000,
                notes: 'Chaos injected'
            });
        }

        // 3 Duplicates from existing
        if (chaosData.length > 3) {
            chaosData.push({ ...chaosData[0], id: 'chaos_dupe_1', domain: chaosData[0].domain });
            chaosData.push({ ...chaosData[1], id: 'chaos_dupe_2', domain: chaosData[1].domain });
            chaosData.push({ ...chaosData[2], id: 'chaos_dupe_3', domain: chaosData[2].domain });
        }

        // 2 Stale Opps
        chaosData.push({
            id: 'chaos_stale_1',
            type: 'opp',
            name: 'Stale Whale Deal',
            email: 'whale@ocean.com',
            domain: 'ocean.com',
            company: 'Ocean Corp',
            source: 'outbound',
            region: 'NA',
            owner: 'Bob',
            stage: 'Proposal',
            created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            last_touch_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
            next_step: 'Waiting',
            value_usd: 80000,
            notes: 'Chaos injected'
        });
        chaosData.push({
            id: 'chaos_stale_2',
            type: 'opp',
            name: 'Forgotten Renewals',
            email: 'old@legacy.com',
            domain: 'legacy.com',
            company: 'Legacy Inc',
            source: 'upsell',
            region: 'EMEA',
            owner: 'Alice',
            stage: 'Negotiation',
            created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            last_touch_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
            next_step: 'Contract sent',
            value_usd: 12000,
            notes: 'Chaos injected'
        });

        setData(chaosData);
        alert('🔥 Chaos Injected! Run scan to see the damage.');
        setIssues([]); // Reset scan
    };

    const handleScan = () => {
        let foundIssues = scanForLeaks(data);
        foundIssues = estimateImpact(foundIssues, data);
        setIssues(foundIssues);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const parsed = parseCSV(csv);
            setData(parsed);
            setIssues([]);
        };
        reader.readAsText(file);
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
            if (!json.success && json.error) {
                alert(`Live Action Note: ${json.error}. (Fix will still be applied locally)`);
            } else if (json.success) {
                alert('Success! Slack alert sent to #revenue-alerts.');
            }
        } catch (e) {
            console.error(e);
        }

        // 2. Apply Fix Locally to Demo "After" State
        const issue = issues.find(i => i.issue_id === selectedIssueId);
        if (issue) {
            const newData = data.map(r => {
                if (r.id !== issue.record_id) return r;

                const copy = { ...r };
                if (issue.issue_type === 'SLA_BREACH_UNTOUCHED') {
                    copy.last_touch_at = new Date().toISOString();
                    copy.owner = copy.owner || 'Antigravity (You)';
                } else if (issue.issue_type === 'UNASSIGNED_OWNER') {
                    copy.owner = 'Antigravity (You)';
                } else if (issue.issue_type === 'STALE_OPP') {
                    copy.last_touch_at = new Date().toISOString();
                    copy.notes = (copy.notes || '') + ' [Rescued]';
                } else if (issue.issue_type === 'DUPLICATE_SUSPECT') {
                    copy.notes = (copy.notes || '') + ' [Merged]';
                    return null;
                } else if (issue.issue_type === 'NO_NEXT_STEP') {
                    copy.next_step = 'Follow up task created';
                }
                return copy;
            }).filter(Boolean) as FunnelRecord[];

            setData(newData);

            // Re-scan to update UI
            setTimeout(() => {
                const foundIssues = scanForLeaks(newData);
                const pricedIssues = estimateImpact(foundIssues, newData);
                setIssues(pricedIssues);
                setSelectedIssueId(null);
            }, 500);
        }
    };

    const totalAtRisk = issues.reduce((acc, curr) => acc + (curr.estimated_loss_usd || 0), 0);
    const highSevCount = issues.filter(i => i.severity_label === 'high').length;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
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
                        onClick={handleLoadSample}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                        <Database size={16} />
                        Load Messy Funnel
                    </button>
                    {data.length > 0 && (
                        <button
                            onClick={handleInjectChaos}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md shadow-sm hover:bg-orange-700 text-sm font-medium transition-colors"
                        >
                            <Zap size={16} />
                            Inject Chaos
                        </button>
                    )}
                </div>
            </header>

            <main>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Leaks Detected</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{issues.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Revenue at Risk</p>
                        <p className="text-3xl font-bold text-rose-600 mt-2">
                            ${totalAtRisk.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">High Severity Issues</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{highSevCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Est. Recoverable</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            ${Math.round(totalAtRisk * 0.4).toLocaleString()}
                        </p>
                    </div>
                </div>

                {data.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900">No Data Loaded</h3>
                        <p className="text-gray-500 mt-1">Upload a CSV or load sample data to start scanning for leaks.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Actions Bar */}
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="text-sm text-gray-500">
                                Loaded <strong>{data.length}</strong> records
                            </div>
                            <button
                                onClick={handleScan}
                                className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-md shadow-sm hover:bg-rose-700 font-medium"
                            >
                                <ShieldAlert size={18} />
                                Scan for Leaks
                            </button>
                        </div>

                        {issues.length > 0 && (
                            <div className="bg-rose-50 p-6 rounded-xl shadow-sm border border-rose-200">
                                <h2 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle />
                                    {issues.length} Leaks Detected
                                </h2>
                                <div className="grid gap-4">
                                    {issues.map(issue => (
                                        <div
                                            key={issue.issue_id}
                                            onClick={() => setSelectedIssueId(issue.issue_id)}
                                            className="bg-white p-4 rounded-lg border border-rose-100 flex justify-between items-center group hover:shadow-md transition-shadow cursor-pointer hover:border-rose-300"
                                        >
                                            <div>
                                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 mb-1">
                                                    {issue.issue_type}
                                                </span>
                                                <p className="text-gray-900 font-medium">{issue.explanation}</p>
                                                <p className="text-xs text-gray-500">Record ID: {issue.record_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-rose-600">-${issue.estimated_loss_usd.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500 mt-1 font-bold">{issue.severity_label.toUpperCase()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Data</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Last Touch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.slice(0, 10).map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.type === 'lead' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{row.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.stage}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">${row.value_usd?.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    {row.last_touch_at ? new Date(row.last_touch_at).toLocaleDateString() : 'Never'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="px-6 py-4 text-xs text-gray-400">Showing first 10 records...</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <IssueDrawer
                issue={selectedIssue}
                record={selectedRecord}
                onClose={() => setSelectedIssueId(null)}
                onRunFix={handleRunFix}
            />
        </div>
    );
}
