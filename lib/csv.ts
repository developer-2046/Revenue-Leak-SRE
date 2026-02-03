import Papa from 'papaparse';
import { FunnelRecord } from './types';

export function parseCSV(csvString: string): FunnelRecord[] {
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });

    // Cast to FunnelRecord and ensure ID is string
    return (result.data as any[]).map(r => ({
        ...r,
        id: String(r.id),
        value_usd: Number(r.value_usd) // Ensure value is number
    })) as FunnelRecord[];
}
