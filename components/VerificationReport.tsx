import { FunnelRecord } from '@/lib/types';
import { ArrowUp, CheckCircle, Search } from 'lucide-react';

interface VerificationReportProps {
    leaksBefore: number;
    leaksAfter: number;
    revenueSaved: number;
    onDismiss: () => void;
}

export function VerificationReport({ leaksBefore, leaksAfter, revenueSaved, onDismiss }: VerificationReportProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-t-8 border-green-500">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-4 rounded-full mb-4 animate-bounce">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-1">Fix Verified</h2>
                    <p className="text-green-600 font-medium mb-6">Simulation passed with no regressions</p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-6 text-left">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-500 font-bold uppercase">Active Leaks</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-mono font-bold text-gray-900">{leaksAfter}</span>
                                <span className="text-sm font-mono text-gray-400 line-through mb-1">{leaksBefore}</span>
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-green-700 font-bold uppercase">Revenue Secure</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-mono font-bold text-green-700">+${revenueSaved.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-center gap-2 mb-6">
                        <Search size={16} />
                        <span>Regression Guard: <strong>PASSED</strong> (0 new leaks)</span>
                    </div>

                    <button
                        onClick={onDismiss}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 shadow-lg"
                    >
                        Great, Close Report
                    </button>
                </div>
            </div>
        </div>
    );
}
