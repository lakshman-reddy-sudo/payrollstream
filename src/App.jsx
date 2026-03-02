import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { connectWallet, disconnectWallet, reconnectWallet } from './utils/wallet';
import { shortAddress } from './utils/algorand';
import { getCurrentUser, logoutUser, updateUserWallet } from './utils/store';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateGrant from './pages/CreateGrant';
import GrantDetail from './pages/GrantDetail';
import Analytics from './pages/Analytics';
import PublicView from './pages/PublicView';

const ROLE_CONFIG = {
  sponsor: { icon: 'paid', label: 'Sponsor', color: 'purple' },
  admin: { icon: 'shield_person', label: 'Admin', color: 'blue' },
  team: { icon: 'groups', label: 'Team', color: 'green' },
};

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function NavBar({ user, walletAddress, onConnect, onDisconnect, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const roleInfo = ROLE_CONFIG[user?.role] || {};

  if (!user) return null;

  const roleBg = { sponsor: 'from-purple-500 to-purple-700', admin: 'from-blue-500 to-blue-700', team: 'from-green-500 to-green-700' };
  const roleTextColor = { sponsor: 'text-purple-300', admin: 'text-blue-300', team: 'text-green-300' };
  const roleBadgeBg = { sponsor: 'bg-purple-500/20 border-purple-500/30 text-purple-300', admin: 'bg-blue-500/20 border-blue-500/30 text-blue-300', team: 'bg-green-500/20 border-green-500/30 text-green-300' };

  return (
    <nav className="sticky top-0 z-50 nav-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-xl">token</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white bg-clip-text">GrantChain</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-baseline space-x-1">
            {[
              { path: '/', label: 'Home', icon: 'home' },
              { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
              { path: '/analytics', label: 'Analytics', icon: 'bar_chart' },
              { path: '/public', label: 'Public', icon: 'public' },
            ].map(link => (
              <Link key={link.path} to={link.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all no-underline ${isActive(link.path)
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {(user.role === 'sponsor' || user.role === 'admin') && (
              <Link to="/create"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all no-underline ${isActive('/create')
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Create Grant
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${roleBadgeBg[user.role] || ''}`}>
              <span className="material-symbols-outlined text-[16px]">{roleInfo.icon}</span>
              <span className="text-xs font-semibold">{user.name}</span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10`}>{roleInfo.label}</span>
            </div>

            {/* Wallet */}
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-gray-300 font-mono text-xs">{shortAddress(walletAddress)}</span>
                </div>
                <button onClick={onDisconnect} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <button onClick={onConnect}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                Connect
              </button>
            )}

            {/* Logout */}
            <button onClick={onLogout}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Logout">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(getCurrentUser);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    reconnectWallet((accounts) => {
      const addr = accounts.length > 0 ? accounts[0] : '';
      setWalletAddress(addr);
      if (addr) updateUserWallet(addr);
    });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setWalletAddress('');
  };

  const handleConnect = async () => {
    try {
      const accounts = await connectWallet();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        updateUserWallet(accounts[0]);
      }
    } catch (err) {
      console.log('Connection cancelled or failed');
    }
  };

  const handleDisconnect = async () => {
    try { await disconnectWallet(); } catch { }
    setWalletAddress('');
    updateUserWallet('');
  };

  return (
    <Router>
      <div className="gradient-bg"></div>
      <NavBar
        user={user}
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} onWalletConnect={(addr) => { setWalletAddress(addr); }} />
        } />
        <Route path="/" element={
          user ? <Landing user={user} walletAddress={walletAddress} onConnect={handleConnect} />
            : <Navigate to="/login" replace />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} walletAddress={walletAddress} />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute user={user}>
            <CreateGrant user={user} walletAddress={walletAddress} />
          </ProtectedRoute>
        } />
        <Route path="/grant/:id" element={
          <ProtectedRoute user={user}>
            <GrantDetail user={user} walletAddress={walletAddress} />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute user={user}>
            <Analytics user={user} />
          </ProtectedRoute>
        } />
        <Route path="/public" element={<PublicView />} />
      </Routes>
    </Router>
  );
}

export default App;
