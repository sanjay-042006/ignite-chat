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
        <div className="flex h-full w-full overflow-hidden">
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
                {selectedUser ? <ChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default HomePage;
