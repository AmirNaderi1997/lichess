import React, { useState } from 'react';
import { X, User, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import API_URL from '../config';

const AuthModal = ({ onClose, onSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = mode === 'login' ? '/api/login' : '/api/register';
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Something went wrong');

            localStorage.setItem('lichess_token', data.access_token);
            onSuccess(data.user);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-theme bg-theme-alt">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-theme-bright">
                        {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                        {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    </h2>
                    <button onClick={onClose} className="text-theme-dim hover:text-theme-bright">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 bg-theme-card">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-theme-dim uppercase block mb-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-theme-dim" size={16} />
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-theme-alt border border-theme rounded px-10 py-2 text-sm focus:outline-none focus:border-[#629924]"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div>
                                <label className="text-xs font-bold text-theme-dim uppercase block mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-theme-dim" size={16} />
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-theme-alt border border-theme rounded px-10 py-2 text-sm focus:outline-none focus:border-[#629924]"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-theme-dim uppercase block mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-theme-dim" size={16} />
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-theme-alt border border-theme rounded px-10 py-2 text-sm focus:outline-none focus:border-[#629924]"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="chess-button chess-button-primary w-full py-3"
                        >
                            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-xs text-[#629924] hover:underline font-bold"
                        >
                            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
