import { Link } from 'react-router-dom';

export default function Landing({ user }) {
    const features = [
        { icon: 'lock', title: 'Self-Sovereign Identity', desc: 'Every payroll contract is independently verifiable. No central authority controls your salary data.' },
        { icon: 'verified', title: 'On-Chain Verification', desc: 'All credentials are anchored to Algorand for tamper-proof proof of every salary release.' },
    ];

    const steps = [
        { num: '01', title: 'Connect your Pera Wallet', desc: 'Link your Algorand wallet to start' },
        { num: '02', title: 'Create a Payroll Stream', desc: 'Define salary, milestones & timeline' },
        { num: '03', title: 'Submit & verify milestones', desc: 'Employee submits work, admin verifies' },
        { num: '04', title: 'Release salary on-chain', desc: 'Verified payments via Algorand' },
    ];

    return (
        <main style={{ flex: 1, overflow: 'hidden' }}>
            {/* HERO */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 24px 4rem', textAlign: 'center' }}>
                <div className="badge-accent" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>circle</span>
                    Powered by Algorand
                </div>
                <h1 className="text-display" style={{ marginBottom: '1.25rem' }}>
                    Your Payroll, <span style={{ color: 'var(--accent)' }}>On-Chain.</span>
                </h1>
                <p className="text-body" style={{ color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto 2.5rem', fontSize: '1.0625rem', lineHeight: 1.7 }}>
                    PayrollStream lets you create milestone-based payrolls, stream salary in real-time, and verify every release — all anchored to the Algorand blockchain.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <Link to="/create" className="btn-primary" style={{ padding: '14px 32px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance_wallet</span>
                        {user?.role === 'employee' ? 'Submit Work' : 'Create Payroll'}
                    </Link>
                    <Link to="/public" className="btn-outline" style={{ padding: '14px 32px' }}>
                        View Public Dashboard
                    </Link>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 24px 4rem' }}>
                <p className="text-caption" style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', letterSpacing: '0.15em' }}>HOW IT WORKS</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                    {steps.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div className="step-circle" style={{ margin: '0 auto 1rem' }}>{s.num}</div>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</h4>
                            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 24px 5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {features.map((f, i) => (
                        <div key={i} className="card-flat" style={{ padding: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 22 }}>{f.icon}</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
                                <p className="text-body-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 14 }}>stream</span>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>PayrollStream</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>© 2025 PayrollStream · Built on Algorand TestNet</p>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <a href="https://lora.algokit.io/testnet" target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Lora Explorer</a>
                        <a href="https://developer.algorand.org" target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Algorand Docs</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
