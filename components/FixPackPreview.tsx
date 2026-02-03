import { FunnelRecord } from '@/lib/types';
import { ExtendedFixPack, ImpactedRecord } from '@/lib/fixpack';
import { ArrowRight, Check, X } from 'lucide-react';

interface FixPackPreviewProps {
    record: FunnelRecord;
    impactedRecord: ImpactedRecord;
    steps: any[];
}

import { FixPackDSLViewer } from './FixPackDSLViewer';

export function FixPackPreview({ record, impactedRecord, steps }: FixPackPreviewProps) {
    if (!impactedRecord || impactedRecord.changes.length === 0) return null;

    return (
        <div className="space-y-4">
            <FixPackDSLViewer steps={steps} />

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4 text-sm">
                <h4 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Proposed Data Changes</h4>
                <div className="space-y-2">
                    {impactedRecord.changes.map((change, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                            <span className="font-mono text-gray-500 w-24 ml-2">{change.field}</span>
                            <div className="flex-1 flex items-center gap-2 px-4">
                                <span className="text-red-600 line-through decoration-red-300 opacity-70">
                                    {String(change.oldValue || 'null')}
                                </span>
                                <ArrowRight size={14} className="text-gray-400" />
                                <span className="text-green-700 font-bold bg-green-50 px-1 rounded">
                                    {String(change.newValue)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
