export const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return `${baseUrl}${url}`;
};
