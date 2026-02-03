import { Incident } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { ShieldAlert, TrendingDown, CheckCircle, Flame, Users, Activity } from 'lucide-react';

// ... (Previous components)

export function TopCausesWidget({ causes }: { causes: { issue_type: string; count: number; at_risk_usd: number }[] }) {
    return (
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg border-b border-gray-100 pb-3">
                <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                    <Activity size={20} />
                </div>
                Top Leak Causes
            </h3>
            <div className="space-y-4">
                {causes.map((c, i) => (
                    <div key={i} className="flex justify-between items-center group">
                        <div>
                            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.issue_type}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.count} records</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold text-rose-600">-${c.at_risk_usd.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Risk Impact</div>
                        </div>
                    </div>
                ))}
                {causes.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No active issues detected.</p>}
            </div>
        </div>
    );
}

export function AffectedSegmentsWidget({ segments }: { segments: { key: string; value: string; at_risk_usd: number }[] }) {
    return (
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg border-b border-gray-100 pb-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Users size={20} />
                </div>
                Blast Radius
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {segments.map((s, i) => (
                    <div key={i} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                                {s.value.substring(0, 2)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{s.value}</p>
                                <p className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded inline-block uppercase font-bold tracking-wider">{s.key}</p>
                            </div>
                        </div>
                        <div className="font-mono font-bold text-orange-600 whitespace-nowrap ml-2">
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
        <div className="bg-white border-l-8 border-red-500 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-8 mb-8 animate-in slide-in-from-top duration-500 relative overflow-hidden">

            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-6 items-start">
                    <div className="bg-red-100 p-4 rounded-2xl animate-pulse-subtle">
                        <Flame className="text-red-600" size={32} />
                    </div>
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <span className={`px-4 py-1.5 text-sm font-black rounded-lg uppercase tracking-wide shadow-sm w-fit ${severityColors[incident.severity]}`}>
                                SEV {incident.severity}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                Active Revenue Incident
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 text-sm font-medium">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">ID: {incident.incident_id}</span>
                            <span>•</span>
                            <span>Detected: {new Date(incident.created_at).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-red-600/70 font-bold uppercase tracking-widest mb-1">Total Revenue At Risk</p>
                    <p className="text-5xl font-black text-red-600 font-mono tracking-tighter">
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
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-2xl border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Error Budget (Monthly)</h3>

                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-4xl font-bold font-mono tracking-tighter block">${remaining.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 font-medium">Remaining Budget</span>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-bold text-black shadow transition-all ${pct < 25 ? 'bg-red-400' : 'bg-green-400'}`}>
                            {Math.round(pct)}% HEALTH
                        </span>
                    </div>

                    <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden mb-6 shadow-inner ring-1 ring-white/10">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${color} shadow-[0_0_10px_currentColor]`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 font-mono bg-gray-800/50 p-3 rounded-lg border border-white/5">
                    <span className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-gray-600">Total</span>
                        <span className="text-gray-300 font-bold">${budget.toLocaleString()}</span>
                    </span>
                    <div className="h-4 w-px bg-gray-700"></div>
                    <span className="flex flex-col text-right">
                        <span className="text-[9px] uppercase tracking-wider text-gray-600">Burned</span>
                        <span className="text-red-400 font-bold">-${used.toLocaleString()}</span>
                    </span>
                </div>
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
