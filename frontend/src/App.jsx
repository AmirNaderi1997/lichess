import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Puzzles from './pages/Puzzles';
import Watch from './pages/Watch';
import Community from './pages/Community';
import AnalysisBoard from './pages/AnalysisBoard';
import ChessGameUI from './components/ChessGameUI';
import AuthModal from './components/AuthModal';
import { Play, Settings, User, Bot, UserPlus, X, Plus, Volume2, VolumeX, Sun, Moon, Sparkles, LogOut } from 'lucide-react';
import { getTranslation } from './utils/i18n';
import API_URL from './config';
import { io } from 'socket.io-client';

const socket = io(API_URL);

function App() {
  const [view, setView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' | 'fa'
  const [game, setGame] = useState(new Chess());
  const [room, setRoom] = useState('');
  const [username] = useState(`Guest_${Math.floor(Math.random() * 1000)}`);
  const [playerColor, setPlayerColor] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState({ online_players: 0, active_games: 0 });

  // Modals state
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [friendLinkCode, setFriendLinkCode] = useState('');
  const [joinLinkCode, setJoinLinkCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [boardTheme, setBoardTheme] = useState('green');

  // Sync RTL and Dark Mode with document
  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [language, darkMode]);

  // Global socket events for lobby stats and challenges
  useEffect(() => {
    socket.on('lobby_update', (data) => setChallenges(data));
    socket.on('stats_update', (data) => setStats(data));

    // Initial fetch
    socket.emit('get_lobby');

    return () => {
      socket.off('lobby_update');
      socket.off('stats_update');
    };
  }, []);

  const handleCreateGame = (tc, color) => {
    const newRoom = `room_${Math.random().toString(36).substr(2, 9)}`;
    setRoom(newRoom);
    setPlayerColor(color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color);
    setView('game');
    setShowCreateGame(false);
  };

  const handleQuickPair = (tc) => {
    setIsSearching(true);
    setTimeout(() => {
      const pairingRoom = `pair_${tc}_${Math.random().toString(36).substr(2, 5)}`;
      setRoom(pairingRoom);
      setPlayerColor(Math.random() > 0.5 ? 'white' : 'black');
      setView('game');
      setIsSearching(false);
    }, 2000);
  };

  const renderContent = () => {
    const t = (key) => getTranslation(language, key);

    switch (view) {
      case 'home':
        return (
          <Home
            challenges={challenges}
            stats={stats}
            onCreateGame={() => setShowCreateGame(true)}
            onPlayFriend={() => setShowFriendModal(true)}
            onPlayAI={() => setShowAIModal(true)}
            onQuickPair={handleQuickPair}
            onJoinChallenge={(roomID, color) => {
              setRoom(roomID);
              setPlayerColor(color || 'white');
              setView('game');
            }}
            t={t}
            lang={language}
          />
        );
      case 'puzzles':
        return <Puzzles t={t} lang={language} />;
      case 'watch':
        return <Watch t={t} lang={language} />;
      case 'tools':
        return <AnalysisBoard t={t} lang={language} />;
      case 'community':
        return <Community t={t} lang={language} />;
      case 'game':
        return (
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
              <ChessGameUI
                room={room}
                username={currentUser?.username || username}
                playerColor={playerColor}
                onBack={() => setView('home')}
                t={t}
                lang={language}
              />
            </div>
          </div>
        );
      default:
        return <Home t={t} lang={language} challenges={challenges} stats={stats} />;
    }
  };

  return (
    <div className={`min-h-screen bg-theme-bg text-theme-main transition-colors duration-300 font-sans ${language === 'fa' ? 'font-vazir' : ''}`}>
      <Navbar
        onNavigate={setView}
        onSettings={() => setShowSettings(true)}
        onAuth={() => setShowAuth(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
        lang={language}
        t={(key) => getTranslation(language, key)}
        onChangeLang={(l) => setLanguage(l)}
      />
      {renderContent()}

      {/* Quick Pairing Overlay */}
      {isSearching && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-8 max-w-sm text-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#629924]/20 animate-ping absolute inset-0"></div>
              <div className="w-32 h-32 rounded-full border-4 border-t-[#629924] border-r-[#629924]/40 border-b-[#629924]/10 border-l-[#629924]/60 animate-spin relative bg-[#262421] shadow-2xl flex items-center justify-center">
                <Sparkles className="text-[#629924] animate-pulse" size={40} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Finding Opponent</h2>
              <p className="text-gray-400 font-medium">Sit tight, we're matching you with a worthy challenger...</p>
            </div>
            <button
              onClick={() => setIsSearching(false)}
              className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-bold hover:bg-red-500/30 transition-all active:scale-95"
            >
              Cancel Search
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateGame && (
        <ModalOverlay onClose={() => setShowCreateGame(false)} title="Create Game" icon={<Plus size={20} />}>
          <GameOptionsForm
            onSubmit={handleCreateGame}
            submitLabel="Create Game"
            t={(key) => getTranslation(language, key)}
          />
        </ModalOverlay>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <ModalOverlay onClose={() => setShowSettings(false)} title="Settings" icon={<Settings size={20} />}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-theme-main">
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span className="text-sm font-medium">Sound Effects</span>
              </div>
              <ToggleSwitch enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-theme-main">
                {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                <span className="text-sm font-medium">Night Mode</span>
              </div>
              <ToggleSwitch enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            </div>

            <div className="flex items-center justify-between py-2 border-y border-theme/30">
              <div className="flex items-center gap-3 text-theme-main font-bold">Language / زبان</div>
              <div className="flex gap-1">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs rounded ${language === 'en' ? 'bg-[#629924] text-white' : 'bg-theme-active'}`}>EN</button>
                <button onClick={() => setLanguage('fa')} className={`px-3 py-1 text-xs rounded ${language === 'fa' ? 'bg-[#629924] text-white' : 'bg-theme-active'}`}>فارسی</button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2 text-theme-main text-start">Board Theme</label>
              <div className="flex gap-2">
                {['green', 'brown', 'blue', 'purple'].map(theme => (
                  <button
                    key={theme}
                    onClick={() => setBoardTheme(theme)}
                    className={`w-10 h-10 rounded-lg border-2 transition-transform ${boardTheme === theme ? 'border-[#629924] scale-110' : 'border-transparent'}`}
                    style={{
                      background: theme === 'green' ? 'linear-gradient(135deg, #ebecd0 50%, #779556 50%)' :
                        theme === 'brown' ? 'linear-gradient(135deg, #f0d9b5 50%, #b58863 50%)' :
                          theme === 'blue' ? 'linear-gradient(135deg, #dee3e6 50%, #8ca2ad 50%)' :
                            'linear-gradient(135deg, #e8dff5 50%, #9b72cb 50%)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuth(false);
          }}
        />
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose, title, icon }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-theme bg-theme-alt">
          <h2 className="text-lg font-bold flex items-center gap-2 text-theme-bright">{icon}{title}</h2>
          <button onClick={onClose} className="text-theme-dim hover:text-theme-bright"><X size={20} /></button>
        </div>
        <div className="p-4 bg-theme-card">{children}</div>
      </div>
    </div>
  );
}

function GameOptionsForm({ onSubmit, submitLabel }) {
  const [tc, setTc] = useState('10+0');
  const [color, setColor] = useState('random');
  const presets = ['1+0', '3+0', '3+2', '5+0', '5+3', '10+0', '15+10', '30+0'];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1">
        {presets.map(p => (
          <button key={p} onClick={() => setTc(p)} className={`py-2 text-xs font-bold rounded ${tc === p ? 'bg-[#629924] text-white' : 'bg-theme-active text-theme-main'}`}>{p}</button>
        ))}
      </div>
      <div className="flex gap-2">
        {['white', 'random', 'black'].map(c => (
          <button key={c} onClick={() => setColor(c)} className={`flex-1 py-2 text-xs font-bold rounded capitalize ${color === c ? 'bg-[#629924] text-white' : 'bg-theme-active text-theme-main'}`}>{c}</button>
        ))}
      </div>
      <button onClick={() => onSubmit(tc, color)} className="chess-button chess-button-primary w-full py-3">{submitLabel}</button>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button onClick={onToggle} className={`w-11 h-6 rounded-full relative transition-colors ${enabled ? 'bg-[#629924]' : 'bg-theme-active'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default App;
