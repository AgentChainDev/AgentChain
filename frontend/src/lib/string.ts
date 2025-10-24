export function safeUpper(s?: string | null) {
    return (s || '').toString().toUpperCase();
}

export default safeUpper;
