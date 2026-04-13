import React, { useState, useEffect } from 'react';
import ChessBoard from '../components/ChessBoard';
import { Eye, Users, Search, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');

const Watch = ({ t, lang }) => {
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        socket.emit('get_watch_games');
        const handleWatchList = (data) => {
            setGames(data);
            if (data.length > 0 && !selectedGame) setSelectedGame(data[0]);
            setLoading(false);
        };
        socket.on('watch_games_list', handleWatchList);

        return () => socket.off('watch_games_list', handleWatchList);
    }, [selectedGame]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-20">
            <RefreshCw className="animate-spin text-[#629924]" size={48} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col items-center">
                {selectedGame ? (
                    <>
                        <div className="w-full flex justify-between items-center mb-4">
                            <div className="flex flex-col text-start">
                                <span className="text-sm text-theme-dim">{t('spectating')}</span>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-theme-bright">
                                    {selectedGame.players.white?.username || 'Guest'} <span className="text-theme-dim text-sm">vs</span> {selectedGame.players.black?.username || 'Guest'}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 bg-theme-active px-3 py-1 rounded border border-theme">
                                <Users size={14} className="text-theme-dim" />
                                <span className="text-sm font-bold text-theme-bright">1,203</span>
                            </div>
                        </div>
                        <div className="w-full max-w-[600px] shadow-2xl rounded-lg overflow-hidden border border-theme">
                            <ChessBoard position={selectedGame.fen} draggable={false} />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 bg-theme-alt rounded border border-theme w-full max-w-[600px] text-center">
                        <Eye size={48} className="text-theme-dim mb-4" />
                        <h3 className="text-xl font-bold text-theme-bright">{t('noLiveGames')}</h3>
                        <p className="text-sm text-theme-dim">{t('waitPlayers')}</p>
                    </div>
                )}
            </div>

            <div className="lg:w-[400px] flex flex-col gap-4">
                <div className="glass-card flex flex-col h-[600px]">
                    <div className="p-4 border-b border-theme flex items-center gap-2">
                        <Search size={18} className="text-theme-dim" />
                        <input
                            type="text"
                            placeholder={t('searchGames')}
                            className="bg-transparent border-none outline-none text-sm w-full text-theme-main"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {games.length === 0 ? (
                            <div className="text-center py-10 text-theme-dim text-sm italic">No games found.</div>
                        ) : (
                            games.map((g) => (
                                <div
                                    key={g.room}
                                    onClick={() => setSelectedGame(g)}
                                    className={`p-3 rounded cursor-pointer transition-colors text-start ${selectedGame?.room === g.room ? 'bg-theme-active ring-1 ring-[#629924]' : 'hover:bg-theme-alt'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-theme-dim uppercase tracking-widest">{g.room}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                            <span className="text-[10px] text-red-500 font-bold tracking-tighter">LIVE</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-sm text-theme-bright">
                                        <span>{g.players.white?.username || 'Guest'}</span>
                                        <span className="text-theme-dim font-normal text-xs mx-2">vs</span>
                                        <span>{g.players.black?.username || 'Guest'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-theme text-xs text-theme-dim text-center leading-relaxed">
                        {lang === 'fa'
                            ? "پخش زنده بازی‌های کلاسیک و مسابقات سریع با ریتینگ بالا."
                            : "Streaming high-rated classical and rapid games."}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Watch;
