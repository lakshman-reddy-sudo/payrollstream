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
        { id: 'sponsor', icon: 'paid', label: 'Sponsor', desc: 'Fund projects, approve milestone payments, track spending', color: 'purple' },
        { id: 'admin', icon: 'shield_person', label: 'Admin / Faculty', desc: 'Review milestones, approve/reject submissions, oversee grants', color: 'blue' },
        { id: 'team', icon: 'groups', label: 'Student Team', desc: 'Submit milestones, log expenses, receive funds', color: 'green' },
    ];

    const handleConnectWallet = async () => {
        setConnecting(true);
        try {
            const accounts = await connectWallet();
            if (accounts.length > 0) {
                setWalletAddr(accounts[0]);
                setError('');
            }
        } catch (err) {
            if (err?.data?.type !== 'CONNECT_MODAL_CLOSED') {
                setError('Wallet connection failed. Make sure Defly is set to TestNet.');
            }
        }
        setConnecting(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Please enter your name'); return; }
        if (!role) { setError('Please select a role'); return; }

        const user = loginUser({ name: name.trim(), role, walletAddress: walletAddr });
        if (walletAddr) {
            updateUserWallet(walletAddr);
            if (onWalletConnect) onWalletConnect(walletAddr);
        }
        onLogin(user);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            {/* Background blurs */}
            <div className="fixed top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="glass-panel rounded-2xl p-8 w-full max-w-lg relative z-10 shadow-2xl" style={{ animation: 'fadeIn 0.5s ease' }}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="material-symbols-outlined text-white text-3xl">token</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome to <span className="text-gradient">GrantChain</span></h1>
                    <p className="text-gray-400 text-sm">Transparent Grant Tracking on Algorand Blockchain</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            placeholder="Enter your full name"
                            autoFocus
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Select Your Role</label>
                        <div className="space-y-3">
                            {roles.map((r) => (
                                <div key={r.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${role === r.id
                                        ? `bg-${r.color}-500/10 border-${r.color}-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]`
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                    onClick={() => { setRole(r.id); setError(''); }}>
                                    <div className={`w-11 h-11 rounded-lg bg-${r.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                                        <span className={`material-symbols-outlined text-${r.color}-400 text-xl`}>{r.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-semibold text-sm">{r.label}</h4>
                                        <p className="text-gray-500 text-xs mt-0.5">{r.desc}</p>
                                    </div>
                                    {role === r.id && (
                                        <span className={`material-symbols-outlined text-${r.color}-400`}>check_circle</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Wallet Connection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Connect Wallet (Optional)</label>
                        {walletAddr ? (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-green-400 font-semibold text-sm">Connected</span>
                                    <span className="font-mono text-xs text-gray-400">{shortAddress(walletAddr)}</span>
                                </div>
                                <button type="button" className="text-xs text-gray-500 hover:text-white transition-colors"
                                    onClick={() => setWalletAddr('')}>Change</button>
                            </div>
                        ) : (
                            <button type="button"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300 text-sm font-medium transition-all"
                                onClick={handleConnectWallet} disabled={connecting}>
                                {connecting ? (
                                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Connecting...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[18px]">account_balance_wallet</span> Connect Defly Wallet</>
                                )}
                            </button>
                        )}
                        <p className="text-[11px] text-gray-600 mt-2">
                            Transactions are done via Lora. Wallet is optional for address display.
                        </p>
                    </div>

                    {/* Submit */}
                    <button type="submit"
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base glow-button flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xl">rocket_launch</span>
                        Enter GrantChain
                    </button>
                </form>

                <div className="text-center mt-6 space-y-3">
                    <Link to="/public" className="text-purple-400 hover:text-purple-300 text-sm font-medium no-underline transition-colors">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">public</span>
                        View Public Dashboard →
                    </Link>
                    <p className="text-xs text-gray-600">
                        Powered by <strong className="text-gray-400">Algorand</strong> • TestNet • Lora Transactions
                    </p>
                </div>
            </div>
        </div>
    );
}
