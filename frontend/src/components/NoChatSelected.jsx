import { MessageSquare, Users, Heart, Compass, Ghost, Edit, BookOpen, Flame } from 'lucide-react';

const features = [
    { icon: MessageSquare, label: 'Direct Chat', color: 'from-blue-500 to-cyan-500' },
    { icon: Users, label: 'Groups', color: 'from-violet-500 to-purple-500' },
    { icon: Heart, label: 'My Love', color: 'from-pink-500 to-rose-500' },
    { icon: Compass, label: 'Stranger', color: 'from-amber-500 to-orange-500' },
    { icon: Ghost, label: 'Interest', color: 'from-emerald-500 to-teal-500' },
    { icon: Edit, label: 'Practice', color: 'from-sky-500 to-blue-500' },
    { icon: BookOpen, label: 'Stories', color: 'from-fuchsia-500 to-pink-500' },
];

const NoChatSelected = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full relative overflow-hidden p-6">
            {/* Background blobs */}
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/[0.05] rounded-full blur-[100px] animate-glow-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-2/3 left-1/4 w-64 h-64 bg-pink-500/[0.03] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '3s' }} />

            <div className="relative z-10 text-center max-w-sm animate-slide-up">
                {/* Logo */}
                <div className="size-16 md:size-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/20 animate-float">
                    <Flame className="size-8 md:size-7 text-white" />
                </div>

                <h2 className="text-2xl md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-1.5">
                    Welcome to IgniteChat
                </h2>
                <p className="text-sm md:text-xs text-muted-foreground mb-6">
                    Select a conversation or explore a feature below
                </p>

                {/* Feature Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {features.map((f) => (
                        <div key={f.label} className="flex flex-col items-center gap-2 p-3 md:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition group cursor-default">
                            <div className={`size-10 md:size-8 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                <f.icon className="size-5 md:size-4 text-white" />
                            </div>
                            <span className="text-[11px] md:text-[9px] font-semibold text-muted-foreground/80 text-center leading-tight">{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NoChatSelected;
