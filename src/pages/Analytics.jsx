import { useMemo } from 'react';
import { getGrants, getGrantStats } from '../utils/store';

export default function Analytics({ user }) {
    const grants = useMemo(() => getGrants(), []);

    const agg = useMemo(() => {
        const s = grants.reduce((a, g) => {
            const st = getGrantStats(g);
            a.payrolls += 1; a.total += st.totalFunding; a.released += st.releasedAmount;
            a.remaining += st.remainingAmount; a.milestones += st.totalMilestones;
            a.funded += st.funded; a.approved += st.approved; a.submitted += st.submitted;
            a.rejected += st.rejected; a.pending += st.pending;
            return a;
        }, { payrolls: 0, total: 0, released: 0, remaining: 0, milestones: 0, funded: 0, approved: 0, submitted: 0, rejected: 0, pending: 0 });
        s.releaseRate = s.total > 0 ? Math.round((s.released / s.total) * 100) : 0;
        return s;
    }, [grants]);

    const topPayrolls = useMemo(() => [...grants].sort((a, b) => (parseFloat(b.totalFunding) || 0) - (parseFloat(a.totalFunding) || 0)).slice(0, 5), [grants]);

    const allTxns = useMemo(() =>
        grants.flatMap(g => (g.transactions || []).map(t => ({ ...t, payrollName: g.name })))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15),
        [grants]);

    if (grants.length === 0) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--border)', display: 'block', marginBottom: 16 }}>bar_chart</span>
                <h3 className="text-h3" style={{ color: 'var(--text-secondary)' }}>No data yet</h3>
                <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Create your first payroll to see analytics</p>
            </div>
        </div>
    );

    const Bar = ({ label, count, total, color }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: 72, textAlign: 'right' }}>{label}</span>
                <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }}></div>
                </div>
                <span className="num-display" style={{ fontSize: '0.875rem', minWidth: 36, textAlign: 'right' }}>{count}</span>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 24px', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="text-h1" style={{ marginBottom: 4 }}>Payroll Analytics</h1>
                <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Salary distribution, milestone progress, and audit data.</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Payrolls', value: agg.payrolls, icon: 'stream' },
                    { label: 'Total Funded', value: `${agg.total}`, suffix: 'ALGO', icon: 'savings' },
                    { label: 'Released', value: `${agg.released}`, suffix: 'ALGO', icon: 'send_money' },
                    { label: 'Release Rate', value: `${agg.releaseRate}%`, icon: 'trending_up' },
                ].map((s, i) => (
                    <div key={i} className="card-flat" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', top: 10, right: 10, fontSize: 40, color: 'var(--border)', opacity: 0.5 }}>{s.icon}</span>
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</p>
                        <h2 className="num-display" style={{ fontSize: '1.75rem' }}>
                            {s.value} {s.suffix && <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{s.suffix}</span>}
                        </h2>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Milestone Distribution */}
                <div className="card-flat" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>pie_chart</span> Milestone Status
                    </h3>
                    <Bar label="Released" count={agg.funded} total={agg.milestones} color="var(--success)" />
                    <Bar label="Approved" count={agg.approved} total={agg.milestones} color="var(--accent)" />
                    <Bar label="Submitted" count={agg.submitted} total={agg.milestones} color="var(--warning)" />
                    <Bar label="Pending" count={agg.pending} total={agg.milestones} color="var(--text-muted)" />
                    <Bar label="Rejected" count={agg.rejected} total={agg.milestones} color="var(--error)" />
                    <div className="divider" style={{ margin: '1rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Milestones</span>
                        <span className="num-display" style={{ fontSize: '0.8125rem' }}>{agg.milestones}</span>
                    </div>
                </div>

                {/* Top Payrolls */}
                <div className="card-flat" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>leaderboard</span> Top Payrolls
                    </h3>
                    {topPayrolls.map((g, i) => {
                        const s = getGrantStats(g);
                        return (
                            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className="step-circle" style={{ width: 28, height: 28, fontSize: '0.6875rem' }}>{i + 1}</span>
                                    <div>
                                        <p className="text-body-sm" style={{ fontWeight: 600 }}>{g.name}</p>
                                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{g.teamName}</p>
                                    </div>
                                </div>
                                <span className="num-display" style={{ fontSize: '0.875rem' }}>{s.totalFunding} <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>ALGO</span></span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transactions */}
            {allTxns.length > 0 && (
                <div className="card-flat" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span> Transaction Log
                    </h3>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead><tr className="text-caption" style={{ color: 'var(--text-muted)' }}><th style={{ padding: '0 0 10px' }}>Type</th><th style={{ padding: '0 0 10px' }}>Payroll</th><th style={{ padding: '0 0 10px' }}>Amount</th><th style={{ padding: '0 0 10px' }}>Note</th><th style={{ padding: '0 0 10px', textAlign: 'right' }}>Date</th></tr></thead>
                        <tbody>
                            {allTxns.map((txn, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '10px 0' }}><span className={txn.type === 'fund' ? 'badge-success' : 'badge-accent'} style={{ fontSize: '0.625rem' }}>{txn.type === 'fund' ? 'Fund' : 'Release'}</span></td>
                                    <td className="text-body-sm" style={{ padding: '10px 0' }}>{txn.payrollName}</td>
                                    <td className="num-display" style={{ padding: '10px 0' }}>{txn.amount} ALGO</td>
                                    <td className="text-body-sm" style={{ padding: '10px 0', color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.note}</td>
                                    <td className="text-body-sm" style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>{new Date(txn.timestamp).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
