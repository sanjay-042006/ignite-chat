import { useGroupStore } from '../context/useGroupStore';
import GroupSidebar from '../components/GroupSidebar';
import GroupChatContainer from '../components/GroupChatContainer';
import NoChatSelected from '../components/NoChatSelected';
import { ArrowLeft } from 'lucide-react';

const GroupPage = () => {
    const { selectedGroup, setSelectedGroup } = useGroupStore();

    return (
        <div className="flex h-full w-full overflow-hidden pb-16 md:pb-0">
            {/* Sidebar */}
            <div className={`
                ${selectedGroup ? 'hidden md:flex' : 'flex'}
                w-full md:w-72 lg:w-80 shrink-0 h-full overflow-hidden
            `}>
                <GroupSidebar />
            </div>

            {/* Chat */}
            <div className={`
                ${selectedGroup ? 'flex' : 'hidden md:flex'}
                flex-1 flex-col h-full relative border-l border-white/5 min-w-0
            `}>

                {selectedGroup ? <GroupChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default GroupPage;
