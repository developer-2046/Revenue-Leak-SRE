import Papa from 'papaparse';
import { FunnelRecord } from './types';

export function parseCSV(csvString: string): FunnelRecord[] {
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });

    // Cast to FunnelRecord. In a real app we'd validate schema with Zod.
    return result.data as FunnelRecord[];
}
