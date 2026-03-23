import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats, computeEarnedSalary } from '../utils/store';
import { shortAddress } from '../utils/algorand';

export default function PublicView() {
    const grants = useMemo(() => getGrants(), []);
    const [, setTick] = useState(0);
    useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 2000); return () => clearInterval(iv); }, []);

    if (grants.length === 0) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--border)', display: 'block', marginBottom: 16 }}>public</span>
                <h3 className="text-h3" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>No public payrolls yet</h3>
                <p className="text-body-sm" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Payrolls appear here once created.</p>
                <Link to="/login" className="btn-primary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span> Sign In</Link>
            </div>
        </div>
    );

    const totals = grants.reduce((a, g) => {
        const s = getGrantStats(g);
        a.total += s.totalFunding; a.released += s.releasedAmount;
        a.milestones += s.totalMilestones; a.funded += s.funded;
        return a;
    }, { total: 0, released: 0, milestones: 0, funded: 0 });

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 24px', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-h1" style={{ marginBottom: 4 }}>Public Payroll Transparency</h1>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>All payroll data is publicly verifiable on Algorand TestNet.</p>
                </div>
                <Link to="/login" className="btn-outline btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span> Sign In</Link>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Payrolls', value: grants.length },
                    { label: 'Total Funded', value: totals.total.toFixed(2), suffix: 'ALGO' },
                    { label: 'Total Released', value: totals.released.toFixed(2), suffix: 'ALGO' },
                    { label: 'Milestones Done', value: `${totals.funded}/${totals.milestones}` },
                ].map((s, i) => (
                    <div key={i} className="card-flat" style={{ padding: '1.5rem' }}>
                        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</p>
                        <h2 className="num-display" style={{ fontSize: '1.5rem' }}>
                            {s.value} {s.suffix && <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{s.suffix}</span>}
                        </h2>
                    </div>
                ))}
            </div>

            {/* Payroll List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {grants.map(g => {
                    const stats = getGrantStats(g);
                    const sal = computeEarnedSalary(g);
                    return (
                        <div key={g.id} className="card-flat" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{g.name}</h3>
                                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginTop: 4, maxWidth: 500 }}>{g.description}</p>
                                </div>
                                <span className="badge-accent">{g.status || 'Active'}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</p><p className="num-display">{stats.totalFunding} ALGO</p></div>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Released</p><p className="num-display" style={{ color: 'var(--accent)' }}>{stats.releasedAmount} ALGO</p></div>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Earned (Live)</p><p className="salary-ticker-sm">{sal.earned.toFixed(4)} ALGO</p></div>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Admin / Employee</p><p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{g.sponsorName || '—'} / {g.teamName || '—'}</p></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress ({stats.funded}/{stats.totalMilestones})</span>
                                <span className="num-display" style={{ fontSize: '0.75rem' }}>{stats.progressPercent}%</span>
                            </div>
                            <div className="progress-track"><div className="progress-fill" style={{ width: `${stats.progressPercent}%` }}></div></div>

                            {g.milestones.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {g.milestones.map(m => (
                                        <span key={m.id} className={m.status === 'funded' ? 'badge-success' : m.status === 'approved' ? 'badge-accent' : 'badge-muted'}
                                            style={{ fontSize: '0.625rem' }}>
                                            {m.name} · {m.amount} ALGO · {m.status.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    All payroll data verifiable on <a href="https://lora.algokit.io/testnet" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Lora Explorer</a> · PayrollStream © 2025
                </p>
            </div>
        </div>
    );
}
