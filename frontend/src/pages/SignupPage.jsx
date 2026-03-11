import { useState } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, MessageSquare, User, Lock } from 'lucide-react';

const SignupPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const { signup, isSigningUp } = useAuthStore();

    const validateForm = () => {
        if (!formData.username.trim()) return alert("Username is required");
        if (!formData.email.trim()) return alert("Email is required");
        if (!/\S+@\S+\.\S+/.test(formData.email)) return alert("Invalid email format");
        if (!formData.password) return alert("Password is required");
        if (formData.password.length < 6) return alert("Password must be at least 6 characters");
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm() === true) {
            signup(formData);
        }
    };

    return (
        <div className="min-h-screen bg-background grid lg:grid-cols-2">
            {/* LEFT SIDE */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8 glass p-8 rounded-2xl shadow-xl">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2 group">
                            <div
                                className="size-12 rounded-xl bg-indigo-500/20 flex items-center justify-center 
              group-hover:bg-indigo-500/30 transition-colors"
                            >
                                {/* Fallback to simple svg if lucide icons are missing */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /><path d="M12 12h.01" /><path d="M8 12h.01" /><path d="M16 12h.01" /></svg>
                            </div>
                            <h1 className="text-2xl font-bold mt-2 tracking-tight">Create Account</h1>
                            <p className="text-muted-foreground text-sm">Join IgniteChat to connect with everyone.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name / Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                    {/* Person Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <input
                                    type="text"
                                    className={`w-full bg-input/20 border border-border rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="John Doe"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                    {/* Mail Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <input
                                    type="email"
                                    className={`w-full bg-input/20 border border-border rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                    {/* Lock Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full bg-input/20 border border-border rounded-lg py-2 pl-10 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center"
                            disabled={isSigningUp}
                        >
                            {isSigningUp ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-semibold underline-offset-4 hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden bg-indigo-950/20">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl -z-10" />
                <div className="relative z-10 text-center space-y-8 glass p-12 rounded-3xl max-w-lg border-white/10">
                    <h2 className="text-4xl font-extrabold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">Connect Anonymously.</h2>
                    <p className="text-gray-300 text-lg">
                        Experience real-time chatting with strangers, topic-based groups, and privacy-first design.
                    </p>
                </div>
                {/* Decorative blur blobs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px] -z-10" />
            </div>

        </div>
    );
};

export default SignupPage;
