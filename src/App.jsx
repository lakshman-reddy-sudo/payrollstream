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

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function NavBar({ user, walletAddress, onConnect, onDisconnect, onLogout }) {
  const location = useLocation();
  const path = location.pathname;
  if (!user) return null;

  const links = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/create', label: user.role === 'employee' ? 'Submit Work' : 'Create Payroll' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/public', label: 'Public' },
  ];

  return (
    <nav className="navbar">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>stream</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>PayrollStream</span>
        </Link>

        {/* Center Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${path === l.to ? 'nav-link-active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {walletAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)', fontSize: '0.8125rem',
              }}>
                <span className="live-dot" style={{ width: 6, height: 6 }}></span>
                <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{shortAddress(walletAddress)}</span>
              </div>
              <button onClick={onDisconnect} className="btn-ghost" style={{ padding: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          ) : (
            <button onClick={onConnect} className="btn-outline btn-sm" style={{ borderRadius: 'var(--radius-full)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>account_balance_wallet</span>
              Connect Wallet
            </button>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-full)',
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>{user.name}</span>
            <span className="badge-accent" style={{ padding: '2px 8px', fontSize: '0.6875rem' }}>{user.role === 'admin' ? 'Admin' : 'Employee'}</span>
          </div>
          <button onClick={onLogout} className="btn-ghost" style={{ padding: 6 }} title="Logout">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          </button>
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

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { logoutUser(); setUser(null); setWalletAddress(''); };
  const handleConnect = async () => {
    try {
      const accounts = await connectWallet();
      if (accounts.length > 0) { setWalletAddress(accounts[0]); updateUserWallet(accounts[0]); }
    } catch { }
  };
  const handleDisconnect = async () => {
    try { await disconnectWallet(); } catch { }
    setWalletAddress(''); updateUserWallet('');
  };

  return (
    <Router>
      <NavBar user={user} walletAddress={walletAddress} onConnect={handleConnect} onDisconnect={handleDisconnect} onLogout={handleLogout} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} onWalletConnect={(a) => setWalletAddress(a)} />} />
        <Route path="/" element={user ? <Landing user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard user={user} walletAddress={walletAddress} /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute user={user}><CreateGrant user={user} walletAddress={walletAddress} /></ProtectedRoute>} />
        <Route path="/grant/:id" element={<ProtectedRoute user={user}><GrantDetail user={user} walletAddress={walletAddress} /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute user={user}><Analytics user={user} /></ProtectedRoute>} />
        <Route path="/public" element={<PublicView />} />
      </Routes>
    </Router>
  );
}

export default App;
