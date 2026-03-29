import { useGroupStore } from '../context/useGroupStore';
import GroupSidebar from '../components/GroupSidebar';
import GroupChatContainer from '../components/GroupChatContainer';
import NoChatSelected from '../components/NoChatSelected';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroupPage = () => {
    const { selectedGroup, setSelectedGroup } = useGroupStore();
    const navigate = useNavigate();

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Sidebar */}
            <div className={`
                ${selectedGroup ? 'hidden md:flex' : 'flex'}
                w-full md:w-72 lg:w-80 shrink-0 h-full overflow-hidden flex-col
            `}>
                {/* Back Button Header (mobile only) */}
                <div className="flex md:hidden items-center gap-2 px-3 py-2.5 border-b border-white/5 shrink-0"
                    style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <button onClick={() => navigate('/')}
                        className="size-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                        <ArrowLeft className="size-4" />
                    </button>
                    <span className="text-sm font-semibold">Groups</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <GroupSidebar />
                </div>
            </div>

            {/* Chat */}
            <div className={`
                ${selectedGroup ? 'flex' : 'hidden md:flex'}
                flex-1 flex-col h-full relative border-l border-white/5 min-w-0
            `}>
                {/* Mobile back to group list */}
                {selectedGroup && (
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="md:hidden absolute top-2.5 left-2.5 z-30 size-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                )}
                {selectedGroup ? <GroupChatContainer /> : <NoChatSelected />}
            </div>
        </div>
    );
};

export default GroupPage;
