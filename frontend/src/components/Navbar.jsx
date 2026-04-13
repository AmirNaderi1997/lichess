import React from 'react';
import { Menu, Search, Settings, User, Play as PlayIcon, Puzzle as PuzzleIcon, Eye, Users, Wrench, LogOut } from 'lucide-react';

const Navbar = ({ onNavigate, onSettings, onAuth, user, onLogout, lang, t, onChangeLang }) => {
    return (
        <nav className="bg-theme-card border-b border-theme h-12 flex items-center px-4 justify-between sticky top-0 z-50">
            <div className="flex items-center gap-6">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => onNavigate('home')}
                >
                    <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center transition-transform group-hover:scale-110">
                        <div className="w-6 h-6 bg-black rounded-full"></div>
                    </div>
                    <span className="text-theme-bright font-bold text-xl tracking-tight hidden sm:block">lichess.ir</span>
                </div>

                <div className="hidden lg:flex items-center gap-1">
                    <DropdownMenu
                        label={t('play')}
                        icon={<PlayIcon size={14} />}
                        items={[{ label: t('createGame'), id: 'home' }, { label: 'Tournaments', id: 'home' }]}
                        onSelect={(id) => onNavigate(id)}
                    />
                    <span className="nav-link flex items-center gap-2" onClick={() => onNavigate('puzzles')}>
                        <PuzzleIcon size={14} /> {t('puzzles')}
                    </span>
                    <span className="nav-link flex items-center gap-2" onClick={() => onNavigate('watch')}>
                        <Eye size={14} /> {t('watch')}
                    </span>
                    <span className="nav-link flex items-center gap-2" onClick={() => onNavigate('community')}>
                        <Users size={14} /> {t('community')}
                    </span>
                    <span className="nav-link flex items-center gap-2" onClick={() => onNavigate('tools')}>
                        <Wrench size={14} /> {t('tools')}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                    <input
                        id="search-input"
                        name="search"
                        type="text"
                        placeholder={t('search')}
                        className="bg-theme-alt border border-theme text-theme-main rounded px-8 py-1 text-sm focus:outline-none focus:border-[#629924] w-40 focus:w-60 transition-all font-sans"
                    />
                    <Search className={`absolute ${lang === 'fa' ? 'right-2' : 'left-2'} top-1.5 text-gray-500`} size={16} />
                </div>

                <button
                    onClick={() => onSettings()}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded text-gray-400 hover:text-theme-bright transition-colors"
                    title={t('settings')}
                >
                    <Settings size={20} />
                </button>

                <button
                    onClick={() => onChangeLang(lang === 'fa' ? 'en' : 'fa')}
                    className="px-2 py-1 text-[10px] font-bold border border-theme rounded hover:bg-[#629924] hover:text-white transition-colors text-theme-dim"
                    title="Toggle Persian / English"
                >
                    {lang === 'fa' ? 'EN' : 'FA'}
                </button>

                {user ? (
                    <div className="flex items-center gap-3 ml-2">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-xs font-bold text-theme-bright leading-none">{user.username}</span>
                            <span className="text-[10px] text-[#629924] font-medium">{user.rating} {t('rating')}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title={t('signOut')}
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onAuth}
                        className="chess-button chess-button-primary py-1 px-4 text-sm whitespace-nowrap ml-2"
                    >
                        {t('signIn')}
                    </button>
                )}
            </div>
        </nav>
    );
};

const DropdownMenu = ({ label, icon, items, onSelect }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <span className="nav-link flex items-center gap-2">
                {icon} {label}
            </span>
            {open && (
                <div className="absolute top-full left-0 w-48 py-2 bg-theme-card border border-theme rounded shadow-xl mt-[-2px]">
                    {items.map(item => (
                        <div
                            key={item.label}
                            onClick={() => onSelect(item.id)}
                            className="px-4 py-2 hover:bg-[#629924] hover:text-white cursor-pointer text-sm"
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Navbar;
