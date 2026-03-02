import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats } from '../utils/store';
import { shortAddress, getExplorerTxnUrl, getExplorerAddrUrl } from '../utils/algorand';

export default function PublicView() {
    const [grants, setGrants] = useState([]);
    const [expanded, setExpanded] = useState(null);
    useEffect(() => { setGrants(getGrants()); }, []);

    const toggle = (id) => setExpanded(expanded === id ? null : id);

    const totalFunding = grants.reduce((s, g) => s + (parseFloat(g.totalFunding) || 0), 0);
    const totalGrants = grants.length;
    const totalMilestones = grants.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const totalFunded = grants.reduce((s, g) => s + (g.milestones?.filter(m => m.status === 'funded').length || 0), 0);

    return (
        <div className="fade-in">
            {/* Public Header */}
            <div className="public-header">
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="logo-icon" style={{ width: 36, height: 36, fontSize: '1.1rem' }}>🔗</div>
                        <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>GrantChain</span>
                        <span className="badge badge-approved" style={{ marginLeft: 8 }}>Public Dashboard</span>
                    </div>
                    <Link to="/login" className="btn btn-secondary btn-sm">🔐 Login</Link>
                </div>
            </div>

            {/* Hero */}
            <div style={{ textAlign: 'center', padding: '50px 24px 40px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 12 }}>
                    Transparent <span className="gradient-text">Grant Tracking</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 8px', fontSize: '1.05rem' }}>
                    All student project grants tracked on the Algorand blockchain. Fully transparent and verifiable.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                    <span className="badge badge-funded" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>⛓️ Powered by Algorand</span>
                    <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>🔒 TestNet Verified</span>
                </div>
            </div>

            <div className="page">
                {/* Public Stats */}
                <div className="stat-grid">
                    <div className="stat-card"><div className="stat-icon purple">🏦</div><div className="stat-content"><h4>Active Grants</h4><div className="stat-value">{totalGrants}</div></div></div>
                    <div className="stat-card"><div className="stat-icon green">💰</div><div className="stat-content"><h4>Total Funding</h4><div className="stat-value">{totalFunding.toFixed(1)} ALGO</div></div></div>
                    <div className="stat-card"><div className="stat-icon blue">🎯</div><div className="stat-content"><h4>Total Milestones</h4><div className="stat-value">{totalMilestones}</div></div></div>
                    <div className="stat-card"><div className="stat-icon yellow">✅</div><div className="stat-content"><h4>Milestones Funded</h4><div className="stat-value">{totalFunded}</div></div></div>
                </div>

                {/* Grant List */}
                <h2 className="section-title" style={{ marginTop: 32 }}>📋 All Grants</h2>
                {grants.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No grants yet</h3>
                        <p>Grants will appear here once created by sponsors.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {grants.map(grant => {
                            const stats = getGrantStats(grant);
                            const isOpen = expanded === grant.id;
                            return (
                                <div key={grant.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onClick={() => toggle(grant.id)}>
                                    {/* Grant Summary */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{grant.name}</h3>
                                                <span className="badge badge-approved">{grant.status}</span>
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 8 }}>{grant.description}</p>
                                            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                <span>👨‍💻 {grant.teamName || 'Team'}</span>
                                                <span>🏛️ {grant.sponsorName || 'Sponsor'}</span>
                                                <span>📅 {new Date(grant.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>{stats.totalFunding} ALGO</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stats.progressPercent}% complete</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginTop: 12 }}>
                                        <div className="progress-bar-container" style={{ height: 8 }}>
                                            <div className="progress-bar-fill green" style={{ width: `${stats.progressPercent}%` }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                            <span>{stats.funded}/{stats.totalMilestones} milestones funded</span>
                                            <span style={{ fontSize: '0.85rem' }}>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isOpen && (
                                        <div style={{ marginTop: 20, borderTop: '1px solid var(--border-glass)', paddingTop: 20 }}
                                            onClick={e => e.stopPropagation()}>

                                            {/* Escrow Info */}
                                            {grant.escrowAddress && (
                                                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 8 }}>🏦 Escrow:</span>
                                                    <span className="txn-hash" style={{ fontSize: '0.78rem' }}>{grant.escrowAddress}</span>
                                                    {grant.escrowAddress.length === 58 && (
                                                        <a href={getExplorerAddrUrl(grant.escrowAddress)} target="_blank" rel="noreferrer"
                                                            style={{ fontSize: '0.75rem', color: 'var(--info)', textDecoration: 'none', marginLeft: 8 }}>
                                                            View on Explorer ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Milestones */}
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>🎯 Milestones</h4>
                                            {grant.milestones.map(m => (
                                                <div key={m.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
                                                    marginBottom: 8, flexWrap: 'wrap', gap: 8,
                                                }}>
                                                    <div>
                                                        <span style={{ fontWeight: 600, marginRight: 8 }}>{m.name}</span>
                                                        <span className={`badge badge-${m.status}`} style={{ textTransform: 'capitalize' }}>{m.status}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--accent-hover)' }}>{m.amount} ALGO</span>
                                                        {m.txnId && (
                                                            <a href={getExplorerTxnUrl(m.txnId)} target="_blank" rel="noreferrer"
                                                                style={{ fontSize: '0.75rem', color: 'var(--success)', textDecoration: 'none' }}>
                                                                ✅ {shortAddress(m.txnId)} ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Transactions */}
                                            {grant.transactions && grant.transactions.length > 0 && (
                                                <div style={{ marginTop: 16 }}>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>📜 On-Chain Transactions</h4>
                                                    <div style={{ overflow: 'auto' }}>
                                                        <table className="txn-table">
                                                            <thead><tr><th>Type</th><th>Amount</th><th>Note</th><th>Date</th><th>Txn ID</th></tr></thead>
                                                            <tbody>
                                                                {grant.transactions.map((txn, i) => (
                                                                    <tr key={i}>
                                                                        <td><span className={`badge badge-${txn.type === 'fund' ? 'funded' : 'approved'}`}>
                                                                            {txn.type === 'fund' ? '💰 Fund' : txn.type === 'expense' ? '📝 Expense' : '📤 Release'}
                                                                        </span></td>
                                                                        <td style={{ fontWeight: 600 }}>{txn.type === 'expense' ? '0' : txn.amount} ALGO</td>
                                                                        <td>{txn.note}</td>
                                                                        <td>{new Date(txn.timestamp).toLocaleDateString()}</td>
                                                                        <td>
                                                                            {txn.txnId ? (
                                                                                <a href={getExplorerTxnUrl(txn.txnId)} target="_blank" rel="noreferrer"
                                                                                    style={{ fontSize: '0.78rem', color: 'var(--accent-hover)', textDecoration: 'none' }}>
                                                                                    {shortAddress(txn.txnId)} ↗
                                                                                </a>
                                                                            ) : <span className="txn-hash">—</span>}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '40px 24px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <p>GrantChain — Transparent Grant & Fund Tracking on <strong style={{ color: 'var(--text-secondary)' }}>Algorand</strong></p>
                    <p style={{ marginTop: 4 }}>All transactions are verifiable on the Algorand TestNet blockchain</p>
                </div>
            </div>
        </div>
    );
}
