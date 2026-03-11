import { useGroupStore } from '../context/useGroupStore';
import GroupSidebar from '../components/GroupSidebar';
import GroupChatContainer from '../components/GroupChatContainer';
import NoChatSelected from '../components/NoChatSelected';

const GroupPage = () => {
    const { selectedGroup } = useGroupStore();

    return (
        <div className="flex h-full w-full">
            {/* Dynamic Groups List Sidebar */}
            <GroupSidebar />

            {/* Main Messaging Area */}
            <div className="flex-1 h-full relative border-l border-border/50">
                {selectedGroup ? <GroupChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default GroupPage;
