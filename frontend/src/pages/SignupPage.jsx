import { useState } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, User, Lock, Flame, ArrowRight, Zap, Camera } from 'lucide-react';

const SignupPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', profilePic: '' });
    const { signup, isSigningUp } = useAuthStore();

    const validateForm = () => {
        if (!formData.username.trim()) return alert("Username is required");
        if (!formData.email.trim()) return alert("Email is required");
        if (!/\S+@\S+\.\S+/.test(formData.email)) return alert("Invalid email format");
        if (!formData.password) return alert("Password is required");
        if (formData.password.length < 6) return alert("Password must be at least 6 characters");
        return true;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result;
            setFormData({ ...formData, profilePic: base64Image });
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm() === true) signup(formData);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'linear-gradient(135deg, #05070e 0%, #0c1120 50%, #0f0a1e 100%)' }}>
            {/* LEFT — Form */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
                <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-purple-500/[0.06] rounded-full blur-[120px]" />

                <div className="w-full max-w-md space-y-7 relative z-10 animate-slide-up">
                    <div className="text-center space-y-3">
                        <div className="flex justify-center mb-2">
                            <div className="relative group cursor-pointer">
                                <div className="size-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden hover:border-purple-500/50 transition">
                                    {formData.profilePic ? (
                                        <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="size-8 text-muted-foreground/50 group-hover:text-purple-400 transition" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                                <div className="absolute bottom-0 right-0 size-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-[#05070e] text-white shadow-sm">
                                    <div className="text-white text-sm font-bold leading-none mb-0.5">+</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">Create Account</h1>
                            <p className="text-sm text-muted-foreground mt-1">Join IgniteChat and start connecting</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-purple-400 transition" />
                                <input
                                    type="text"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30 transition placeholder:text-muted-foreground/30"
                                    placeholder="john_doe"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-purple-400 transition" />
                                <input
                                    type="email"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30 transition placeholder:text-muted-foreground/30"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-purple-400 transition" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30 transition placeholder:text-muted-foreground/30"
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
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isSigningUp}
                        >
                            {isSigningUp ? <Loader2 className="size-5 animate-spin" /> : <><span>Create Account</span><ArrowRight className="size-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">Sign in</Link>
                    </p>
                </div>
            </div>

            {/* RIGHT — Hero */}
            <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] via-pink-500/[0.05] to-transparent" />
                <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-glow-pulse" />
                <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-pink-500/15 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 text-center space-y-6 glass p-10 rounded-3xl max-w-lg">
                    <Zap className="size-8 text-purple-400 mx-auto animate-pulse" />
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
                        Your Voice. Amplified.
                    </h2>
                    <p className="text-foreground/60 text-sm leading-relaxed">
                        Practice languages with AI, meet strangers anonymously, build story worlds, and find your special someone.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        {['🗣️', '🤖', '📖', '💕', '🎭'].map((emoji, i) => (
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

export default SignupPage;
