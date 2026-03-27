import { useEffect } from 'react';
import { useChatStore } from '../context/useChatStore';
import ChatSidebar from '../components/ChatSidebar';
import ChatContainer from '../components/ChatContainer';
import NoChatSelected from '../components/NoChatSelected';
import { ArrowLeft } from 'lucide-react';

const HomePage = () => {
    const { getUsers, selectedUser, setSelectedUser } = useChatStore();
    useEffect(() => { getUsers(); }, [getUsers]);

    return (
        <div className="flex h-full w-full overflow-hidden pb-16 md:pb-0">
            {/* Sidebar — hidden on mobile when chat is open */}
            <div className={`
                ${selectedUser ? 'hidden md:flex' : 'flex'}
                w-full md:w-72 lg:w-80 shrink-0
                h-full overflow-hidden
            `}>
                <ChatSidebar />
            </div>

            {/* Chat area — hidden on mobile when no user selected */}
            <div className={`
                ${selectedUser ? 'flex' : 'hidden md:flex'}
                flex-1 flex-col h-full relative border-l border-white/5 min-w-0
            `}>
                {/* Mobile back button */}
                {selectedUser && (
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="md:hidden absolute top-2.5 left-2.5 z-30 size-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                )}
                {selectedUser ? <ChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default HomePage;
