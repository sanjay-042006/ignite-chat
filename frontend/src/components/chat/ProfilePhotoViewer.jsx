import { useState } from 'react';
import { X } from 'lucide-react';

const ProfilePhotoViewer = ({ src, alt, onClose }) => {
    const [zoomed, setZoomed] = useState(false);

    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[110] size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
                <X className="size-5" />
            </button>

            {/* Username label */}
            {alt && (
                <div className="absolute top-5 left-5 z-[110] text-white/80 text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    {alt}
                </div>
            )}

            {/* Image */}
            <img
                src={src}
                alt={alt || 'Profile'}
                onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
                className={`max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl shadow-black/50 object-contain cursor-zoom-in transition-transform duration-300 ${zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'}`}
            />
        </div>
    );
};

export default ProfilePhotoViewer;
