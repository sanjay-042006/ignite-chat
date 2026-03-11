import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar className="w-20 lg:w-64 border-r border-border/50 hidden md:flex shrink-0 z-20" />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-background/50 h-full relative">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
