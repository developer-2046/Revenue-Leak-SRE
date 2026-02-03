import React from 'react';
import { SLO } from '@/lib/types';

interface SLOGaugeProps {
    slo: SLO;
}

export function SLOGauge({ slo }: SLOGaugeProps) {
    const percentage = slo.current * 100;
    const targetPct = slo.target * 100;
    const isBreach = slo.current < slo.target;

    return (
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isBreach ? 'bg-red-500' : 'bg-green-500'} ring-4 ${isBreach ? 'ring-red-100' : 'ring-green-100'}`}></div>
                    {slo.name}
                </h4>
                <div className="text-xs font-mono font-bold text-gray-400">
                    <span className={isBreach ? 'text-red-600' : 'text-green-600'}>{percentage.toFixed(1)}%</span>
                    <span className="mx-1">/</span>
                    <span>{targetPct}%</span>
                </div>
            </div>

            <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3 shadow-inner">
                <div
                    className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out rounded-full ${isBreach ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
                    style={{ width: `${percentage}%` }}
                />
                {/* Target Marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-black/20 z-10 backdrop-blur-sm"
                    style={{ left: `${targetPct}%` }}
                />
            </div>
            <p className="text-[11px] text-gray-400 leading-tight">{slo.description}</p>
        </div>
    );
}
