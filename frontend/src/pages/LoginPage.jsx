import { useState } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { Link } from 'react-router-dom';
import { Flame, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login, isLoggingIn } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return alert("Both fields are required");
        login(formData);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'linear-gradient(135deg, #05070e 0%, #0c1120 50%, #0f0a1e 100%)' }}>
            {/* LEFT — Form */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
                {/* Background accent */}
                <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-indigo-500/[0.06] rounded-full blur-[120px]" />

                <div className="w-full max-w-md space-y-8 relative z-10 animate-slide-up">
                    {/* Logo + Title */}
                    <div className="text-center space-y-3">
                        <div className="flex justify-center">
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
                                <Flame className="size-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
                            <p className="text-sm text-muted-foreground mt-1">Sign in to your IgniteChat account</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-indigo-400 transition" />
                                <input
                                    type="email"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 transition placeholder:text-muted-foreground/30"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-indigo-400 transition" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 transition placeholder:text-muted-foreground/30"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70 transition" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? <Loader2 className="size-5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="size-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Create account</Link>
                    </p>
                </div>
            </div>

            {/* RIGHT — Hero */}
            <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.05] to-transparent" />
                <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] animate-glow-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-2/3 right-1/5 w-56 h-56 bg-pink-500/10 rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: '2s' }} />

                <div className="relative z-10 text-center space-y-6 glass p-10 rounded-3xl max-w-lg">
                    <Sparkles className="size-8 text-indigo-400 mx-auto animate-pulse" />
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                        Connect. Chat. Ignite.
                    </h2>
                    <p className="text-foreground/60 text-sm leading-relaxed">
                        From direct messages to AI-powered conversations, group chats to love connections —
                        your ultimate chat experience awaits.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        {['💬', '🔥', '❤️', '✨', '🌍'].map((emoji, i) => (
                            <div key={i} className="size-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-sm animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                                {emoji}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
