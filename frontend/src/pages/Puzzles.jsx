import React, { useState, useEffect } from 'react';
import ChessBoard from '../components/ChessBoard';
import { Lightbulb, RotateCcw, ChevronRight, Trophy, RefreshCw, Star } from 'lucide-react';
import { io } from 'socket.io-client';
import { playMoveSound, playCaptureSound } from '../utils/SoundManager';

const socket = io('http://localhost:8000');

const Puzzles = ({ t, lang }) => {
    const [puzzle, setPuzzle] = useState(null);
    const [status, setStatus] = useState('solve'); // solve, success, fail
    const [loading, setLoading] = useState(true);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        socket.emit('get_puzzle');

        const handlePuzzleData = (data) => {
            setPuzzle(data);
            setStatus('solve');
            setShowHint(false);
            setLoading(false);
        };

        const handlePuzzleResult = ({ success }) => {
            if (success) {
                setStatus('success');
                playCaptureSound(true);
            } else {
                setStatus('fail');
            }
        };

        socket.on('puzzle_data', handlePuzzleData);
        socket.on('puzzle_result', handlePuzzleResult);

        return () => {
            socket.off('puzzle_data', handlePuzzleData);
            socket.off('puzzle_result', handlePuzzleResult);
        };
    }, []);

    const onMove = (from, to) => {
        if (status !== 'solve') return false;
        const move = `${from}${to}`;
        socket.emit('validate_puzzle_move', { puzzle_id: puzzle.id, move });
        playMoveSound(true);
        return true;
    };

    const nextPuzzle = () => {
        setLoading(true);
        socket.emit('get_puzzle');
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
                <RefreshCw className="animate-spin text-[#629924]" size={48} />
                <span className="text-theme-dim font-bold animate-pulse">
                    {lang === 'fa' ? 'در حال دریافت چالش بعدی...' : 'Fetching next challenge...'}
                </span>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-theme-bright">
                        <Lightbulb className="text-yellow-500" /> {lang === 'fa' ? (puzzle?.title_fa || puzzle?.title) : puzzle?.title}
                    </h2>
                    <div className="flex gap-2">
                        <span className="text-xs bg-[#629924]/20 px-3 py-1 rounded-full text-[#629924] capitalize font-bold">
                            {lang === 'fa' ? (puzzle?.difficulty_fa || puzzle?.difficulty) : puzzle?.difficulty}
                        </span>
                        <span className="text-xs bg-theme-active px-3 py-1 rounded-full text-theme-dim capitalize font-bold">
                            {puzzle?.turn === 'white' ? (lang === 'fa' ? 'نوبت سفید' : 'white to move') : (lang === 'fa' ? 'نوبت سیاه' : 'black to move')}
                        </span>
                    </div>
                </div>

                <div className="w-full max-w-[600px] shadow-2xl rounded-lg overflow-hidden border border-theme">
                    <ChessBoard
                        position={puzzle?.fen}
                        onMove={onMove}
                        orientation={puzzle?.turn}
                    />
                </div>
            </div>

            <div className="lg:w-[350px] space-y-4">
                <div className="glass-card p-6 text-center space-y-6">
                    {status === 'solve' && (
                        <div className="space-y-2">
                            <div className="w-16 h-16 bg-theme-alt rounded-full flex items-center justify-center mx-auto border-4 border-theme">
                                <Star className="text-yellow-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-theme-bright">{t('yourMove')}</h3>
                            <p className="text-sm text-theme-dim italic">
                                {lang === 'fa' ? `آیا می‌توانید ادامه بازی برای ${puzzle?.turn === 'white' ? 'سفید' : 'سیاه'} را پیدا کنید؟` : `Can you find the continuation for ${puzzle?.turn}?`}
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4 animate-in zoom-in duration-300">
                            <Trophy className="mx-auto text-[#629924]" size={64} />
                            <h3 className="text-2xl font-bold text-[#629924]">{t('puzzleResultSuccess')}</h3>
                            <p className="text-sm text-theme-bright">
                                {lang === 'fa' ? 'بسیار عالی! شما بهترین حرکت را پیدا کردید.' : 'Excellence is a habit, and you just proved it.'}
                            </p>
                        </div>
                    )}

                    {status === 'fail' && (
                        <div className="space-y-4 animate-in shake duration-300">
                            <h3 className="text-2xl font-bold text-red-500">{t('puzzleResultFail')}</h3>
                            <p className="text-sm text-theme-dim">
                                {lang === 'fa' ? 'این بهترین حرکت نبود. ناامید نشوید!' : "That's not the best move. Don't give up!"}
                            </p>
                            <button
                                onClick={() => setStatus('solve')}
                                className="chess-button chess-button-secondary w-full"
                            >
                                <RotateCcw size={18} /> {t('tryAgain')}
                            </button>
                        </div>
                    )}

                    {status !== 'success' && (
                        <div className="pt-2">
                            {showHint ? (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded text-sm text-yellow-600 dark:text-yellow-500 animate-in fade-in slide-in-from-top-1 text-start">
                                    <span className="font-bold flex items-center justify-center gap-1 mb-1 italic">
                                        <Lightbulb size={14} /> {lang === 'fa' ? 'راهنمایی' : 'Hint'}
                                    </span>
                                    {lang === 'fa' ? (puzzle?.hint_fa || puzzle?.hint) : puzzle?.hint}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="text-xs font-bold text-theme-dim hover:text-theme-bright flex items-center gap-1 mx-auto transition-colors"
                                >
                                    <Lightbulb size={12} /> {t('needHint')}
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        onClick={nextPuzzle}
                        className="chess-button chess-button-primary w-full py-4 text-lg mt-4 group"
                    >
                        {lang === 'fa' ? 'پازل بعدی' : 'Next Puzzle'}
                        <ChevronRight size={20} className={`group-hover:translate-x-1 transition-transform ${lang === 'fa' ? 'rotate-180' : ''}`} />
                    </button>

                    <div className="pt-4 border-t border-theme">
                        <p className="text-[10px] text-theme-dim uppercase font-bold tracking-widest">{lang === 'fa' ? 'تم' : 'Theme'}: {lang === 'fa' ? (puzzle?.theme_fa || puzzle?.theme) : puzzle?.theme}</p>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h4 className="font-bold text-xs text-theme-dim uppercase mb-4 text-center tracking-widest">{t('puzzleStats')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-theme-alt p-3 rounded text-center">
                            <div className="text-lg font-bold text-theme-bright">2,143</div>
                            <div className="text-[9px] text-theme-dim uppercase font-bold">{t('rating')}</div>
                        </div>
                        <div className="bg-theme-alt p-3 rounded text-center">
                            <div className="text-lg font-bold text-[#629924]">85%</div>
                            <div className="text-[9px] text-theme-dim uppercase font-bold">{t('percentile')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Puzzles;
