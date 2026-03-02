import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/store';

export default function Login({ onLogin }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');

    const roles = [
        { id: 'sponsor', icon: '🏛️', label: 'Sponsor', desc: 'Fund projects, approve milestone payments, track spending' },
        { id: 'admin', icon: '🎓', label: 'Admin / Faculty', desc: 'Review milestones, approve/reject submissions, oversee grants' },
        { id: 'team', icon: '👨‍💻', label: 'Student Team', desc: 'Submit milestones, log expenses, receive funds' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!role) {
            setError('Please select a role');
            return;
        }
        const user = loginUser({ name: name.trim(), role });
        onLogin(user);
        navigate('/dashboard');
    };

    return (
        <div className="login-page">
            <div className="login-container fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>🔗</span>
                    </div>
                    <h1>Welcome to <span className="gradient-text">GrantChain</span></h1>
                    <p>Transparent Grant Tracking on Algorand Blockchain</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: '10px 16px', background: 'var(--danger-bg)', color: 'var(--danger)',
                            borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 500,
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            placeholder="Enter your full name"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Your Role</label>
                        <div className="role-cards">
                            {roles.map((r) => (
                                <div
                                    key={r.id}
                                    className={`role-card ${role === r.id ? 'selected' : ''}`}
                                    onClick={() => { setRole(r.id); setError(''); }}
                                >
                                    <div className="role-card-icon">{r.icon}</div>
                                    <div className="role-card-info">
                                        <h4>{r.label}</h4>
                                        <p>{r.desc}</p>
                                    </div>
                                    {role === r.id && <div className="role-check">✓</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }}>
                        🚀 Enter GrantChain
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Powered by <strong>Algorand</strong> • TestNet • No Smart Contracts
                </div>
            </div>
        </div>
    );
}
