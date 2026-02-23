export const getApiUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    // If it's a full URL, return as is
    if (baseUrl.startsWith('http')) {
        return `${baseUrl.replace(/\/$/, '')}${path}`;
    }
    // Fallback for local development if needed, but relative paths fail on Capacitor
    return path;
};
