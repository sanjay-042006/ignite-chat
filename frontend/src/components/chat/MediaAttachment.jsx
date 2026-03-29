export const MediaAttachment = ({ message }) => {
    if (!message.mediaUrl) return null;

    // Resolve URL correctly for localhost proxy or production
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
    // If it's a sticker (absolute URL), don't prepend baseUrl
    const src = message.mediaUrl.startsWith('http') ? message.mediaUrl : `${baseUrl}${message.mediaUrl}`;

    // Determine media type from explicit field OR fall back to extension detection
    const getMediaType = () => {
        if (message.mediaType) return message.mediaType;
        const url = message.mediaUrl.toLowerCase();
        if (url.match(/\.(mp4|webm|mov|avi)(\?|$)/)) return 'VIDEO';
        if (url.match(/\.(gif)(\?|$)/)) return 'GIF';
        // Default to IMAGE for anything else (jpg, png, webp, etc.)
        return 'IMAGE';
    };

    const type = getMediaType();

    return (
        <div className="mb-2 rounded-lg overflow-hidden relative group">
            {type === 'VIDEO' ? (
                <video src={src} controls className="max-h-[300px] rounded-lg w-full object-contain bg-black/20" />
            ) : type === 'STICKER' ? (
                <img src={src} alt="sticker" className="max-h-[120px] object-contain drop-shadow-md" />
            ) : (
                <img src={src} alt="photo" className="max-h-[300px] rounded-lg w-full object-contain bg-black/20 group-hover:opacity-90 transition-opacity" loading="lazy" />
            )}
        </div>
    );
};
