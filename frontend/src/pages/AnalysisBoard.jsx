import React, { useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import { Info, BookOpen, Trash2, ChevronLeft, ChevronRight, Share2, Clipboard } from 'lucide-react';

const AnalysisBoard = ({ t, lang }) => {
    const [game, setGame] = useState(new Chess());

    const onDrop = (sourceSquare, targetSquare) => {
        const move = { from: sourceSquare, to: targetSquare, promotion: 'q' };
        try {
            const result = game.move(move);
            if (result) {
                setGame(new Chess(game.fen()));
                return true;
            }
        } catch (e) { return false; }
        return false;
    };

    const reset = () => setGame(new Chess());
    const undo = () => {
        game.undo();
        setGame(new Chess(game.fen()));
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-theme-bright">
                        <BookOpen size={20} className="text-[#3692e7]" /> {t('analysisBoard')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={reset}
                            className="p-2 hover:bg-theme-alt rounded text-red-500 transition-colors"
                            title={t('resetBoard')}
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            className="p-2 hover:bg-theme-alt rounded text-theme-dim hover:text-theme-bright transition-colors"
                            title={t('sharePosition')}
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="w-full max-w-[600px] shadow-2xl rounded-lg overflow-hidden border border-theme">
                    <ChessBoard position={game.fen()} onMove={onDrop} />
                </div>

                <div className="flex gap-1 w-full max-w-[600px] mt-2 bg-theme-alt p-1 rounded border border-theme">
                    <button
                        onClick={undo}
                        className="flex-1 py-3 hover:bg-theme-active flex justify-center text-theme-main transition-colors"
                    >
                        <ChevronLeft className={lang === 'fa' ? 'rotate-180' : ''} />
                    </button>
                    <button
                        className="flex-1 py-3 hover:bg-theme-active flex justify-center opacity-30 cursor-not-allowed"
                    >
                        <ChevronRight className={lang === 'fa' ? 'rotate-180' : ''} />
                    </button>
                </div>
            </div>

            <div className="lg:w-[400px] space-y-4">
                <div className="glass-card p-4 h-[400px] flex flex-col">
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-[#3692e7] text-start">
                        <Info size={18} /> {t('engineAnalysis')}
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4">
                        <div className="p-3 bg-theme-active rounded space-y-2 border border-theme">
                            <div className="flex justify-between items-center text-[10px] font-bold text-theme-dim uppercase tracking-widest">
                                <span>Stockfish 16.1</span>
                                <span className="text-[#629924]">+0.4</span>
                            </div>
                            <div className="text-sm font-mono text-theme-main leading-relaxed">
                                1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-theme-dim uppercase tracking-widest">FEN</h4>
                        <button
                            onClick={() => navigator.clipboard.writeText(game.fen())}
                            className="text-[10px] uppercase font-bold text-[#629924] hover:underline flex items-center gap-1"
                        >
                            <Clipboard size={10} /> {lang === 'fa' ? 'کپی' : 'Copy'}
                        </button>
                    </div>
                    <div className="bg-theme-bg p-3 rounded text-[10px] font-mono break-all text-theme-main border border-theme select-all cursor-copy">
                        {game.fen()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisBoard;
