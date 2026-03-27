export const MediaAttachment = ({ message }) => {
    if (!message.mediaUrl) return null;

    // Resolve URL correctly for localhost proxy or production
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
    // If it's a sticker (absolute URL), don't prepend baseUrl
    const src = message.mediaUrl.startsWith('http') ? message.mediaUrl : `${baseUrl}${message.mediaUrl}`;

    return (
        <div className="mb-2 rounded-lg overflow-hidden relative group">
            {message.mediaType === 'VIDEO' ? (
                <video src={src} controls className="max-h-[300px] rounded-lg w-full object-contain bg-black/20" />
            ) : message.mediaType === 'STICKER' ? (
                <img src={src} alt="sticker" className="max-h-[120px] object-contain drop-shadow-md" />
            ) : (
                <img src={src} alt="media" className="max-h-[300px] rounded-lg w-full object-contain bg-black/20 group-hover:opacity-90 transition-opacity" />
            )}
        </div>
    );
};
