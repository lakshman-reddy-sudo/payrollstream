import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats } from '../utils/store';

const COLORS = {
    funded: '#8b5cf6',
    approved: '#10b981',
    submitted: '#3b82f6',
    pending: '#f59e0b',
    rejected: '#ef4444',
};

const CATEGORY_COLORS = {
    General: '#8b5cf6', Hardware: '#3b82f6', Software: '#10b981',
    Services: '#f59e0b', Travel: '#ec4899', Other: '#64748b',
};

export default function Analytics({ user }) {
    const [grants, setGrants] = useState([]);
    useEffect(() => { setGrants(getGrants()); }, []);

    // ===== Aggregate data =====
    const allMilestones = grants.flatMap(g => g.milestones || []);
    const allExpenses = grants.flatMap(g => g.expenses || []);
    const allTransactions = grants.flatMap(g => (g.transactions || []).map(t => ({ ...t, grantName: g.name })));

    const statusCounts = { funded: 0, approved: 0, submitted: 0, pending: 0, rejected: 0 };
    allMilestones.forEach(m => { if (statusCounts[m.status] !== undefined) statusCounts[m.status]++; });
    const totalMilestones = allMilestones.length;

    const totalFunding = grants.reduce((s, g) => s + (parseFloat(g.totalFunding) || 0), 0);
    const totalReleased = grants.reduce((s, g) => {
        const stats = getGrantStats(g);
        return s + stats.releasedAmount;
    }, 0);
    const totalExpenses = allExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    // Category breakdown
    const categoryMap = {};
    allExpenses.forEach(e => {
        const cat = e.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(e.amount) || 0);
    });
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const maxCategoryAmount = categories.length > 0 ? categories[0][1] : 1;

    // Per-grant fund utilization
    const grantUtilization = grants.map(g => {
        const stats = getGrantStats(g);
        return { name: g.name, total: stats.totalFunding, released: stats.releasedAmount, remaining: stats.remainingAmount, progress: stats.progressPercent };
    });

    // Donut chart SVG
    const DonutChart = ({ data, size = 180 }) => {
        const total = Object.values(data).reduce((s, v) => s + v, 0);
        if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No milestones yet</div>;
        const radius = 60;
        const cx = size / 2;
        const cy = size / 2;
        let cumulative = 0;
        const segments = [];

        Object.entries(data).forEach(([status, count]) => {
            if (count === 0) return;
            const pct = count / total;
            const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
            cumulative += pct;
            const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
            const largeArc = pct > 0.5 ? 1 : 0;
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);
            segments.push(
                <path key={status}
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={COLORS[status]} opacity={0.85} />
            );
        });

        return (
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
                {segments}
                <circle cx={cx} cy={cy} r={35} fill="var(--bg-secondary)" />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="9">milestones</text>
            </svg>
        );
    };

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1>📈 Analytics Dashboard</h1>
                <p>Grant fund utilization, milestone progress, and spending insights across all projects</p>
            </div>

            {/* Top-level stats */}
            <div className="stat-grid">
                <div className="stat-card"><div className="stat-icon purple">🏦</div><div className="stat-content"><h4>Total Grants</h4><div className="stat-value">{grants.length}</div></div></div>
                <div className="stat-card"><div className="stat-icon green">💰</div><div className="stat-content"><h4>Total Funding</h4><div className="stat-value">{totalFunding.toFixed(1)} ALGO</div></div></div>
                <div className="stat-card"><div className="stat-icon blue">📤</div><div className="stat-content"><h4>Released</h4><div className="stat-value">{totalReleased.toFixed(1)} ALGO</div></div></div>
                <div className="stat-card"><div className="stat-icon yellow">📝</div><div className="stat-content"><h4>Expenses Logged</h4><div className="stat-value">{totalExpenses.toFixed(1)} ALGO</div></div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {/* Milestone Status Donut */}
                <div className="card">
                    <h3 className="section-title">🎯 Milestone Status</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <DonutChart data={statusCounts} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[status], flexShrink: 0 }}></div>
                                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize', minWidth: 70 }}>{status}</span>
                                    <span style={{ fontWeight: 600 }}>{count}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        ({totalMilestones > 0 ? Math.round(count / totalMilestones * 100) : 0}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Expense Breakdown by Category */}
                <div className="card">
                    <h3 className="section-title">📊 Expense Breakdown</h3>
                    {categories.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No expenses logged yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {categories.map(([cat, amount]) => (
                                <div key={cat}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                                        <span style={{ fontWeight: 600 }}>{amount.toFixed(1)} ALGO</span>
                                    </div>
                                    <div className="progress-bar-container" style={{ height: 8 }}>
                                        <div style={{
                                            height: '100%', borderRadius: 100, width: `${(amount / maxCategoryAmount) * 100}%`,
                                            background: CATEGORY_COLORS[cat] || '#8b5cf6', transition: 'width 0.6s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                                <span>Total</span><span>{totalExpenses.toFixed(1)} ALGO</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fund Utilization per Grant */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <h3 className="section-title">💰 Fund Utilization per Grant</h3>
                {grantUtilization.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No grants yet</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {grantUtilization.map((g, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{g.name}</span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        {g.released.toFixed(1)} / {g.total.toFixed(1)} ALGO ({g.progress}%)
                                    </span>
                                </div>
                                <div className="progress-bar-container" style={{ height: 16, position: 'relative' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 100,
                                        width: `${g.total > 0 ? (g.released / g.total) * 100 : 0}%`,
                                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                                        transition: 'width 0.8s ease',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    <span>🟢 Released: {g.released.toFixed(1)} ALGO</span>
                                    <span>🔒 Remaining: {g.remaining.toFixed(1)} ALGO</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transaction Timeline */}
            <div className="card">
                <h3 className="section-title">📜 Recent Transactions</h3>
                {allTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No transactions yet</div>
                ) : (
                    <div style={{ overflow: 'auto' }}>
                        <table className="txn-table">
                            <thead><tr><th>Grant</th><th>Type</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead>
                            <tbody>
                                {allTransactions.slice(0, 20).map((txn, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.grantName}</td>
                                        <td><span className={`badge badge-${txn.type === 'fund' ? 'funded' : txn.type === 'expense' ? 'submitted' : 'approved'}`}>
                                            {txn.type === 'fund' ? '💰 Fund' : txn.type === 'expense' ? '📝 Expense' : '📤 Release'}
                                        </span></td>
                                        <td style={{ fontWeight: 600 }}>{txn.type === 'expense' ? '0' : txn.amount} ALGO</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.note}</td>
                                        <td>{new Date(txn.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
