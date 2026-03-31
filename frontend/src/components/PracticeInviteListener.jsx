import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocketStore } from '../context/useSocketStore';
import { usePracticeStore } from '../context/usePracticeStore';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';

const PracticeInviteListener = () => {
    const { socket } = useSocketStore();
    const navigate = useNavigate();
    const { setupPracticeListeners } = usePracticeStore();

    useEffect(() => {
        if (!socket) return;
        
        setupPracticeListeners();

        const handleInvite = ({ inviterId, inviterUsername }) => {
            toast.custom((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'
                    } max-w-sm w-full bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-4`}
                >
                    <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-lg shadow-sky-500/20">
                            <BookOpen className="size-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Practice Invite!</h3>
                            <p className="text-muted-foreground text-xs mt-1">
                                <span className="text-white font-semibold">{inviterUsername}</span> wants to practice English with you.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => {
                                socket.emit('acceptPracticeInvite', { inviterId, inviterUsername });
                                toast.dismiss(t.id);
                                navigate('/practice');
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-xs py-2 rounded-xl transition hover:opacity-90 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <CheckCircle2 className="size-4" /> Accept
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 font-semibold text-xs py-2 rounded-xl transition hover:bg-red-500/20 active:scale-[0.98]"
                        >
                            <XCircle className="size-4" /> Decline
                        </button>
                    </div>
                </div>
            ), { duration: 10000 });
        };

        const handleDirectMatch = () => {
            // Inviter gets navigated to practice page when matched directly
            navigate('/practice');
        };

        socket.on('receivePracticeInvite', handleInvite);
        socket.on('practiceMatchDirect', handleDirectMatch);

        return () => {
            socket.off('receivePracticeInvite', handleInvite);
            socket.off('practiceMatchDirect', handleDirectMatch);
        };
    }, [socket, navigate, setupPracticeListeners]);

    return null;
};

export default PracticeInviteListener;
