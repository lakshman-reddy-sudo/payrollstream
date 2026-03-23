import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats, computeEarnedSalary } from '../utils/store';
import { shortAddress, getExplorerTxnUrl } from '../utils/algorand';

export default function Dashboard({ user, walletAddress }) {
    const [grants, setGrants] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [, setTick] = useState(0);

    useEffect(() => { setGrants(getGrants()); }, []);
    useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(iv); }, []);

    const filtered = grants.filter(g => {
        const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
        const stats = getGrantStats(g);
        const matchFilter = filter === 'all'
            || (filter === 'active' && g.status === 'active')
            || (filter === 'completed' && stats.progressPercent === 100)
            || (filter === 'draft' && g.status === 'proposed');
        return matchSearch && matchFilter;
    });

    const agg = grants.reduce((a, g) => {
        const s = getGrantStats(g);
        a.total += s.totalFunding; a.released += s.releasedAmount; a.payrolls += 1;
        a.milestones += s.totalMilestones; a.funded += s.funded; a.pendingActions += s.submitted;
        return a;
    }, { total: 0, released: 0, payrolls: 0, milestones: 0, funded: 0, pendingActions: 0 });

    // Action items
    const actions = [];
    grants.forEach(g => g.milestones.forEach(m => {
        if (user.role === 'admin' && m.status === 'submitted') actions.push({ g, m, action: 'Review & Approve', icon: 'fact_check' });
        if (user.role === 'admin' && m.status === 'approved') actions.push({ g, m, action: 'Approve & Release', icon: 'send_money' });
        if (user.role === 'employee' && m.status === 'pending') actions.push({ g, m, action: 'Submit Work', icon: 'upload_file' });
        if (user.role === 'employee' && m.status === 'rejected') actions.push({ g, m, action: 'Resubmit', icon: 'refresh' });
    }));

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 24px', animation: 'fadeUp 0.4s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-h1" style={{ marginBottom: 4 }}>Dashboard</h1>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Manage payrolls on Algorand TestNet</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge-accent"><span className="live-dot" style={{ width: 6, height: 6 }}></span> TestNet</span>
                    {user.role === 'admin' && (
                        <Link to="/create" className="btn-primary btn-sm">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Create Payroll
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Active Payrolls', value: agg.payrolls, sub: `${agg.funded} milestones released`, icon: 'stream' },
                    { label: 'Pending Actions', value: actions.length, sub: actions.length > 0 ? 'Action required' : 'All clear', icon: 'pending_actions' },
                    { label: 'Total Funded', value: agg.total, sub: `${agg.released} ALGO released`, icon: 'savings', suffix: 'ALGO' },
                ].map((s, i) => (
                    <div key={i} className="card-flat" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', top: 12, right: 12, fontSize: 44, color: 'var(--border)', opacity: 0.5 }}>{s.icon}</span>
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</p>
                        <h2 className="num-display" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                            {s.value} {s.suffix && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{s.suffix}</span>}
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Action Items */}
            {actions.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span> Your Actions
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {actions.slice(0, 6).map((item, i) => (
                            <Link key={i} to={`/grant/${item.g.id}`} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '3px solid var(--accent)' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>{item.icon}</span>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{item.action}</p>
                                        <p className="text-body-sm" style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.m.name} · {item.g.name}</p>
                                        <p className="num-display" style={{ fontSize: '0.8125rem', color: 'var(--accent)', marginTop: 2 }}>{item.m.amount} ALGO</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', maxWidth: 360, width: '100%' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontSize: 20 }}>search</span>
                    <input className="input" style={{ paddingLeft: 42 }} placeholder="Search payrolls…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'active', 'completed', 'draft'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={filter === f ? 'badge-accent' : 'badge-muted'}
                            style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payroll Cards */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--border)', display: 'block', marginBottom: 16 }}>inbox</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No payrolls found</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {search ? 'Try a different search' : 'Create your first payroll to get started'}
                    </p>
                    {user.role === 'admin' && <Link to="/create" className="btn-primary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Create Payroll</Link>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                    {filtered.map(g => {
                        const stats = getGrantStats(g);
                        const sal = computeEarnedSalary(g);
                        return (
                            <Link key={g.id} to={`/grant/${g.id}`} style={{ textDecoration: 'none' }}>
                                <article className="card" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</h3>
                                            <p className="text-body-sm" style={{ color: 'var(--text-muted)', marginTop: 4 }}>{g.teamName || 'No employee'}</p>
                                        </div>
                                        <span className="badge-accent">{g.status || 'Active'}</span>
                                    </div>
                                    <p className="text-body-sm line-clamp-2" style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{g.description}</p>

                                    {/* Salary ticker */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Earned Salary</p>
                                        <p className="salary-ticker-sm">{sal.earned.toFixed(4)} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>ALGO</span></p>
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Milestones ({stats.funded}/{stats.totalMilestones})</span>
                                            <span className="num-display" style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{stats.progressPercent}%</span>
                                        </div>
                                        <div className="progress-track"><div className="progress-fill" style={{ width: `${stats.progressPercent}%` }}></div></div>
                                        <div className="divider" style={{ margin: '1rem 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total</p>
                                                <p className="num-display" style={{ fontSize: '1rem' }}>{stats.totalFunding} <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>ALGO</span></p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Escrow</p>
                                                <p className="text-mono" style={{ color: 'var(--text-muted)' }}>{shortAddress(g.escrowAddress)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}

                    {/* New payroll card */}
                    <Link to="/create" style={{ textDecoration: 'none' }}>
                        <div style={{
                            border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 250,
                            transition: 'all 0.25s',
                        }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                            }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)' }}>add</span>
                            </div>
                            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Create New Payroll</p>
                            <p className="text-body-sm" style={{ color: 'var(--text-muted)', marginTop: 6 }}>Define salary and milestones</p>
                        </div>
                    </Link>
                </div>
            )}

            {/* Recent Transactions */}
            {grants.some(g => g.transactions?.length > 0) && (
                <div style={{ marginTop: '2.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span> Recent Transactions
                    </h3>
                    <div className="card-flat" style={{ padding: '1.25rem', overflow: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-caption" style={{ color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0 0 12px' }}>Type</th>
                                    <th style={{ padding: '0 0 12px' }}>Payroll</th>
                                    <th style={{ padding: '0 0 12px' }}>Amount</th>
                                    <th style={{ padding: '0 0 12px' }}>Note</th>
                                    <th style={{ padding: '0 0 12px' }}>Date</th>
                                    <th style={{ padding: '0 0 12px', textAlign: 'right' }}>Txn ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grants.flatMap(g => (g.transactions || []).map(t => ({ ...t, grantName: g.name })))
                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
                                    .map((txn, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '10px 0' }}>
                                                <span className={txn.type === 'fund' ? 'badge-success' : 'badge-accent'} style={{ fontSize: '0.6875rem' }}>{txn.type === 'fund' ? 'Fund' : 'Release'}</span>
                                            </td>
                                            <td className="text-body-sm" style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{txn.grantName}</td>
                                            <td className="num-display" style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{txn.amount} ALGO</td>
                                            <td className="text-body-sm" style={{ padding: '10px 0', color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.note}</td>
                                            <td className="text-body-sm" style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{new Date(txn.timestamp).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px 0', textAlign: 'right' }}>
                                                {txn.txnId ? (
                                                    <a href={getExplorerTxnUrl(txn.txnId)} target="_blank" rel="noreferrer"
                                                        className="text-mono" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        {shortAddress(txn.txnId)} <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span>
                                                    </a>
                                                ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Off-chain</span>}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
