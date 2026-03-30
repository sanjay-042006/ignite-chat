export const MediaAttachment = ({ message }) => {
    if (!message.mediaUrl) return null;

    // Resolve URL correctly — in the APK VITE_BASE_URL is the absolute backend host
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    // If it's already an absolute URL (http/https or data:), use as-is
    const src = message.mediaUrl.startsWith('http') || message.mediaUrl.startsWith('data:')
        ? message.mediaUrl
        : `${baseUrl}${message.mediaUrl}`;

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
