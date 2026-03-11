import { MessageSquare } from 'lucide-react';

const NoChatSelected = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-background/50 relative overflow-hidden">
            {/* Subtle decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

            <div className="max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                {/* Bounce animation icon wrapper */}
                <div className="flex justify-center gap-4 mb-8">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center animate-bounce shadow-xl shadow-indigo-500/20 border border-indigo-500/20 glass">
                            <MessageSquare className="w-10 h-10 text-indigo-500" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight">Welcome to IgniteChat!</h2>
                <p className="text-muted-foreground">Select a conversation from the sidebar to text directly, or switch tabs to join anonymous rooms and meet strangers.</p>
            </div>
        </div>
    );
};

export default NoChatSelected;
