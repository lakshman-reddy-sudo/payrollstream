import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, updateUserWallet } from '../utils/store';
import { connectWallet } from '../utils/wallet';
import { shortAddress } from '../utils/algorand';

export default function Login({ onLogin, onWalletConnect }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [walletAddr, setWalletAddr] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');

    const roles = [
        { id: 'admin', icon: 'shield_person', label: 'Admin (Employer)', desc: 'Create payrolls, fund contracts, verify work, approve salary releases' },
        { id: 'employee', icon: 'badge', label: 'Employee', desc: 'View earned salary, submit milestones, request payouts' },
    ];

    const handleConnectWallet = async () => {
        setConnecting(true);
        try {
            const accounts = await connectWallet();
            if (accounts.length > 0) { setWalletAddr(accounts[0]); setError(''); }
        } catch (err) {
            if (err?.data?.type !== 'CONNECT_MODAL_CLOSED') setError('Wallet connection failed.');
        }
        setConnecting(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Please enter your name'); return; }
        if (!role) { setError('Please select a role'); return; }
        const u = loginUser({ name: name.trim(), role, walletAddress: walletAddr });
        if (walletAddr) { updateUserWallet(walletAddr); if (onWalletConnect) onWalletConnect(walletAddr); }
        onLogin(u);
        navigate('/dashboard');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{
                width: '100%', maxWidth: 480,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '2.5rem',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                animation: 'fadeUp 0.5s ease',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%', border: '1.5px solid var(--border-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 26 }}>stream</span>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>PayrollStream</h1>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>On-Chain Salary Verification · Algorand TestNet</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', marginBottom: '1.25rem', borderRadius: 'var(--radius-md)',
                            background: 'var(--error-bg)', border: '1px solid rgba(248,113,113,0.2)',
                            color: 'var(--error)', fontSize: '0.875rem',
                        }}>{error}</div>
                    )}

                    {/* Name */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8 }}>Your Name</label>
                        <input className="input" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="Enter your full name" autoFocus />
                    </div>

                    {/* Roles */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 10 }}>Select Role</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {roles.map(r => (
                                <div key={r.id} onClick={() => { setRole(r.id); setError(''); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                                        borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s',
                                        background: role === r.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
                                        border: role === r.id ? '1.5px solid var(--border-accent)' : '1.5px solid var(--border)',
                                    }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: '50%',
                                        background: role === r.id ? 'var(--accent-glow)' : 'rgba(255,255,255,0.04)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>{r.icon}</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 2 }}>{r.label}</h4>
                                        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{r.desc}</p>
                                    </div>
                                    {role === r.id && <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>check_circle</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Wallet */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8 }}>Connect Wallet (Optional)</label>
                        {walletAddr ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="live-dot" style={{ width: 6, height: 6 }}></span>
                                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>Connected</span>
                                    <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{shortAddress(walletAddr)}</span>
                                </div>
                                <button type="button" className="btn-ghost" style={{ padding: 4, fontSize: '0.75rem' }} onClick={() => setWalletAddr('')}>Change</button>
                            </div>
                        ) : (
                            <button type="button" className="btn-outline" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                                onClick={handleConnectWallet} disabled={connecting}>
                                {connecting ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Connecting…</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance_wallet</span> Connect Pera Wallet</>}
                            </button>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Transactions via Lora. Wallet is optional for display.</p>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px 0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                        Enter PayrollStream
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/public" style={{ color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        View Public Dashboard →
                    </Link>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
                        Powered by <strong style={{ color: 'var(--text-secondary)' }}>Algorand</strong> · TestNet
                    </p>
                </div>
            </div>
        </div>
    );
}
