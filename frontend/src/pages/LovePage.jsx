import { useLoveStore } from '../context/useLoveStore';
import LoveSidebar from '../components/LoveSidebar';
import LoveChatContainer from '../components/LoveChatContainer';
import NoChatSelected from '../components/NoChatSelected';
import { ArrowLeft } from 'lucide-react';

const LovePage = () => {
    const { selectedConnection, setSelectedConnection } = useLoveStore();

    return (
        <div className="flex h-full w-full overflow-hidden pb-16 md:pb-0">
            {/* Sidebar */}
            <div className={`
                ${selectedConnection ? 'hidden md:flex' : 'flex'}
                w-full md:w-72 lg:w-80 shrink-0 h-full overflow-hidden
            `}>
                <LoveSidebar />
            </div>

            {/* Chat */}
            <div className={`
                ${selectedConnection ? 'flex' : 'hidden md:flex'}
                flex-1 flex-col h-full relative border-l border-white/5 min-w-0
            `}>
                {selectedConnection && (
                    <button
                        onClick={() => setSelectedConnection(null)}
                        className="md:hidden absolute top-2.5 left-2.5 z-30 size-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                )}
                {selectedConnection ? <LoveChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default LovePage;
