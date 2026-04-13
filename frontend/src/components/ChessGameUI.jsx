import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { io } from 'socket.io-client';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../utils/SoundManager';
import { User, Clock, ChevronLeft, Flag, Handshake, MoreVertical, MessageSquare, Shield, Trophy } from 'lucide-react';

import API_URL from '../config';

const socket = io(API_URL);

const ChessGameUI = ({ room, username, playerColor, onBack, t, lang }) => {
    const [game, setGame] = useState(new Chess());
    const [players, setPlayers] = useState({ white: null, black: null });
    const [timers, setTimers] = useState({ white: 600, black: 600 });
    const [gameOver, setGameOver] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!room) return;

        socket.emit('join_room', { room, username, color: playerColor });

        socket.on('game_state', (state) => {
            const newGame = new Chess(state.fen);
            setGame(newGame);
            setPlayers(state.players);
            setTimers(state.timers);
            setMoveHistory(newGame.history());

            if (newGame.isGameOver()) {
                let result = 'Draw';
                if (newGame.isCheckmate()) result = newGame.turn() === 'w' ? 'Black Wins' : 'White Wins';
                setGameOver(result);
            }
        });

        socket.on('move_made', (data) => {
            const newGame = new Chess(data.fen);
            setGame(newGame);
            setTimers(data.timers);
            setMoveHistory(newGame.history());

            if (data.is_checkmate) {
                setGameOver(data.turn === 'w' ? 'Black Wins' : 'White Wins');
                playGameOverSound();
            } else if (data.is_check) {
                playCheckSound();
            } else if (data.captured) {
                playCaptureSound();
            } else {
                playMoveSound();
            }
        });

        socket.on('chat_message', (msg) => {
            setChat(prev => [...prev, msg]);
        });

        socket.on('game_over', (data) => {
            setGameOver(data.result);
            playGameOverSound();
        });

        return () => {
            socket.off('game_state');
            socket.off('move_made');
            socket.off('chat_message');
            socket.off('game_over');
        };
    }, [room, username, playerColor]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    const onDrop = (sourceSquare, targetSquare) => {
        if (gameOver) return false;
        if (game.turn() !== playerColor[0]) return false;

        const move = {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q', // always promote to queen for simplicity
        };

        try {
            const moveResult = game.move(move);
            if (moveResult) {
                socket.emit('make_move', { room, move: sourceSquare + targetSquare });
                setGame(new Chess(game.fen()));
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            socket.emit('send_chat', { room, username, message });
            setMessage('');
        }
    };

    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    const opponent = players[opponentColor];
    const self = players[playerColor];

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            {/* Left: Main Board Area */}
            <div className="flex-1 flex flex-col items-center">
                {/* Opponent Info */}
                <div className="w-full max-w-[600px] flex items-center justify-between mb-4 bg-theme-alt p-3 rounded-xl border border-theme shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${opponentColor === 'white' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                            <User size={20} className={opponentColor === 'white' ? 'text-gray-800' : 'text-gray-200'} />
                        </div>
                        <div>
                            <div className="font-bold text-theme-bright">{opponent?.username || 'Opponent'}</div>
                            <div className="text-[10px] text-theme-dim uppercase font-bold tracking-widest flex items-center gap-1">
                                <Shield size={10} /> {opponent?.rating || 1500}
                            </div>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold border-2 transition-colors ${game.turn() === opponentColor[0] ? 'bg-[#629924]/20 border-[#629924] text-[#629924]' : 'bg-theme-active border-transparent text-theme-dim'}`}>
                        {formatTime(timers[opponentColor])}
                    </div>
                </div>

                {/* Chessboard */}
                <div className="w-full max-w-[600px] aspect-square relative shadow-2xl rounded-lg overflow-hidden border-4 border-theme-active">
                    <Chessboard
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        boardOrientation={playerColor}
                    />
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in zoom-in duration-300">
                            <div className="glass-card p-8 text-center space-y-4 max-w-xs border-[#629924]/50 border-2">
                                <Trophy className="mx-auto text-[#629924]" size={64} />
                                <h3 className="text-3xl font-black text-white italic">{gameOver}</h3>
                                <div className="text-theme-dim text-sm font-medium">Game ended by checkmate or agreement.</div>
                                <button onClick={onBack} className="chess-button chess-button-primary w-full py-3">
                                    {lang === 'fa' ? 'بازگشت به لابی' : 'Return to Lobby'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Self Info */}
                <div className="w-full max-w-[600px] flex items-center justify-between mt-4 bg-theme-alt p-3 rounded-xl border border-theme shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${playerColor === 'white' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                            <User size={20} className={playerColor === 'white' ? 'text-gray-800' : 'text-gray-200'} />
                        </div>
                        <div>
                            <div className="font-bold text-theme-bright">{self?.username || username} (You)</div>
                            <div className="text-[10px] text-theme-dim uppercase font-bold tracking-widest flex items-center gap-1">
                                <Shield size={10} /> {self?.rating || 1500}
                            </div>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold border-2 transition-colors ${game.turn() === playerColor[0] ? 'bg-[#629924]/20 border-[#629924] text-[#629924]' : 'bg-theme-active border-transparent text-theme-dim'}`}>
                        {formatTime(timers[playerColor])}
                    </div>
                </div>
            </div>

            {/* Right: Sidebar Sidebar (Moves & Chat) */}
            <div className="lg:w-[400px] flex flex-col gap-4">
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={onBack} className="bg-theme-alt hover:bg-theme-active py-3 rounded-lg border border-theme flex flex-col items-center gap-1 transition-all group">
                        <ChevronLeft size={18} className="text-theme-dim group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-bold uppercase text-theme-dim">{lang === 'fa' ? 'بازگشت' : 'Lobby'}</span>
                    </button>
                    <button className="bg-theme-alt hover:bg-theme-active py-3 rounded-lg border border-theme flex flex-col items-center gap-1 transition-all">
                        <Handshake size={18} className="text-[#3692e7]" />
                        <span className="text-[10px] font-bold uppercase text-theme-dim">{lang === 'fa' ? 'پیشنهاد تساوی' : 'Draw'}</span>
                    </button>
                    <button
                        onClick={() => socket.emit('resign', { room, username })}
                        className="bg-theme-alt hover:bg-red-500/10 py-3 rounded-lg border border-theme hover:border-red-500/30 flex flex-col items-center gap-1 transition-all"
                    >
                        <Flag size={18} className="text-red-500" />
                        <span className="text-[10px] font-bold uppercase text-theme-dim">{lang === 'fa' ? 'تسلیم' : 'Resign'}</span>
                    </button>
                </div>

                {/* Move History */}
                <div className="glass-card flex-1 flex flex-col overflow-hidden h-[300px]">
                    <div className="p-3 border-b border-theme bg-theme-alt flex justify-between items-center">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-theme-dim flex items-center gap-2">
                            <MoreVertical size={14} /> {lang === 'fa' ? 'تاریخچه حرکات' : 'Move History'}
                        </h4>
                        <span className="text-[10px] font-bold text-theme-dim">Moves: {moveHistory.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-theme-bg/50">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                                <React.Fragment key={i}>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-theme-dim text-xs w-4">{i + 1}.</span>
                                        <span className="font-bold text-theme-bright bg-theme-active px-2 py-1 rounded">{moveHistory[i * 2]}</span>
                                    </div>
                                    {moveHistory[i * 2 + 1] && (
                                        <div className="flex items-center gap-2 text-sm justify-end">
                                            <span className="font-bold text-theme-brief bg-[#3692e7]/10 text-[#3692e7] px-2 py-1 rounded border border-[#3692e7]/20">
                                                {moveHistory[i * 2 + 1]}
                                            </span>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="glass-card flex-1 flex flex-col overflow-hidden h-[300px]">
                    <div className="p-3 border-b border-theme bg-theme-alt flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-theme-dim flex items-center gap-2">
                            <MessageSquare size={14} /> {lang === 'fa' ? 'گفتگو' : 'Chat'}
                        </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-theme-bg/30">
                        {chat.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                                <div className={`text-[9px] font-bold mb-0.5 ${msg.username === username ? 'text-[#629924]' : 'text-[#3692e7]'}`}>
                                    {msg.username}
                                </div>
                                <div className={`px-3 py-1.5 rounded-2xl text-sm max-w-[80%] ${msg.username === username ? 'bg-[#629924] text-white rounded-tr-none' : 'bg-theme-active text-theme-main rounded-tl-none'}`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendMessage} className="p-3 bg-theme-alt border-t border-theme flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={lang === 'fa' ? 'پیام بنویسید...' : 'Type a message...'}
                            className="flex-1 bg-theme-bg border border-theme rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#629924]"
                        />
                        <button type="submit" className="p-2 bg-[#629924] text-white rounded-full hover:bg-[#82b34a] transition-all">
                            <ChevronLeft size={18} className={lang === 'fa' ? '' : 'rotate-180'} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChessGameUI;
