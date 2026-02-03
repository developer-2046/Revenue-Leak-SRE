import { Incident } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { ShieldAlert, TrendingDown, CheckCircle, Flame, Users, Activity } from 'lucide-react';

// ... (Previous components)

export function TopCausesWidget({ causes }: { causes: { issue_type: string; count: number; at_risk_usd: number }[] }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Activity size={18} /> Top Causes
            </h3>
            <div className="space-y-3">
                {causes.map((c, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2">
                        <div>
                            <p className="font-medium text-sm text-gray-900">{c.issue_type}</p>
                            <p className="text-xs text-gray-500">{c.count} records affected</p>
                        </div>
                        <div className="font-mono font-bold text-red-600 text-sm">
                            -${c.at_risk_usd.toLocaleString()}
                        </div>
                    </div>
                ))}
                {causes.length === 0 && <p className="text-sm text-gray-400 italic">No issues found.</p>}
            </div>
        </div>
    );
}

export function AffectedSegmentsWidget({ segments }: { segments: { key: string; value: string; at_risk_usd: number }[] }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Users size={18} /> Impact Blast Radius
            </h3>
            <div className="space-y-3">
                {segments.map((s, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2">
                        <div>
                            <p className="font-medium text-sm text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500 uppercase">{s.key}</p>
                        </div>
                        <div className="font-mono font-bold text-orange-600 text-sm">
                            -${s.at_risk_usd.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function IncidentHeader({ incident }: { incident: Incident }) {
    if (!incident || incident.status === 'resolved') return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4 mb-6">
            <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="text-green-600" size={32} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-green-900">All Systems Nominal</h2>
                <p className="text-green-700">No active revenue incidents. Keep scanning.</p>
            </div>
        </div>
    );

    const severityColors = {
        1: 'bg-red-600 text-white',
        2: 'bg-orange-600 text-white',
        3: 'bg-yellow-500 text-black',
        4: 'bg-blue-500 text-white',
        5: 'bg-gray-500 text-white'
    };

    return (
        <div className="bg-white border-l-8 border-red-600 rounded-r-xl shadow-lg p-6 mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-sm font-bold rounded uppercase ${severityColors[incident.severity]}`}>
                            SEV {incident.severity}
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Flame className="text-red-600 animate-pulse" />
                            Active Revenue Incident: {incident.incident_id}
                        </h2>
                    </div>
                    <p className="text-gray-500 text-sm font-mono">Started: {new Date(incident.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Total Revenue At Risk</p>
                    <p className="text-4xl font-bold text-red-600 font-mono tracking-tight">
                        -${incident.total_at_risk_usd.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function ErrorBudgetWidget({ incident }: { incident: Incident }) {
    if (!incident) return null;

    // Reverse burn rate logic: Budget - AtRisk
    const budget = incident.error_budget_usd;
    const used = incident.total_at_risk_usd;
    const remaining = Math.max(0, budget - used);
    const pct = (remaining / budget) * 100;

    let color = 'bg-green-500';
    if (pct < 25) color = 'bg-red-600';
    else if (pct < 50) color = 'bg-yellow-500';

    return (
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg border border-gray-800">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Error Budget (Monthly)</h3>

            <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-bold font-mono">${remaining.toLocaleString()}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold text-black ${pct < 25 ? 'bg-red-400' : 'bg-green-400'}`}>
                    {Math.round(pct)}% LEFT
                </span>
            </div>

            <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>TOTAL: ${budget.toLocaleString()}</span>
                <span>USED: -${used.toLocaleString()}</span>
            </div>
        </div>
    );
}

export function TimelinePanel({ events }: { events: any[] }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-96 flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-700">Incident Timeline</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {events.length === 0 && <p className="text-gray-400 italic text-sm text-center">No events recorded.</p>}
                {events.map((e) => (
                    <div key={e.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-1.5 ${e.type === 'DETECTED' ? 'bg-red-500' :
                                e.type === 'RESOLVED' ? 'bg-green-500' :
                                    e.type === 'FIX_APPLIED' ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                            <div className="w-0.5 h-full bg-gray-100 group-last:bg-transparent mt-1" />
                        </div>
                        <div className="pb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-400">{new Date(e.ts).toLocaleTimeString()}</span>
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                    {e.type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-800">{e.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
