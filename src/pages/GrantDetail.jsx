import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGrant, updateGrant, updateMilestone, addTransaction, addExpense, addVote, getGrantStats, computeEarnedSalary } from '../utils/store';
import { shortAddress, getExplorerTxnUrl, getExplorerAddrUrl, getBalance, isValidAddress, getLoraComposeUrl, verifyTransaction, LORA_BASE } from '../utils/algorand';

export default function GrantDetail({ user, walletAddress }) {
    const { id } = useParams();
    const [grant, setGrant] = useState(null);
    const [toast, setToast] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);
    const [submitNote, setSubmitNote] = useState('');
    const [rejectNote, setRejectNote] = useState('');
    const [expense, setExpense] = useState({ description: '', amount: '', category: 'General' });
    const [showReleaseLora, setShowReleaseLora] = useState(null);
    const [loraTxnId, setLoraTxnId] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [txnVerified, setTxnVerified] = useState(null);
    const [salary, setSalary] = useState({ earned: 0, percent: 0, rate: 0 });
    const [liveBalance, setLiveBalance] = useState(null);
    const [fundAmount, setFundAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const balRef = useRef(null);

    const refresh = () => setGrant(getGrant(id));
    useEffect(() => { refresh(); }, [id]);
    useEffect(() => {
        if (!grant) return;
        const u = () => setSalary(computeEarnedSalary(grant));
        u(); const iv = setInterval(u, 1000); return () => clearInterval(iv);
    }, [grant]);
    useEffect(() => { if (grant?.teamWallet && !recipientAddress) setRecipientAddress(grant.teamWallet); }, [grant?.teamWallet]);
    useEffect(() => {
        if (!walletAddress) { setLiveBalance(null); return; }
        const f = () => { getBalance(walletAddress).then(setLiveBalance).catch(() => {}); };
        f(); balRef.current = setInterval(f, 15000);
        return () => { if (balRef.current) clearInterval(balRef.current); };
    }, [walletAddress]);

    const showToastMsg = (type, msg) => { setToast({ type, message: msg }); setTimeout(() => setToast(null), 4500); };

    if (!grant) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--border)', display: 'block', marginBottom: 16 }}>search_off</span>
                <h3 className="text-h3" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Payroll not found</h3>
                <Link to="/dashboard" className="btn-primary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> Dashboard</Link>
            </div>
        </div>
    );

    const stats = getGrantStats(grant);

    // ======== Handlers ========
    const handleSubmit = (ms) => {
        if (!submitNote.trim()) return showToastMsg('error', 'Describe what you completed');
        updateMilestone(grant.id, ms.id, { status: 'submitted', submittedAt: new Date().toISOString(), submittedBy: user.name, submissionNote: submitNote });
        refresh(); setShowSubmitModal(null); setSubmitNote('');
        showToastMsg('success', `"${ms.name}" submitted!`);
    };
    const handleApprove = (ms) => {
        addVote(grant.id, ms.id, { voter: user.name, decision: 'approve' });
        updateMilestone(grant.id, ms.id, { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user.name });
        refresh(); showToastMsg('success', `"${ms.name}" approved!`);
    };
    const handleReject = (ms) => {
        if (!rejectNote.trim()) return showToastMsg('error', 'Provide a reason');
        addVote(grant.id, ms.id, { voter: user.name, decision: 'reject' });
        updateMilestone(grant.id, ms.id, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectionNote: rejectNote });
        refresh(); setShowRejectModal(null); setRejectNote('');
        showToastMsg('error', `"${ms.name}" rejected.`);
    };
    const handleReleaseFunds = (ms) => { setShowReleaseLora(ms); setLoraTxnId(''); setTxnVerified(null); window.open(getLoraComposeUrl(), '_blank'); };
    const handleSubmitReleaseTxn = async () => {
        if (!loraTxnId.trim()) return showToastMsg('error', 'Paste the transaction ID');
        const ms = showReleaseLora; setVerifying(true);
        try {
            const r = await verifyTransaction(loraTxnId.trim());
            if (r?.confirmed) {
                setTxnVerified(r);
                updateMilestone(grant.id, ms.id, { status: 'funded', fundedAt: new Date().toISOString(), txnId: loraTxnId.trim() });
                addTransaction(grant.id, { type: 'release', amount: String(r.amount || parseFloat(ms.amount)), note: `SALARY RELEASE: ${ms.name}`, from: r.sender || walletAddress || 'Admin', to: r.receiver || grant.teamWallet || 'Employee', txnId: loraTxnId.trim(), onChain: true });
                refresh(); showToastMsg('success', `"${ms.name}" released! Verified on-chain.`);
                setTimeout(() => { setShowReleaseLora(null); setLoraTxnId(''); setTxnVerified(null); }, 2000);
            } else showToastMsg('error', 'Transaction not found. Try again.');
        } catch (err) { showToastMsg('error', `Verification failed: ${err.message}`); }
        setVerifying(false);
    };
    const handleFundGrant = async () => {
        if (!loraTxnId.trim()) return showToastMsg('error', 'Paste the transaction ID');
        const amt = parseFloat(fundAmount); setVerifying(true);
        try {
            const r = await verifyTransaction(loraTxnId.trim());
            if (r?.confirmed) {
                setTxnVerified(r);
                addTransaction(grant.id, { type: 'fund', amount: String(r.amount || amt || 0), note: 'Payroll funding via Lora', from: r.sender || 'Admin', to: r.receiver || grant.teamWallet || 'Employee', txnId: loraTxnId.trim(), onChain: true });
                updateGrant(grant.id, { totalFunding: String(parseFloat(grant.totalFunding || 0) + (r.amount || amt || 0)), status: 'active' });
                refresh(); showToastMsg('success', 'Payroll funded!');
                setTimeout(() => { setShowFundModal(false); setLoraTxnId(''); setFundAmount(''); setTxnVerified(null); }, 2000);
            } else showToastMsg('error', 'Transaction not found.');
        } catch (err) { showToastMsg('error', `Verification failed: ${err.message}`); }
        setVerifying(false);
    };
    const handleResubmit = (ms) => {
        updateMilestone(grant.id, ms.id, { status: 'pending', rejectedAt: null, rejectionNote: null, submittedAt: null, submittedBy: null, submissionNote: null, votes: [] });
        refresh(); showToastMsg('info', `"${ms.name}" reset.`);
    };
    const handleMarkComplete = () => {
        updateGrant(grant.id, { endTime: new Date().toISOString(), markedCompleteAt: new Date().toISOString(), markedCompleteBy: user.name });
        refresh();
        showToastMsg('success', 'Timer set to 100% — salary fully accrued. Employee can be paid out immediately.');
    };
    const handleLogExpense = () => {
        if (!expense.description.trim() || !expense.amount) return showToastMsg('error', 'Fill in expense details');
        addExpense(grant.id, { ...expense, loggedBy: user.name });
        refresh(); setShowExpenseModal(false); setExpense({ description: '', amount: '', category: 'General' });
        showToastMsg('success', 'Expense logged.');
    };

    const statusCfg = {
        pending: { icon: 'radio_button_unchecked', color: 'var(--text-muted)', bg: 'var(--bg-card)', label: 'Pending' },
        submitted: { icon: 'pending', color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Submitted' },
        approved: { icon: 'check_circle', color: 'var(--accent)', bg: 'var(--accent-subtle)', label: 'Approved' },
        funded: { icon: 'verified', color: 'var(--success)', bg: 'var(--success-bg)', label: 'Released' },
        rejected: { icon: 'cancel', color: 'var(--error)', bg: 'var(--error-bg)', label: 'Rejected' },
    };

    // ======== MODAL ========
    const Modal = ({ show, onClose, title, icon, children, maxW = 500 }) => {
        if (!show) return null;
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-content" style={{ maxWidth: maxW }} onClick={e => e.stopPropagation()}>
                    <h2 className="text-h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 22 }}>{icon}</span> {title}
                    </h2>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 24px', animation: 'fadeUp 0.4s ease' }}>
            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

            {verifying && (
                <div className="modal-backdrop" style={{ zIndex: 300 }}>
                    <div className="modal-content" style={{ maxWidth: 320, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <h3 className="text-h3">Verifying…</h3>
                        <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Checking Algorand TestNet</p>
                    </div>
                </div>
            )}

            {/* Submit Modal */}
            <Modal show={showSubmitModal} onClose={() => setShowSubmitModal(null)} title="Submit Milestone" icon="upload_file">
                <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Submitting: <strong style={{ color: 'var(--text-primary)' }}>{showSubmitModal?.name}</strong> ({showSubmitModal?.amount} ALGO)</p>
                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>What you completed *</label>
                <textarea className="input" value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Describe deliverables…" style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={() => handleSubmit(showSubmitModal)}>Submit</button>
                    <button className="btn-outline" style={{ padding: '10px 20px' }} onClick={() => setShowSubmitModal(null)}>Cancel</button>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(null)} title="Reject Milestone" icon="cancel">
                <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Rejecting: <strong style={{ color: 'var(--text-primary)' }}>{showRejectModal?.name}</strong></p>
                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Reason *</label>
                <textarea className="input" value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="What needs improvement…" style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '10px 0', background: 'var(--error)' }} onClick={() => handleReject(showRejectModal)}>Reject</button>
                    <button className="btn-outline" style={{ padding: '10px 20px' }} onClick={() => setShowRejectModal(null)}>Cancel</button>
                </div>
            </Modal>

            {/* Expense Modal */}
            <Modal show={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Log Expense" icon="receipt_long">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    <div><label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Description *</label><input className="input" value={expense.description} onChange={e => setExpense({ ...expense, description: e.target.value })} placeholder="Development tools" /></div>
                    <div><label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Amount (ALGO) *</label><input type="number" className="input" value={expense.amount} onChange={e => setExpense({ ...expense, amount: e.target.value })} min="0.01" step="0.01" /></div>
                    <div><label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label><select className="input" value={expense.category} onChange={e => setExpense({ ...expense, category: e.target.value })}><option>General</option><option>Hardware</option><option>Software</option><option>Services</option><option>Other</option></select></div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}><button className="btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={handleLogExpense}>Log</button><button className="btn-outline" style={{ padding: '10px 20px' }} onClick={() => setShowExpenseModal(false)}>Cancel</button></div>
            </Modal>

            {/* Fund Modal */}
            <Modal show={showFundModal} onClose={() => setShowFundModal(false)} title="Fund Payroll" icon="payments" maxW={560}>
                <div style={{ padding: '1rem', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-accent)', marginBottom: '1rem' }}>
                    <p className="text-body-sm" style={{ color: 'var(--accent)' }}><strong>1.</strong> Open Lora → <strong>2.</strong> Create payment → <strong>3.</strong> Paste Txn ID below</p>
                </div>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => window.open(getLoraComposeUrl(), '_blank')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span> Open Lora Composer
                </button>
                {grant.teamWallet && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '1rem' }}><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Employee:</span><div className="text-mono" style={{ color: 'var(--accent)', wordBreak: 'break-all', marginTop: 2, userSelect: 'all' }}>{grant.teamWallet}</div></div>}
                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Transaction ID *</label>
                <input className="input text-mono" style={{ fontSize: '0.75rem', marginBottom: '1rem' }} value={loraTxnId} onChange={e => { setLoraTxnId(e.target.value); setTxnVerified(null); }} placeholder="Paste txn ID…" />
                {txnVerified && <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem' }}>✓ Verified! {txnVerified.amount} ALGO</div>}
                <div style={{ display: 'flex', gap: 12 }}><button className="btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={handleFundGrant} disabled={verifying || !loraTxnId.trim()}>{verifying ? 'Verifying…' : 'Verify & Submit'}</button><button className="btn-outline" style={{ padding: '10px 20px' }} onClick={() => { setShowFundModal(false); setLoraTxnId(''); setTxnVerified(null); }}>Cancel</button></div>
            </Modal>

            {/* Release Modal */}
            <Modal show={showReleaseLora} onClose={() => setShowReleaseLora(null)} title={`Release — ${showReleaseLora?.name || ''}`} icon="send_money" maxW={560}>
                <div style={{ padding: '1rem', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-accent)', marginBottom: '1rem' }}>
                    <p className="text-body-sm" style={{ color: 'var(--accent)' }}>Send <strong>{showReleaseLora?.amount} ALGO</strong> to employee via Lora, then paste the transaction ID below.</p>
                </div>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => window.open(getLoraComposeUrl(), '_blank')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span> Open Lora Composer
                </button>
                {grant.teamWallet && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 10 }}><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receiver:</span><div className="text-mono" style={{ color: 'var(--accent)', wordBreak: 'break-all', marginTop: 2, userSelect: 'all' }}>{grant.teamWallet}</div></div>}
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount:</span>
                    <span className="num-display" style={{ color: 'var(--text-primary)', fontWeight: 700, marginLeft: 8 }}>{showReleaseLora?.amount} ALGO</span>
                </div>
                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Transaction ID *</label>
                <input className="input text-mono" style={{ fontSize: '0.75rem', marginBottom: '1rem' }} value={loraTxnId} onChange={e => { setLoraTxnId(e.target.value); setTxnVerified(null); }} placeholder="Paste txn ID…" />
                {txnVerified && <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem' }}>✓ Verified! Round #{txnVerified.confirmedRound}</div>}
                <div style={{ display: 'flex', gap: 12 }}><button className="btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={handleSubmitReleaseTxn} disabled={verifying || !loraTxnId.trim()}>{verifying ? 'Verifying…' : 'Verify & Release'}</button><button className="btn-outline" style={{ padding: '10px 20px' }} onClick={() => { setShowReleaseLora(null); setLoraTxnId(''); setTxnVerified(null); }}>Cancel</button></div>
            </Modal>

            {/* Breadcrumb */}
            <Link to="/dashboard" className="btn-ghost" style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '6px 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> Back to Dashboard
            </Link>

            {/* 2-col Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
                {/* LEFT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card-glow" style={{ padding: '2rem', position: 'relative' }}>
                        <span className="text-caption" style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>#{grant.id}</span>
                        <div style={{ marginBottom: '1rem' }}><span className="badge-accent">{grant.status || 'Active'}</span></div>
                        <h1 className="text-h2" style={{ marginBottom: 8 }}>{grant.name}</h1>
                        <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>{grant.description}</p>

                        {/* LIVE SALARY TICKER */}
                        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-accent)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span className="text-caption" style={{ color: 'var(--text-muted)' }}>Earned Salary</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="live-dot"></span>
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Live</span>
                                </div>
                            </div>
                            <div className="salary-ticker">{salary.earned.toFixed(6)}</div>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ALGO</span>
                            <div style={{ marginTop: 16 }}>
                                <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(salary.percent, 100)}%` }}></div></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{salary.percent.toFixed(1)}% accrued</span>
                                    <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{salary.rate.toFixed(6)}/s</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Salary</p>
                                <p className="num-display" style={{ fontSize: '1.25rem' }}>{stats.totalFunding} <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>ALGO</span></p>
                            </div>
                            <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Released</p>
                                <p className="num-display" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>{stats.releasedAmount} <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>ALGO</span></p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Milestone Progress</span>
                                <span className="num-display" style={{ fontSize: '0.75rem' }}>{stats.progressPercent}%</span>
                            </div>
                            <div className="progress-track"><div className="progress-fill" style={{ width: `${stats.progressPercent}%` }}></div></div>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>{stats.funded}/{stats.totalMilestones} released</p>
                        </div>

                        {/* Participants */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <p className="text-caption" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>Participants</p>
                            {[
                                { name: grant.sponsorName, role: 'Admin', wallet: grant.sponsorWallet, icon: 'shield_person' },
                                { name: grant.teamName, role: 'Employee', wallet: grant.teamWallet, icon: 'badge' },
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 16 }}>{p.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-body-sm" style={{ fontWeight: 600 }}>{p.name || '—'}</p>
                                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{p.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{p.wallet ? shortAddress(p.wallet) : '—'}</span>
                                </div>
                            ))}
                        </div>

                        {/* Escrow */}
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Escrow Address</p>
                            <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
                                <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{grant.escrowAddress}</span>
                            </div>
                            {liveBalance !== null && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span className="live-dot" style={{ width: 4, height: 4 }}></span> Wallet: {liveBalance.toFixed(2)} ALGO
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {user.role === 'admin' && <button onClick={() => setShowFundModal(true)} className="btn-primary btn-sm" style={{ flex: 1 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>payments</span> Fund</button>}
                                {user.role === 'employee' && <button onClick={() => setShowExpenseModal(true)} className="btn-outline btn-sm" style={{ flex: 1 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span> Log Expense</button>}
                            </div>
                            {user.role === 'admin' && salary.percent < 100 && (
                                <button onClick={handleMarkComplete} className="btn-outline btn-sm" style={{ width: '100%', borderColor: 'rgba(251,191,36,0.3)', color: 'var(--warning)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span> Mark Complete Early
                                </button>
                            )}
                            {grant.markedCompleteAt && (
                                <p style={{ fontSize: '0.6875rem', color: 'var(--warning)', textAlign: 'center' }}>
                                    ⚡ Completed early by {grant.markedCompleteBy} · {new Date(grant.markedCompleteAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Proposed Banner */}
                    {grant.status === 'proposed' && (
                        <div style={{ background: 'var(--warning-bg)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <div><h4 style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 2 }}>Awaiting Funding</h4><p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Submitted by <strong>{grant.proposedBy || grant.teamName}</strong></p></div>
                            {user.role === 'admin' && <button onClick={() => { setFundAmount('1'); setShowFundModal(true); }} className="btn-primary btn-sm">Fund This Payroll</button>}
                        </div>
                    )}

                    {/* Milestone Timeline */}
                    <div className="card-flat" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timeline</span> Milestone Timeline
                            </h2>
                            <span className="text-caption" style={{ color: 'var(--text-muted)' }}>{stats.funded}/{stats.totalMilestones} Released</span>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: 16 }}>
                            <div className="timeline-line"></div>

                            {grant.milestones.map(m => {
                                const sc = statusCfg[m.status] || statusCfg.pending;
                                return (
                                    <div key={m.id} style={{ position: 'relative', display: 'flex', gap: '1.25rem', marginBottom: '2rem' }}>
                                        <div style={{ flexShrink: 0, zIndex: 10, marginTop: 4 }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                background: sc.bg, border: `2px solid ${sc.color}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span className="material-symbols-outlined" style={{ color: sc.color, fontSize: 22 }}>{sc.icon}</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                                            opacity: m.status === 'pending' ? 0.6 : 1,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                                                <div>
                                                    <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{m.name}</h3>
                                                    <span style={{ fontSize: '0.75rem', color: sc.color, fontWeight: 600 }}>{sc.label} · {m.amount} ALGO ({m.percentage}%)</span>
                                                </div>
                                            </div>
                                            {m.description && <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{m.description}</p>}
                                            {m.submissionNote && <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)', color: 'var(--accent)', fontSize: '0.875rem', marginBottom: 12 }}><strong>Submission:</strong> {m.submissionNote}</div>}
                                            {m.rejectionNote && <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--error)', fontSize: '0.875rem', marginBottom: 12 }}><strong>Rejection:</strong> {m.rejectionNote}</div>}
                                            {m.votes?.length > 0 && <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', fontSize: '0.875rem', marginBottom: 12 }}><strong style={{ color: 'var(--text-muted)' }}>Votes:</strong>{m.votes.map((v, i) => <span key={i} style={{ marginLeft: 8, color: v.decision === 'approve' ? 'var(--success)' : 'var(--error)' }}>{v.decision === 'approve' ? '✓' : '✗'} {v.voter}</span>)}</div>}

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '1rem' }}>
                                                {user.role === 'employee' && m.status === 'pending' && <button onClick={() => setShowSubmitModal(m)} className="btn-primary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span> Submit Work</button>}
                                                {user.role === 'employee' && m.status === 'rejected' && <button onClick={() => handleResubmit(m)} className="btn-outline btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span> Resubmit</button>}
                                                {user.role === 'admin' && m.status === 'submitted' && (
                                                    <div style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', border: '1px solid rgba(251,191,36,0.2)' }}>
                                                        <p className="text-body-sm" style={{ color: 'var(--warning)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span> Review required
                                                        </p>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            <button onClick={() => handleApprove(m)} className="btn-primary btn-sm" style={{ background: 'var(--success)' }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Approve</button>
                                                            <button onClick={() => setShowRejectModal(m)} className="btn-primary btn-sm" style={{ background: 'var(--error)' }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span> Reject</button>
                                                        </div>
                                                    </div>
                                                )}
                                                {user.role === 'admin' && m.status === 'approved' && <button onClick={() => handleReleaseFunds(m)} className="btn-primary btn-sm">Approve & Release {m.amount} ALGO <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span></button>}
                                                {user.role === 'employee' && m.status === 'approved' && <span className="badge-accent" style={{ fontSize: '0.75rem' }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>hourglass_top</span> Awaiting release</span>}
                                                {m.status === 'funded' && m.txnId && (
                                                    <a href={`https://lora.algokit.io/testnet/transaction/${m.txnId}`} target="_blank" rel="noreferrer" className="badge-success" style={{ fontSize: '0.75rem' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                                                        View on Lora: {shortAddress(m.txnId)}
                                                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span>
                                                    </a>
                                                )}
                                            </div>

                                            {(m.submittedAt || m.approvedAt || m.fundedAt) && (
                                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                    {m.submittedAt && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Submitted {new Date(m.submittedAt).toLocaleDateString()}</span>}
                                                    {m.approvedAt && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>· Approved {new Date(m.approvedAt).toLocaleDateString()}</span>}
                                                    {m.fundedAt && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>· Released {new Date(m.fundedAt).toLocaleDateString()}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Expense Log */}
                    {grant.expenses?.length > 0 && (
                        <div className="card-flat" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span> Expenses</h3>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead><tr className="text-caption" style={{ color: 'var(--text-muted)' }}><th style={{ padding: '0 0 10px' }}>Description</th><th style={{ padding: '0 0 10px' }}>Amount</th><th style={{ padding: '0 0 10px' }}>Category</th><th style={{ padding: '0 0 10px' }}>By</th><th style={{ padding: '0 0 10px', textAlign: 'right' }}>Date</th></tr></thead>
                                <tbody>{grant.expenses.map((e, i) => <tr key={i}><td className="text-body-sm" style={{ padding: '8px 0' }}>{e.description}</td><td className="num-display" style={{ padding: '8px 0', color: 'var(--accent)' }}>{e.amount} ALGO</td><td style={{ padding: '8px 0' }}><span className="badge-accent" style={{ fontSize: '0.625rem' }}>{e.category}</span></td><td className="text-body-sm" style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{e.loggedBy}</td><td className="text-body-sm" style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>{new Date(e.timestamp).toLocaleDateString()}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}

                    {/* Transactions */}
                    {grant.transactions.length > 0 && (
                        <div className="card-flat" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span> On-Chain Audit Trail</h3>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr className="text-caption" style={{ color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '0 0 10px', width: '12%' }}>Type</th>
                                        <th style={{ padding: '0 0 10px', width: '20%' }}>Txn ID</th>
                                        <th style={{ padding: '0 0 10px', width: '34%' }}>Note</th>
                                        <th style={{ padding: '0 0 10px', width: '18%' }}>Amount</th>
                                        <th style={{ padding: '0 0 10px', width: '16%', textAlign: 'right' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>{grant.transactions.map((txn, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '10px 8px 10px 0' }}><span className={txn.type === 'fund' ? 'badge-success' : 'badge-accent'} style={{ fontSize: '0.625rem' }}>{txn.type === 'fund' ? 'Fund' : 'Release'}</span></td>
                                        <td style={{ padding: '10px 8px 10px 0' }}>{txn.txnId ? <a href={`https://lora.algokit.io/testnet/transaction/${txn.txnId}`} target="_blank" rel="noreferrer" className="text-mono" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>{shortAddress(txn.txnId)} <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span></a> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td className="text-body-sm" style={{ padding: '10px 8px 10px 0', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.note}</td>
                                        <td className="num-display" style={{ padding: '10px 8px 10px 0' }}>{txn.amount} ALGO</td>
                                        <td className="text-body-sm" style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>{txn.timestamp ? new Date(txn.timestamp).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
