'use client';

import { useState } from 'react';
import { FunnelRecord } from '@/lib/types';
import { generateSampleData } from '@/lib/sample-data';
import { parseCSV } from '@/lib/csv';
import { Upload, Play, Database, AlertTriangle } from 'lucide-react';

export default function Home() {
    const [data, setData] = useState<FunnelRecord[]>([]);

    const handleLoadSample = () => {
        const sample = generateSampleData();
        setData(sample);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const parsed = parseCSV(csv);
            setData(parsed);
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700">
                    <AlertTriangle size={32} />
                    <h1 className="text-3xl font-bold tracking-tight">Revenue Leak SRE</h1>
                </div>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">
                        <Upload size={16} />
                        Upload CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={handleLoadSample}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 text-sm font-medium"
                    >
                        <Database size={16} />
                        Load Sample Messy Funnel
                    </button>
                </div>
            </header>

            <main>
                {data.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900">No Data Loaded</h3>
                        <p className="text-gray-500 mt-1">Upload a CSV or load sample data to start scanning for leaks.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">loaded {data.length} records</h2>
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
        </div>
    );
}
