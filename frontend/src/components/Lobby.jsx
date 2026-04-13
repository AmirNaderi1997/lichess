import React from 'react';
import { User, Clock } from 'lucide-react';

const Lobby = ({ challenges, onJoin, t }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full lobby-table">
                <thead>
                    <tr>
                        <th>{t('player') || 'Player'}</th>
                        <th>{t('rating') || 'Rating'}</th>
                        <th>{t('time') || 'Time'}</th>
                        <th>{t('mode') || 'Mode'}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {challenges.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="text-center py-8 text-gray-500">
                                {t('noChallenges') || 'No open challenges. Create one!'}
                            </td>
                        </tr>
                    ) : (
                        challenges.map((c) => (
                            <tr key={c.id} className="hover:bg-white/5 cursor-pointer group" onClick={() => onJoin(c)}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-gray-500" />
                                        <span>{c.username}</span>
                                    </div>
                                </td>
                                <td className="text-gray-500">?</td>
                                <td>
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} className="text-gray-500" />
                                        <span>{c.time_control}</span>
                                    </div>
                                </td>
                                <td className="text-gray-500">Rated</td>
                                <td className="text-right">
                                    <button className="opacity-0 group-hover:opacity-100 chess-button-primary bg-[#629924] px-3 py-1 text-xs rounded">
                                        {t('join') || 'Join'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Lobby;
