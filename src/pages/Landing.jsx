import { Link } from 'react-router-dom';

export default function Landing({ user, walletAddress, onConnect }) {
    return (
        <div className="fade-in">
            <section className="hero">
                <h1>
                    Transparent <span className="gradient-text">Grant Tracking</span>
                    <br />on Algorand
                </h1>
                <p>
                    Track student project grants with full transparency. Milestone-based fund
                    releases powered by multisig escrow on the Algorand blockchain.
                </p>
                <div className="hero-actions">
                    <Link to="/dashboard" className="btn btn-primary btn-lg">
                        📊 Go to Dashboard
                    </Link>
                    {!walletAddress && (
                        <button className="btn btn-secondary btn-lg" onClick={onConnect}>
                            🔗 Connect Algorand Wallet
                        </button>
                    )}
                </div>
            </section>

            {/* Role-specific welcome */}
            <div style={{ textAlign: 'center', margin: '0 auto 40px', maxWidth: 600 }}>
                <div className="card" style={{ padding: '20px 28px' }}>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
                        {' • '}
                        <span className={`badge badge-${user.role === 'sponsor' ? 'funded' : user.role === 'admin' ? 'submitted' : 'approved'}`}>
                            {user.role === 'sponsor' ? '🏛️ Sponsor' : user.role === 'admin' ? '🎓 Admin' : '👨‍💻 Team'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="features-grid">
                <div className="card feature-card fade-in fade-in-delay-1">
                    <div className="feature-icon">🔐</div>
                    <h3>Multisig Escrow</h3>
                    <p>Funds are locked in a 2-of-3 multisig. No single party can move money alone.</p>
                </div>
                <div className="card feature-card fade-in fade-in-delay-2">
                    <div className="feature-icon">📋</div>
                    <h3>Milestone Releases</h3>
                    <p>Funds released only when milestones are completed, reviewed, and approved.</p>
                </div>
                <div className="card feature-card fade-in fade-in-delay-3">
                    <div className="feature-icon">🗳️</div>
                    <h3>DAO Voting</h3>
                    <p>Stakeholders vote on milestone approvals. Transparent, on-chain governance.</p>
                </div>
                <div className="card feature-card fade-in fade-in-delay-1">
                    <div className="feature-icon">👛</div>
                    <h3>Wallet Login</h3>
                    <p>Authenticate with Algorand wallet. Role-based access for all participants.</p>
                </div>
                <div className="card feature-card fade-in fade-in-delay-2">
                    <div className="feature-icon">📊</div>
                    <h3>Expense Tracking</h3>
                    <p>Teams log expenses on-chain. Full visibility for sponsors and admins.</p>
                </div>
                <div className="card feature-card fade-in fade-in-delay-3">
                    <div className="feature-icon">⚡</div>
                    <h3>Instant Settlement</h3>
                    <p>Algorand settles in ~4 seconds with 0.001 ALGO fees. Green and fast.</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '50px 24px 30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p>Built on <strong style={{ color: 'var(--text-secondary)' }}>Algorand TestNet</strong> • Open Innovation Hackathon</p>
            </div>
        </div>
    );
}
