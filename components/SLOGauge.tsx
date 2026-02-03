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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 text-sm">{slo.name}</h4>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isBreach ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {percentage.toFixed(1)}% / {targetPct}%
                </span>
            </div>

            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${isBreach ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${percentage}%` }}
                />
                {/* Target Marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-black/50 z-10"
                    style={{ left: `${targetPct}%` }}
                />
            </div>
            <p className="text-xs text-gray-500 mt-2">{slo.description}</p>
        </div>
    );
}
