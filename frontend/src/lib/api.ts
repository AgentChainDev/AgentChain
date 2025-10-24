/**
 * Small fetch wrapper that reads API base from Vite env variable VITE_API_URL.
 * Falls back to http://localhost:4000 for local development.
 */
const BASE = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:4000';

async function apiFetch(path: string, opts: RequestInit = {}) {
    const url = BASE.replace(/\/$/, '') + path;
    const res = await fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
        },
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status} ${res.statusText}: ${txt}`);
    }
    // try parse json, but allow empty
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch (e) {
        return text;
    }
}

export default apiFetch;

export const getHealth = () => apiFetch('/api/health');
export const getBlocks = () => apiFetch('/api/blocks');
