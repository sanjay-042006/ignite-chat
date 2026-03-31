import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

import PracticeInviteListener from './PracticeInviteListener';

const Layout = () => {
    const location = useLocation();
    // Show mobile tab bar only on the home page
    const isHome = location.pathname === '/';

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-background text-foreground overflow-hidden">
            <PracticeInviteListener />
            {/* Desktop Sidebar — always visible */}
            <Sidebar className="w-16 lg:w-60 border-r border-white/5 hidden md:flex shrink-0 z-20" />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <Outlet />
            </main>

            {/* Mobile Bottom Tab Bar — only visible on home page */}
            {isHome && (
                <Sidebar className="flex md:hidden z-50 border-t border-white/5 shrink-0 w-full" isMobile />
            )}
        </div>
    );
};

export default Layout;
