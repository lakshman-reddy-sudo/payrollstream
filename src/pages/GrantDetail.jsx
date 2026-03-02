import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGrant, updateMilestone, addTransaction, addExpense, addVote, getGrantStats } from '../utils/store';
import { shortAddress } from '../utils/algorand';

export default function GrantDetail({ user, walletAddress }) {
    const { id } = useParams();
    const [grant, setGrant] = useState(null);
    const [toast, setToast] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [submitNote, setSubmitNote] = useState('');
    const [rejectNote, setRejectNote] = useState('');
    const [expense, setExpense] = useState({ description: '', amount: '', category: 'General' });

    const refresh = () => setGrant(getGrant(id));
    useEffect(() => { refresh(); }, [id]);

    const showToastMsg = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    if (!grant) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>Grant not found</h3>
                    <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const stats = getGrantStats(grant);

    // ======== TEAM: Submit Milestone ========
    const handleSubmit = (milestone) => {
        if (!submitNote.trim()) return showToastMsg('error', 'Please describe what you completed');
        updateMilestone(grant.id, milestone.id, {
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            submittedBy: user.name,
            submissionNote: submitNote,
        });
        refresh();
        setShowSubmitModal(null);
        setSubmitNote('');
        showToastMsg('success', `📤 "${milestone.name}" submitted for review!`);
    };

    // ======== ADMIN: Approve Milestone (with DAO vote) ========
    const handleApprove = (milestone) => {
        addVote(grant.id, milestone.id, { voter: user.name, decision: 'approve' });
        updateMilestone(grant.id, milestone.id, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: user.name,
        });
        refresh();
        showToastMsg('success', `✅ "${milestone.name}" approved! Waiting for sponsor to release funds.`);
    };

    // ======== ADMIN: Reject Milestone ========
    const handleReject = (milestone) => {
        if (!rejectNote.trim()) return showToastMsg('error', 'Please provide a reason for rejection');
        addVote(grant.id, milestone.id, { voter: user.name, decision: 'reject' });
        updateMilestone(grant.id, milestone.id, {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionNote: rejectNote,
        });
        refresh();
        setShowRejectModal(null);
        setRejectNote('');
        showToastMsg('error', `❌ "${milestone.name}" rejected. Team can resubmit.`);
    };

    // ======== SPONSOR: Release Funds ========
    const handleReleaseFunds = (milestone) => {
        const txnId = `ALGO_TXN_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        updateMilestone(grant.id, milestone.id, {
            status: 'funded',
            fundedAt: new Date().toISOString(),
            txnId,
        });
        addTransaction(grant.id, {
            type: 'release',
            amount: milestone.amount,
            note: `MILESTONE: ${milestone.name}`,
            from: shortAddress(grant.escrowAddress),
            to: shortAddress(grant.teamWallet),
            txnId,
        });
        refresh();
        showToastMsg('success', `💸 ${milestone.amount} ALGO released for "${milestone.name}"!`);
    };

    // ======== TEAM: Resubmit rejected ========
    const handleResubmit = (milestone) => {
        updateMilestone(grant.id, milestone.id, {
            status: 'pending',
            rejectedAt: null,
            rejectionNote: null,
            submittedAt: null,
            submittedBy: null,
            submissionNote: null,
            votes: [],
        });
        refresh();
        showToastMsg('info', `🔄 "${milestone.name}" reset. You can submit again.`);
    };

    // ======== DAO: Cast vote ========
    const handleVote = (milestone, decision) => {
        addVote(grant.id, milestone.id, { voter: user.name, decision });
        refresh();
        showToastMsg('success', `🗳️ Vote "${decision}" recorded for "${milestone.name}"`);
    };

    // ======== TEAM: Log expense ========
    const handleLogExpense = () => {
        if (!expense.description.trim() || !expense.amount) return showToastMsg('error', 'Fill in expense details');
        addExpense(grant.id, { ...expense, loggedBy: user.name });
        refresh();
        setShowExpenseModal(false);
        setExpense({ description: '', amount: '', category: 'General' });
        showToastMsg('success', '📝 Expense logged on record!');
    };

    const getStatusColor = (s) => {
        const map = { pending: 'var(--text-muted)', submitted: 'var(--info)', approved: 'var(--success)', funded: 'var(--accent-solid)', rejected: 'var(--danger)' };
        return map[s] || 'var(--text-muted)';
    };

    return (
        <div className="page fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="modal-overlay" onClick={() => setShowSubmitModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>📤 Submit Milestone</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Submitting: <strong>{showSubmitModal.name}</strong> ({showSubmitModal.amount} ALGO)
                        </p>
                        <div className="form-group">
                            <label>Describe what you completed *</label>
                            <textarea className="form-control" value={submitNote} onChange={e => setSubmitNote(e.target.value)}
                                placeholder="Describe your deliverables, attach links to demos, reports..." rows={4} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={() => handleSubmit(showSubmitModal)}>📤 Submit for Review</button>
                            <button className="btn btn-secondary" onClick={() => setShowSubmitModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>❌ Reject Milestone</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Rejecting: <strong>{showRejectModal.name}</strong>
                        </p>
                        <div className="form-group">
                            <label>Reason for rejection *</label>
                            <textarea className="form-control" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                placeholder="Explain what needs to be improved..." rows={3} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-danger" onClick={() => handleReject(showRejectModal)}>❌ Reject</button>
                            <button className="btn btn-secondary" onClick={() => setShowRejectModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>📝 Log Expense</h2>
                        <div className="form-group">
                            <label>Description *</label>
                            <input className="form-control" value={expense.description} onChange={e => setExpense({ ...expense, description: e.target.value })}
                                placeholder="e.g. Raspberry Pi × 5 units" />
                        </div>
                        <div className="form-group">
                            <label>Amount (ALGO) *</label>
                            <input type="number" className="form-control" value={expense.amount} onChange={e => setExpense({ ...expense, amount: e.target.value })}
                                placeholder="15" min="0.01" step="0.01" />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select className="form-control" value={expense.category} onChange={e => setExpense({ ...expense, category: e.target.value })}>
                                <option>General</option>
                                <option>Hardware</option>
                                <option>Software</option>
                                <option>Services</option>
                                <option>Travel</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={handleLogExpense}>📝 Log Expense</button>
                            <button className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '8px' }}>
                <Link to="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Dashboard</Link>
            </div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>{grant.name}</h1>
                    <p>{grant.description}</p>
                </div>
                {user.role === 'team' && (
                    <button className="btn btn-secondary" onClick={() => setShowExpenseModal(true)}>📝 Log Expense</button>
                )}
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card"><div className="stat-icon purple">💰</div><div className="stat-content"><h4>Total Funding</h4><div className="stat-value">{stats.totalFunding} ALGO</div></div></div>
                <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-content"><h4>Released</h4><div className="stat-value">{stats.releasedAmount} ALGO</div></div></div>
                <div className="stat-card"><div className="stat-icon yellow">🔒</div><div className="stat-content"><h4>In Escrow</h4><div className="stat-value">{stats.remainingAmount} ALGO</div></div></div>
                <div className="stat-card"><div className="stat-icon blue">📊</div><div className="stat-content"><h4>Progress</h4><div className="stat-value">{stats.progressPercent}%</div></div></div>
            </div>

            {/* Progress */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Overall Progress</span>
                    <span style={{ fontWeight: 600 }}>{stats.funded} of {stats.totalMilestones} milestones funded</span>
                </div>
                <div className="progress-bar-container" style={{ height: '12px' }}>
                    <div className="progress-bar-fill green" style={{ width: `${stats.progressPercent}%` }} />
                </div>
            </div>

            {/* Participants */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="section-title">👥 Participants & Blockchain</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>🏦 Escrow Address</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-hover)', wordBreak: 'break-all' }}>{grant.escrowAddress}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>🏛️ Sponsor</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grant.sponsorName || '—'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{grant.sponsorWallet ? shortAddress(grant.sponsorWallet) : '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>🎓 Admin</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grant.adminName || '—'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{grant.adminWallet ? shortAddress(grant.adminWallet) : '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>👨‍💻 Team</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grant.teamName || '—'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{grant.teamWallet ? shortAddress(grant.teamWallet) : '—'}</div>
                    </div>
                </div>
            </div>

            {/* Milestone Timeline */}
            <h2 className="section-title" style={{ marginTop: '32px' }}>🎯 Milestone Timeline</h2>
            <div className="milestone-timeline">
                {grant.milestones.map((m) => (
                    <div key={m.id} className={`milestone-item ${m.status}`}>
                        <div className="milestone-header">
                            <h4>{m.name}</h4>
                            <span className="milestone-amount">{m.amount} ALGO ({m.percentage}%)</span>
                        </div>
                        {m.description && <p className="milestone-desc">{m.description}</p>}

                        {/* Status + Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: m.submissionNote || m.rejectionNote || (m.votes && m.votes.length > 0) ? '12px' : 0 }}>
                            <span className={`badge badge-${m.status}`} style={{ textTransform: 'capitalize' }}>{m.status}</span>
                            <div className="milestone-actions">
                                {/* TEAM: Submit */}
                                {user.role === 'team' && m.status === 'pending' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowSubmitModal(m)}>📤 Submit Work</button>
                                )}
                                {/* TEAM: Resubmit rejected */}
                                {user.role === 'team' && m.status === 'rejected' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => handleResubmit(m)}>🔄 Resubmit</button>
                                )}
                                {/* ADMIN: Approve / Reject */}
                                {user.role === 'admin' && m.status === 'submitted' && (
                                    <>
                                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(m)}>✅ Approve</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setShowRejectModal(m)}>❌ Reject</button>
                                    </>
                                )}
                                {/* SPONSOR: Release funds */}
                                {user.role === 'sponsor' && m.status === 'approved' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => handleReleaseFunds(m)}>💸 Release {m.amount} ALGO</button>
                                )}
                                {/* DAO Voting (any role, when submitted) */}
                                {m.status === 'submitted' && user.role !== 'team' && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} onClick={() => handleVote(m, 'approve')}>👍</button>
                                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => handleVote(m, 'reject')}>👎</button>
                                    </div>
                                )}
                                {/* Funded: show txn */}
                                {m.status === 'funded' && m.txnId && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Txn: <span className="txn-hash">{shortAddress(m.txnId)}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Submission note */}
                        {m.submissionNote && (
                            <div style={{ padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--info)', marginBottom: '8px' }}>
                                <strong>📤 Team submission:</strong> {m.submissionNote}
                            </div>
                        )}

                        {/* Rejection note */}
                        {m.rejectionNote && (
                            <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '8px' }}>
                                <strong>❌ Rejection reason:</strong> {m.rejectionNote}
                            </div>
                        )}

                        {/* DAO Votes */}
                        {m.votes && m.votes.length > 0 && (
                            <div style={{ padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                                <strong style={{ color: 'var(--text-secondary)' }}>🗳️ Votes:</strong>{' '}
                                {m.votes.map((v, i) => (
                                    <span key={i} style={{ marginLeft: '8px', color: v.decision === 'approve' ? 'var(--success)' : 'var(--danger)' }}>
                                        {v.decision === 'approve' ? '👍' : '👎'} {v.voter}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Timestamps */}
                        {(m.submittedAt || m.approvedAt || m.fundedAt) && (
                            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {m.submittedAt && <span>📤 {new Date(m.submittedAt).toLocaleDateString()} </span>}
                                {m.approvedAt && <span>• ✅ {new Date(m.approvedAt).toLocaleDateString()} </span>}
                                {m.fundedAt && <span>• 💸 {new Date(m.fundedAt).toLocaleDateString()}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Expense Log (visible to all, editable by team) */}
            {grant.expenses && grant.expenses.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h2 className="section-title">📝 Expense Log</h2>
                    <div className="card" style={{ overflow: 'auto' }}>
                        <table className="txn-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Category</th>
                                    <th>Logged By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grant.expenses.map((exp, i) => (
                                    <tr key={i}>
                                        <td style={{ color: 'var(--text-primary)' }}>{exp.description}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--warning)' }}>{exp.amount} ALGO</td>
                                        <td><span className="badge badge-submitted">{exp.category}</span></td>
                                        <td>{exp.loggedBy}</td>
                                        <td>{new Date(exp.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 700 }}>
                                    <td style={{ color: 'var(--text-primary)' }}>Total Spent</td>
                                    <td style={{ color: 'var(--warning)' }}>{grant.expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0).toFixed(2)} ALGO</td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            {grant.transactions.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h2 className="section-title">📜 Transaction History (On-Chain)</h2>
                    <div className="card" style={{ overflow: 'auto' }}>
                        <table className="txn-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Note</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Date</th>
                                    <th>Algorand Txn ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grant.transactions.map((txn, i) => (
                                    <tr key={i}>
                                        <td><span className={`badge badge-${txn.type === 'fund' ? 'funded' : 'approved'}`}>{txn.type === 'fund' ? '💰 Fund' : '📤 Release'}</span></td>
                                        <td style={{ fontWeight: 600, color: txn.type === 'fund' ? 'var(--success)' : 'var(--accent-hover)' }}>{txn.amount} ALGO</td>
                                        <td>{txn.note}</td>
                                        <td><span className="txn-hash">{txn.from}</span></td>
                                        <td><span className="txn-hash">{txn.to}</span></td>
                                        <td>{new Date(txn.timestamp).toLocaleDateString()}</td>
                                        <td><span className="txn-hash">{txn.txnId ? shortAddress(txn.txnId) : '—'}</span></td>
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
