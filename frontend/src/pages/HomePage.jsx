import { useEffect } from 'react';
import { useChatStore } from '../context/useChatStore';
import { useAuthStore } from '../context/useAuthStore';
import ChatSidebar from '../components/ChatSidebar';
import ChatContainer from '../components/ChatContainer';
import NoChatSelected from '../components/NoChatSelected';

const HomePage = () => {
    const { getUsers } = useChatStore();
    const { selectedUser } = useChatStore();

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    return (
        <div className="flex h-full w-full">
            {/* Dynamic Users List Sidebar */}
            <ChatSidebar />

            {/* Main Messaging Area */}
            <div className="flex-1 h-full relative border-l border-border/50">
                {selectedUser ? <ChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default HomePage;
