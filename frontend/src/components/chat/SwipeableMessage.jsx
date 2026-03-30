import { useRef, useState, useCallback } from 'react';
import { Reply } from 'lucide-react';

const SWIPE_THRESHOLD = 60;

const SwipeableMessage = ({ children, onReply, isMine }) => {
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const [translateX, setTranslateX] = useState(0);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Touch handlers for mobile swipe
    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentX.current = e.touches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e) => {
        touchCurrentX.current = e.touches[0].clientX;
        // Only allow swipe right (positive direction)
        const diff = Math.max(0, Math.min(touchCurrentX.current - touchStartX.current, SWIPE_THRESHOLD + 20));
        setTranslateX(diff);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (translateX >= SWIPE_THRESHOLD) {
            onReply?.();
        }
        setTranslateX(0);
    }, [translateX, onReply]);

    // Right-click context menu for desktop
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);

        const closeMenu = () => {
            setShowContextMenu(false);
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    }, []);

    const handleReplyClick = useCallback(() => {
        setShowContextMenu(false);
        onReply?.();
    }, [onReply]);

    const opacity = Math.min(translateX / SWIPE_THRESHOLD, 1);

    return (
        <div className="relative" ref={containerRef}>
            {/* Swipe indicator */}
            {translateX > 10 && (
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-blue-400 transition-opacity"
                    style={{ opacity }}
                >
                    <Reply className="size-4" />
                    <span className="text-[10px] font-semibold">Reply</span>
                </div>
            )}

            {/* Message with swipe transform */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={handleContextMenu}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: translateX === 0 ? 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)' : 'none',
                }}
            >
                {children}
            </div>

            {/* Desktop right-click context menu */}
            {showContextMenu && (
                <div
                    className="fixed z-[200] bg-[#0c1120] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 min-w-[140px] animate-slide-up"
                    style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                >
                    <button
                        onClick={handleReplyClick}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Reply className="size-4 text-blue-400" />
                        Reply
                    </button>
                </div>
            )}
        </div>
    );
};

export default SwipeableMessage;
