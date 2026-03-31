import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, X, Loader2, Reply, Search } from 'lucide-react';
import { api } from '../../context/useAuthStore';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';

const gf = new GiphyFetch('sXpGFDGZs0Dv1mmtVfsPmdH1270gEQam');

const EMOJIS = ['😀','😂','🥺','😎','😍','😭','😡','👍','🙏','🔥','❤️','✨','🎉','💯'];
const STICKERS = [
  'https://cdn-icons-png.flaticon.com/512/4604/4604323.png',
  'https://cdn-icons-png.flaticon.com/512/4604/4604318.png',
  'https://cdn-icons-png.flaticon.com/512/4604/4604297.png'
];

const MessageInput = ({ onSendMessage, placeholder = "Type a message...", disabled = false, replyTo = null, onCancelReply = null }) => {
    const [text, setText] = useState('');
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [activeTab, setActiveTab] = useState('emojis');
    const [gifSearch, setGifSearch] = useState('');
    const fileInputRef = useRef(null);
    const inputRef = useRef(null); // Reference for contentEditable div

    const fetchGifs = (offset) => {
        if (gifSearch) return gf.search(gifSearch, { offset, limit: 10 });
        return gf.trending({ offset, limit: 10 });
    };

    const sendGif = async (gif, e) => {
        e.preventDefault();
        await onSendMessage({ text: '', mediaUrl: gif.images.fixed_height.url, mediaType: 'GIF', replyToId: replyTo?.id || null });
        if (onCancelReply) onCancelReply();
        setShowEmojis(false);
    };

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

            await onSendMessage({ text: text.trim(), mediaUrl, mediaType, replyToId: replyTo?.id || null });
            if (onCancelReply) onCancelReply();
            
            setText('');
            if (inputRef.current) inputRef.current.textContent = ''; // Reset div
            removeMedia();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            setShowEmojis(false);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1 || items[i].type.includes('gif')) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    setMediaFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setMediaPreview({ url: reader.result, type: file.type.startsWith('video/') ? 'VIDEO' : (file.type.includes('gif') ? 'GIF' : 'IMAGE') });
                    reader.readAsDataURL(file);
                }
                return; // Suppress text paste if it's an image
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const sendSticker = async (url) => {
        await onSendMessage({ text: '', mediaUrl: url, mediaType: 'STICKER' });
        setShowEmojis(false);
    };

    return (
        <div className="flex flex-col gap-1 w-full relative">
            {/* Reply preview bar */}
            {replyTo && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/15 rounded-xl mx-0.5">
                    <Reply className="size-3.5 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-blue-400">Replying</p>
                        <p className="text-[11px] text-white/60 truncate">{replyTo.content || (replyTo.mediaUrl ? '📎 Media' : '...')}</p>
                    </div>
                    <button type="button" onClick={onCancelReply} className="text-muted-foreground hover:text-white shrink-0 p-0.5">
                        <X className="size-3.5" />
                    </button>
                </div>
            )}
            {showEmojis && (
                <div className="absolute bottom-full left-0 mb-4 bg-[#0c1120] border border-white/10 rounded-xl shadow-xl w-72 z-50 overflow-hidden flex flex-col h-80">
                    <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/40">
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setActiveTab('emojis')} className={`text-xs font-semibold tracking-wider uppercase transition-colors ${activeTab === 'emojis' ? 'text-blue-400' : 'text-muted-foreground hover:text-white'}`}>Emojis</button>
                            <button type="button" onClick={() => setActiveTab('stickers')} className={`text-xs font-semibold tracking-wider uppercase transition-colors ${activeTab === 'stickers' ? 'text-blue-400' : 'text-muted-foreground hover:text-white'}`}>Stickers</button>
                            <button type="button" onClick={() => setActiveTab('gifs')} className={`text-xs font-semibold tracking-wider uppercase transition-colors ${activeTab === 'gifs' ? 'text-blue-400' : 'text-muted-foreground hover:text-white'}`}>GIFs</button>
                        </div>
                        <button type="button" onClick={() => setShowEmojis(false)} className="text-muted-foreground hover:text-white p-1 bg-white/5 rounded-full"><X className="size-3" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        {activeTab === 'emojis' && (
                            <div className="flex flex-wrap gap-2">
                                {EMOJIS.map(e => (
                                    <button 
                                        key={e} 
                                        type="button" 
                                        onClick={() => {
                                            const newText = text + e;
                                            setText(newText);
                                            if (inputRef.current) inputRef.current.textContent = newText;
                                        }} 
                                        className="text-2xl hover:scale-125 transition-transform p-1"
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === 'stickers' && (
                            <div className="flex flex-wrap gap-2">
                                {STICKERS.map(s => (
                                    <button key={s} type="button" onClick={() => sendSticker(s)} className="size-12 rounded-lg hover:bg-white/10 p-1 border border-transparent transition-all">
                                        <img src={s} alt="sticker" className="w-full h-full object-contain drop-shadow-sm" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === 'gifs' && (
                            <div className="flex flex-col h-full gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                                    <input 
                                        type="text" 
                                        placeholder="Search Tenor/Giphy..." 
                                        value={gifSearch}
                                        onChange={(e) => setGifSearch(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="flex-1 overflow-hidden min-h-0 bg-black/20 rounded-lg">
                                    <Grid 
                                        width={260} 
                                        columns={2} 
                                        fetchGifs={fetchGifs} 
                                        key={gifSearch} 
                                        onGifClick={sendGif} 
                                        noResultsMessage={<div className="text-center text-xs text-muted-foreground mt-4">No GIFs found</div>}
                                        hideContextMenu={true}
                                    />
                                </div>
                            </div>
                        )}
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

            <form onSubmit={handleSubmit} className="flex gap-1.5 w-full relative overflow-hidden items-end">
                <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-colors shrink-0">
                    <Smile className="size-4" />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-colors shrink-0">
                    <ImageIcon className="size-4" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,.gif" />
                </button>
                <div className="relative flex-1 min-w-0 bg-white/5 border border-white/5 rounded-xl px-3 py-2 transition flex items-center">
                    <div
                        ref={inputRef}
                        contentEditable={!disabled && !isUploading}
                        suppressContentEditableWarning
                        onInput={(e) => setText(e.currentTarget.textContent)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        className="w-full text-sm text-foreground focus:outline-none max-h-32 overflow-y-auto custom-scrollbar"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', outline: 'none' }}
                    />
                    {!text && (
                        <span className="absolute left-3 text-sm text-muted-foreground/30 pointer-events-none select-none">
                            {placeholder}
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={disabled || isUploading || (!text.trim() && !mediaFile)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl p-2 flex items-center justify-center shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:shadow-none shrink-0"
                >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
