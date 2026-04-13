import React, { useState } from 'react';
import { Bot, UserPlus, Plus } from 'lucide-react';

const timeControls = [
    { label: '1+0', type: 'Bullet' },
    { label: '2+1', type: 'Bullet' },
    { label: '3+0', type: 'Blitz' },
    { label: '3+2', type: 'Blitz' },
    { label: '5+0', type: 'Blitz' },
    { label: '5+3', type: 'Blitz' },
    { label: '10+0', type: 'Rapid' },
    { label: '10+5', type: 'Rapid' },
    { label: '15+10', type: 'Rapid' },
    { label: '30+0', type: 'Classical' },
    { label: '30+20', type: 'Classical' },
    { label: 'Custom', type: 'Board' },
];

const QuickPairing = ({ onSelect, onCreateGame, onPlayFriend, onPlayAI, t }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1">
                {timeControls.map((tc) => (
                    <button
                        key={tc.label}
                        onClick={() => onSelect(tc.label)}
                        className="flex flex-col items-center justify-center p-3 hover:bg-white/5 transition-colors border border-[#3c3a37] group"
                    >
                        <span className="text-xl font-bold text-white group-hover:text-[#629924]">{tc.label}</span>
                        <span className="text-[10px] uppercase text-gray-500">{tc.type}</span>
                    </button>
                ))}
            </div>
            <div className="flex justify-between gap-1">
                <button
                    onClick={onCreateGame}
                    className="flex-1 bg-[#3c3a37] py-2 text-sm font-bold hover:bg-[#4d4b48] transition-colors flex items-center justify-center gap-2 rounded"
                >
                    <Plus size={14} /> {t('createGame')}
                </button>
                <button
                    onClick={onPlayFriend}
                    className="flex-1 bg-[#3c3a37] py-2 text-sm font-bold hover:bg-[#4d4b48] transition-colors flex items-center justify-center gap-2 rounded"
                >
                    <UserPlus size={14} /> {t('playFriend')}
                </button>
                <button
                    onClick={onPlayAI}
                    className="flex-1 bg-[#3c3a37] py-2 text-sm font-bold hover:bg-[#4d4b48] transition-colors flex items-center justify-center gap-2 rounded"
                >
                    <Bot size={14} /> {t('playMachine')}
                </button>
            </div>
        </div>
    );
};

export default QuickPairing;
