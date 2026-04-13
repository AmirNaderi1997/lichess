import React, { useState, useEffect } from 'react';
import { Users, Newspaper, MessageSquare, ThumbsUp, ChevronRight, User, Plus } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');

const Community = ({ t, lang }) => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        socket.emit('get_community_posts');
        const handlePosts = (data) => setPosts(data);
        socket.on('community_posts', handlePosts);
        return () => socket.off('community_posts', handlePosts);
    }, []);

    const getPostTitle = (post) => {
        if (lang === 'fa') return post.title_fa || post.title;
        return post.title;
    };

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Content */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black flex items-center gap-3 text-theme-bright tracking-tight">
                            <Newspaper className="text-[#3692e7]" size={32} /> {t('forum')}
                        </h1>
                        <button className="chess-button chess-button-primary flex items-center gap-2">
                            <Plus size={18} /> {t('newDiscussion')}
                        </button>
                    </div>

                    <div className="glass-card divide-y divide-theme overflow-hidden">
                        {posts.map(post => (
                            <div key={post.id} className="p-6 hover:bg-theme-alt transition-all cursor-pointer space-y-3 group text-start">
                                <div className="flex items-center gap-3 text-xs text-theme-dim font-medium">
                                    <div className="px-2 py-0.5 bg-theme-active rounded text-theme-main border border-theme">
                                        {post.author}
                                    </div>
                                    <span className="opacity-30">•</span>
                                    <span>{post.timestamp}</span>
                                </div>
                                <h3 className="text-xl font-bold text-theme-bright group-hover:text-[#3692e7] transition-colors leading-snug">
                                    {getPostTitle(post)}
                                </h3>
                                <div className="flex items-center gap-5 text-xs text-theme-dim">
                                    <div className="flex items-center gap-1.5 px-2 py-1 hover:text-[#629924] transition-colors">
                                        <ThumbsUp size={14} /> {post.likes}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 hover:text-[#3692e7] transition-colors">
                                        <MessageSquare size={14} /> 8
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-full md:w-[320px] space-y-6">
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-theme pb-4">
                            <h2 className="font-bold flex items-center gap-2 text-theme-bright">
                                <Users size={20} className="text-[#629924]" /> {t('onlinePlayers')}
                            </h2>
                            <span className="text-[10px] bg-[#629924]/10 text-[#629924] px-2 py-0.5 rounded-full font-bold">14,290</span>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center justify-between text-sm group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-theme-active flex items-center justify-center border border-theme group-hover:bg-[#629924]/10 group-hover:border-[#629924]/30 transition-all">
                                            <User size={16} className="text-theme-dim group-hover:text-[#629924]" />
                                        </div>
                                        <span className="font-bold text-theme-main group-hover:text-theme-bright">User_{i}42</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-3 text-xs font-bold text-theme-dim uppercase tracking-widest border border-theme rounded-xl hover:bg-theme-active hover:text-theme-bright transition-all mt-2">
                                {lang === 'fa' ? 'نمایش همه' : 'View All'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <h2 className="font-black text-[10px] text-theme-dim uppercase tracking-[0.2em] border-b border-theme pb-4">{t('topTeams')}</h2>
                        <div className="space-y-2">
                            <div className="p-4 bg-theme-active rounded-xl flex items-center justify-between border border-theme hover:border-[#3692e7]/40 transition-colors cursor-pointer group">
                                <div className="space-y-1">
                                    <div className="font-bold text-theme-bright group-hover:text-[#3692e7]">Team Iran</div>
                                    <div className="text-[10px] text-theme-dim font-medium uppercase tracking-wider">1,215 {t('members')}</div>
                                </div>
                                <ChevronRight size={18} className={`text-theme-dim group-hover:text-[#3692e7] transition-transform ${lang === 'fa' ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="p-4 hover:bg-theme-active rounded-xl flex items-center justify-between border border-transparent hover:border-theme transition-all cursor-pointer group">
                                <div className="space-y-1">
                                    <div className="font-bold text-theme-main group-hover:text-theme-bright">Bullet Masters</div>
                                    <div className="text-[10px] text-theme-dim font-medium uppercase tracking-wider">850 {t('members')}</div>
                                </div>
                                <ChevronRight size={18} className={`text-theme-dim group-hover:translate-x-1 transition-transform ${lang === 'fa' ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Community;
