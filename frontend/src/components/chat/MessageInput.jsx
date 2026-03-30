import { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Smile, X, Loader2 } from 'lucide-react';
import { api } from '../../context/useAuthStore';

const EMOJIS = ['😀','😂','🥺','😎','😍','😭','😡','👍','🙏','🔥','❤️','✨','🎉','💯'];
const STICKERS = [
  'https://cdn-icons-png.flaticon.com/512/4604/4604323.png',
  'https://cdn-icons-png.flaticon.com/512/4604/4604318.png',
  'https://cdn-icons-png.flaticon.com/512/4604/4604297.png'
];

const MessageInput = ({ onSendMessage, placeholder = "Type a message...", disabled = false }) => {
    const [text, setText] = useState('');
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMediaFile(file);
        
        const reader = new FileReader();
        reader.onload = () => setMediaPreview({ url: reader.result, type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' });
        reader.readAsDataURL(file);
    };

    const removeMedia = () => {
        setMediaPreview(null);
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !mediaFile) return;

        setIsUploading(true);
        try {
            let mediaUrl = null;
            let mediaType = null;

            if (mediaFile) {
                const formData = new FormData();
                formData.append('media', mediaFile);
                const res = await api.post('/messages/upload', formData);
                mediaUrl = res.data.mediaUrl;
                mediaType = mediaFile.type?.startsWith('video/') ? 'VIDEO' : (mediaFile.type?.includes('gif') ? 'GIF' : 'IMAGE');
            }

            await onSendMessage({ text: text.trim(), mediaUrl, mediaType });
            
            setText('');
            removeMedia();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            setShowEmojis(false);
        }
    };

    const sendSticker = async (url) => {
        await onSendMessage({ text: '', mediaUrl: url, mediaType: 'STICKER' });
        setShowEmojis(false);
    };

    return (
        <div className="flex flex-col gap-2 w-full relative">
            {showEmojis && (
                <div className="absolute bottom-full left-0 mb-4 bg-[#0c1120] border border-white/10 rounded-xl p-3 shadow-xl w-64 z-50">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">Emojis & Stickers</div>
                        <button type="button" onClick={() => setShowEmojis(false)} className="text-muted-foreground hover:text-white"><X className="size-3" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {EMOJIS.map(e => (
                            <button key={e} type="button" onClick={() => setText(prev => prev + e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STICKERS.map(s => (
                            <button key={s} type="button" onClick={() => sendSticker(s)} className="size-10 rounded-lg hover:bg-white/10 p-1 border border-transparent transition-all">
                                <img src={s} alt="sticker" className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {mediaPreview && (
                <div className="relative self-start ml-2 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-lg">
                    {mediaPreview.type === 'VIDEO' ? (
                        <video src={mediaPreview.url} className="h-24 object-cover" />
                    ) : (
                        <img src={mediaPreview.url} alt="preview" className="h-24 object-cover" />
                    )}
                    <button type="button" onClick={removeMedia} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500/80 p-1 rounded-full text-white transition-colors">
                        <X className="size-3" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 w-full relative">
                <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-colors shrink-0">
                    <Smile className="size-5" />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-colors shrink-0">
                    <ImageIcon className="size-5" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,.gif" />
                </button>
                <input
                    type="text"
                    placeholder={placeholder}
                    className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/20 transition placeholder:text-muted-foreground/30"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={disabled || isUploading}
                />
                <button
                    type="submit"
                    disabled={disabled || isUploading || (!text.trim() && !mediaFile)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-4 flex items-center justify-center shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:shadow-none shrink-0"
                >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
