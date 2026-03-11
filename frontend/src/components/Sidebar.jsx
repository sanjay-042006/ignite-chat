import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../context/useAuthStore';
import { LogOut, MessageSquare, Ghost, Users, Compass, BookOpen, Edit } from 'lucide-react';

const Sidebar = ({ className = '' }) => {
    const { authUser, logout } = useAuthStore();

    const links = [
        { to: '/', icon: MessageSquare, label: 'Normal Chat' },
        { to: '/groups', icon: Users, label: 'Groups' },
        { to: '/stranger', icon: Compass, label: 'Stranger Connect' },
        { to: '/interest', icon: Ghost, label: 'Interest Rooms' },
        { to: '/practice', icon: Edit, label: 'English Practice' },
        { to: '/library', icon: BookOpen, label: 'Story Library' },
    ];

    return (
        <div className={`h-full flex flex-col bg-card/80 backdrop-blur-md justify-between py-6 items-center ${className}`}>
            <div className="flex flex-col items-center w-full space-y-8">
                {/* App Logo */}
                <div className="size-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                    IC
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col space-y-2 w-full px-2">
                    {links.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center lg:justify-start justify-center p-3 rounded-lg transition-colors relative group
                        ${isActive ? 'bg-indigo-500/10 text-indigo-500' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`
                            }
                            title={item.label}
                        >
                            <item.icon className="size-6 shrink-0" />
                            <span className="hidden lg:block ml-3 font-medium truncate">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Actions */}
            <div className="flex flex-col items-center w-full space-y-4 px-2">
                {authUser && (
                    <div className="hidden lg:block w-full text-center py-2 text-xs font-medium text-muted-foreground truncate px-2">
                        {authUser.username}
                    </div>
                )}
                <button
                    onClick={logout}
                    className="p-3 w-full lg:w-auto flex items-center justify-center lg:px-4 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Logout"
                >
                    <LogOut className="size-5 shrink-0" />
                    <span className="hidden lg:block ml-2 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
