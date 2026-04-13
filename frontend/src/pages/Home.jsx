import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import QuickPairing from '../components/QuickPairing';
import Lobby from '../components/Lobby';
import { Trophy, Swords, Zap, Puzzle as PuzzleIcon, Users, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import { playMoveSound } from '../utils/SoundManager';

import API_URL from '../config';

const socket = io(API_URL);

const Home = ({ challenges, stats, onQuickPair, onJoinChallenge, onCreateGame, onPlayFriend, onPlayAI, t, lang }) => {
    const [activeTab, setActiveTab] = useState('quick');
    const [dailyPuzzle, setDailyPuzzle] = useState(null);
    const [puzzleStatus, setPuzzleStatus] = useState(null); // 'correct' | 'wrong' | null
    const [showHint, setShowHint] = useState(false);

    // Fetch today's puzzle on mount
    useEffect(() => {
        socket.emit('get_daily_puzzle_event');
        socket.on('daily_puzzle', (data) => {
            setDailyPuzzle(data);
            setPuzzleStatus(null);
            setShowHint(false);
        });
        socket.on('puzzle_result', (data) => {
            setPuzzleStatus(data.success ? 'correct' : 'wrong');
        });
        return () => {
            socket.off('daily_puzzle');
            socket.off('puzzle_result');
        };
    }, []);

    const handlePuzzleMove = (sourceSquare, targetSquare) => {
        if (!dailyPuzzle || puzzleStatus === 'correct') return false;
        const moveUci = sourceSquare + targetSquare;
        socket.emit('validate_puzzle_move', { puzzle_id: dailyPuzzle.id, move: moveUci });

        playMoveSound(true);
        setPuzzleStatus(null);
        return true;
    };

    return (
        <div className="lichess-grid">
            {/* Left Sidebar */}
            <aside className="sidebar-left space-y-6">
                <div className="glass-card p-4">
                    <h3 className="text-sm font-bold text-theme-dim mb-3 uppercase flex items-center gap-2">
                        <Trophy size={14} /> Top Tournaments
                    </h3>
                    <div className="space-y-3">
                        <div className="text-sm hover:text-theme-bright cursor-pointer">
                            <div className="font-bold">Daily SuperBlitz</div>
                            <div className="text-xs text-theme-dim">Starts in 12m • 432 players</div>
                        </div>
                        <div className="text-sm hover:text-theme-bright cursor-pointer">
                            <div className="font-bold">Rapid Arena</div>
                            <div className="text-xs text-theme-dim">Ongoing • 1,203 players</div>
                        </div>
                    </div>
                </div>

                {/* Puzzle of the Day */}
                <div className="glass-card p-4">
                    <h3 className="text-sm font-bold text-theme-dim mb-3 uppercase flex items-center gap-2">
                        <PuzzleIcon size={14} /> {t('puzzleOfDay')}
                    </h3>
                    {dailyPuzzle ? (
                        <>
                            <div className="aspect-square rounded overflow-hidden mb-2 shadow-inner">
                                <Chessboard
                                    options={{
                                        position: dailyPuzzle.fen,
                                        onPieceDrop: ({ sourceSquare, targetSquare }) => handlePuzzleMove(sourceSquare, targetSquare),
                                        boardOrientation: dailyPuzzle.turn === 'black' ? 'black' : 'white',
                                        allowDragging: puzzleStatus !== 'correct',
                                        darkSquareStyle: { backgroundColor: '#779556' },
                                        lightSquareStyle: { backgroundColor: '#ebecd0' },
                                        animationDurationInMs: 300,
                                    }}
                                />
                            </div>
                            <div className="text-xs text-center font-bold text-theme-bright mb-1">
                                {lang === 'fa' ? (dailyPuzzle.title_fa || dailyPuzzle.title) : dailyPuzzle.title}
                            </div>
                            <div className="text-xs text-center text-theme-dim mb-2">
                                {lang === 'fa' ? (dailyPuzzle.description_fa || dailyPuzzle.description) : dailyPuzzle.description}
                            </div>

                            {showHint ? (
                                <div className="bg-[#629924]/10 border border-[#629924]/30 rounded p-2 mb-3 text-[11px] text-[#629924] italic">
                                    💡 {lang === 'fa' ? 'راهنمایی' : 'Hint'}: {lang === 'fa' ? (dailyPuzzle.hint_fa || dailyPuzzle.hint) : dailyPuzzle.hint}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="w-full py-1.5 mb-2 rounded bg-theme-alt border border-theme text-[10px] font-bold uppercase tracking-wider hover:bg-theme-active transition-colors"
                                >
                                    {t('showHint')}
                                </button>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-theme-dim">
                                    {lang === 'fa' ? (dailyPuzzle.theme_fa || dailyPuzzle.theme) : dailyPuzzle.theme} • {lang === 'fa' ? (dailyPuzzle.difficulty_fa || dailyPuzzle.difficulty) : dailyPuzzle.difficulty}
                                </span>
                                {puzzleStatus === 'correct' && <span className="text-green-500 font-bold">✓ Solved!</span>}
                                {puzzleStatus === 'wrong' && <span className="text-red-500 font-bold">✗ Try again</span>}
                            </div>
                        </>
                    ) : (
                        <div className="aspect-square bg-theme-alt rounded flex items-center justify-center text-theme-dim mb-2 animate-pulse">
                            Loading puzzle...
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Center Content */}
            <main className="space-y-6">
                <div className="glass-card overflow-hidden">
                    <div className="flex border-b border-theme">
                        <button
                            onClick={() => setActiveTab('quick')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'quick' ? 'bg-theme-active border-b-2 border-[#629924] text-theme-bright' : 'hover:bg-theme-alt text-theme-dim'}`}
                        >
                            <Zap size={16} className={activeTab === 'quick' ? 'text-[#629924]' : ''} /> {t('matchmaking')}
                        </button>
                        <button
                            onClick={() => setActiveTab('lobby')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'lobby' ? 'bg-theme-active border-b-2 border-[#629924] text-theme-bright' : 'hover:bg-theme-alt text-theme-dim'}`}
                        >
                            <LobbyIcon size={16} /> {t('lobby')}
                        </button>
                        <button
                            onClick={() => setActiveTab('correspondence')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'correspondence' ? 'bg-theme-active border-b-2 border-[#629924] text-theme-bright' : 'hover:bg-theme-alt text-theme-dim'}`}
                        >
                            <Clock size={16} /> {t('correspondence')}
                        </button>
                    </div>

                    <div className="p-4">
                        {activeTab === 'quick' && (
                            <QuickPairing
                                onSelect={onQuickPair}
                                onCreateGame={onCreateGame}
                                onPlayFriend={onPlayFriend}
                                onPlayAI={onPlayAI}
                                t={t}
                            />
                        )}
                        {activeTab === 'lobby' && (
                            <Lobby challenges={challenges} onJoin={onJoinChallenge} t={t} />
                        )}
                        {activeTab === 'correspondence' && (
                            <div className="text-center py-12 text-theme-dim">
                                <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-theme-bright mb-2">Correspondence Chess</h3>
                                <p className="text-sm max-w-md mx-auto">
                                    Play games with days per move. Perfect for thoughtful, analytical play.
                                </p>
                                <button
                                    onClick={onCreateGame}
                                    className="mt-4 chess-button chess-button-primary px-6 py-2"
                                >
                                    Create Correspondence Game
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {activeTab !== 'lobby' && (
                    <div className="glass-card">
                        <div className="p-4 border-b border-theme flex justify-between items-center">
                            <h2 className="font-bold flex items-center gap-2"><Users size={18} /> Lobby Challenges</h2>
                            <span className="text-xs text-theme-dim">{challenges.length} games</span>
                        </div>
                        <Lobby challenges={challenges} onJoin={onJoinChallenge} t={t} />
                    </div>
                )}
            </main>

            {/* Right Sidebar */}
            <aside className="sidebar-right space-y-6">
                <div className="glass-card p-4">
                    <h2 className="text-lg font-bold mb-4 text-theme-bright">Community</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-theme-dim">{(stats?.online_players || 0).toLocaleString()} players online</span>
                            <span className="text-green-500 font-bold">●</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-theme-dim">{(stats?.active_games || 0).toLocaleString()} games playing</span>
                            <span className="text-green-500 font-bold">●</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <h2 className="text-lg font-bold mb-4 text-theme-bright">Leaderboard</h2>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center text-sm p-1 rounded hover:bg-theme-alt transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="text-theme-dim w-4">{i}.</span>
                                    <span className="font-medium">Grandmaster_{i}</span>
                                </div>
                                <span className="font-bold text-theme-dim">{2850 - i * 10}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
};

const LobbyIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
);

export default Home;
