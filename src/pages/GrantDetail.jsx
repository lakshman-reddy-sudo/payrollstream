import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGrant, updateGrant, updateMilestone, addTransaction, addExpense, addVote, getGrantStats } from '../utils/store';
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
    const [fundAmount, setFundAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [processing, setProcessing] = useState(false);
    const [liveBalance, setLiveBalance] = useState(null);
    const [lastTxnId, setLastTxnId] = useState(null);
    const [showReleaseLora, setShowReleaseLora] = useState(null);
    const [loraTxnId, setLoraTxnId] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [txnVerified, setTxnVerified] = useState(null);
    const balanceIntervalRef = useRef(null);

    const refresh = () => setGrant(getGrant(id));
    useEffect(() => { refresh(); }, [id]);

    useEffect(() => {
        if (grant?.teamWallet && !recipientAddress) setRecipientAddress(grant.teamWallet);
    }, [grant?.teamWallet]);

    useEffect(() => {
        if (!walletAddress) { setLiveBalance(null); return; }
        const fetchBalance = () => { getBalance(walletAddress).then(setLiveBalance).catch(() => { }); };
        fetchBalance();
        balanceIntervalRef.current = setInterval(fetchBalance, 15000);
        return () => { if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current); };
    }, [walletAddress]);

    const showToastMsg = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 4500); };

    if (!grant) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-600 mb-4 block">search_off</span>
                    <h3 className="text-xl font-bold text-gray-400 mb-4">Grant not found</h3>
                    <Link to="/dashboard" className="no-underline bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const stats = getGrantStats(grant);
    const inputClass = "w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm";

    // ======== Handlers (preserved exactly) ========
    const handleSubmit = (milestone) => {
        if (!submitNote.trim()) return showToastMsg('error', 'Please describe what you completed');
        updateMilestone(grant.id, milestone.id, { status: 'submitted', submittedAt: new Date().toISOString(), submittedBy: user.name, submissionNote: submitNote });
        refresh(); setShowSubmitModal(null); setSubmitNote('');
        showToastMsg('success', `"${milestone.name}" submitted for review!`);
    };
    const handleApprove = (milestone) => {
        addVote(grant.id, milestone.id, { voter: user.name, decision: 'approve' });
        updateMilestone(grant.id, milestone.id, { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user.name });
        refresh(); showToastMsg('success', `"${milestone.name}" approved!`);
    };
    const handleReject = (milestone) => {
        if (!rejectNote.trim()) return showToastMsg('error', 'Please provide a reason');
        addVote(grant.id, milestone.id, { voter: user.name, decision: 'reject' });
        updateMilestone(grant.id, milestone.id, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectionNote: rejectNote });
        refresh(); setShowRejectModal(null); setRejectNote('');
        showToastMsg('error', `"${milestone.name}" rejected.`);
    };
    const handleReleaseFunds = (milestone) => {
        setShowReleaseLora(milestone); setLoraTxnId(''); setTxnVerified(null);
        window.open(getLoraComposeUrl(), '_blank');
    };
    const handleSubmitReleaseTxn = async () => {
        if (!loraTxnId.trim()) return showToastMsg('error', 'Paste the transaction ID from Lora');
        const milestone = showReleaseLora; setVerifying(true);
        try {
            const result = await verifyTransaction(loraTxnId.trim());
            if (result && result.confirmed) {
                setTxnVerified(result);
                updateMilestone(grant.id, milestone.id, { status: 'funded', fundedAt: new Date().toISOString(), txnId: loraTxnId.trim() });
                addTransaction(grant.id, { type: 'release', amount: String(result.amount || parseFloat(milestone.amount)), note: `MILESTONE: ${milestone.name}`, from: result.sender || walletAddress || 'Sponsor', to: result.receiver || grant.teamWallet || 'Team', txnId: loraTxnId.trim(), onChain: true, timestamp: new Date().toISOString() });
                refresh(); showToastMsg('success', `Milestone "${milestone.name}" funded! Txn verified on-chain.`);
                setTimeout(() => { setShowReleaseLora(null); setLoraTxnId(''); setTxnVerified(null); }, 2000);
            } else { showToastMsg('error', 'Transaction not found on-chain. Try again in a few seconds.'); }
        } catch (err) { showToastMsg('error', `Verification failed: ${err.message}`); }
        setVerifying(false);
    };
    const handleFundGrant = async () => {
        if (!loraTxnId.trim()) return showToastMsg('error', 'Paste the transaction ID from Lora');
        const amount = parseFloat(fundAmount); setVerifying(true);
        try {
            const result = await verifyTransaction(loraTxnId.trim());
            if (result && result.confirmed) {
                setTxnVerified(result);
                addTransaction(grant.id, { type: 'fund', amount: String(result.amount || amount || 0), note: `Grant funding via Lora`, from: result.sender || 'Sponsor', to: result.receiver || grant.teamWallet || 'Team', txnId: loraTxnId.trim(), onChain: true, timestamp: new Date().toISOString() });
                const newTotal = parseFloat(grant.totalFunding || 0) + (result.amount || amount || 0);
                updateGrant(grant.id, { totalFunding: String(newTotal), status: 'active' });
                refresh(); showToastMsg('success', `Grant funded! Txn verified on-chain.`);
                setTimeout(() => { setShowFundModal(false); setLoraTxnId(''); setFundAmount(''); setTxnVerified(null); }, 2000);
            } else { showToastMsg('error', 'Transaction not found on-chain.'); }
        } catch (err) { showToastMsg('error', `Verification failed: ${err.message}`); }
        setVerifying(false);
    };
    const handleResubmit = (milestone) => {
        updateMilestone(grant.id, milestone.id, { status: 'pending', rejectedAt: null, rejectionNote: null, submittedAt: null, submittedBy: null, submissionNote: null, votes: [] });
        refresh(); showToastMsg('info', `"${milestone.name}" reset. You can submit again.`);
    };
    const handleVote = (milestone, decision) => {
        addVote(grant.id, milestone.id, { voter: user.name, decision });
        refresh(); showToastMsg('success', `Vote "${decision}" recorded.`);
    };
    const handleLogExpense = () => {
        if (!expense.description.trim() || !expense.amount) return showToastMsg('error', 'Fill in expense details');
        addExpense(grant.id, { ...expense, loggedBy: user.name });
        refresh(); setShowExpenseModal(false); setExpense({ description: '', amount: '', category: 'General' });
        showToastMsg('success', 'Expense logged.');
    };

    const statusConfig = {
        pending: { icon: 'lock', color: 'slate', border: 'border-slate-600', bg: 'bg-slate-800', label: 'PENDING' },
        submitted: { icon: 'pending', color: 'amber', border: 'border-amber-500', bg: 'bg-amber-500/20', label: 'SUBMITTED' },
        approved: { icon: 'check_circle', color: 'blue', border: 'border-blue-500', bg: 'bg-blue-500/20', label: 'APPROVED' },
        funded: { icon: 'check', color: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-500/20', label: 'FUNDED' },
        rejected: { icon: 'cancel', color: 'red', border: 'border-red-500', bg: 'bg-red-500/20', label: 'REJECTED' },
    };

    // ======== MODAL COMPONENT ========
    const Modal = ({ show, onClose, title, icon, children, maxW = 'max-w-lg' }) => {
        if (!show) return null;
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className={`glass-panel rounded-2xl p-6 ${maxW} w-full shadow-2xl`} onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">{icon}</span>
                        {title}
                    </h2>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto" style={{ animation: 'fadeIn 0.4s ease' }}>
            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

            {/* Verifying Overlay */}
            {verifying && (
                <div className="modal-overlay" style={{ zIndex: 300 }}>
                    <div className="glass-panel rounded-2xl p-8 text-center max-w-sm">
                        <div className="spinner mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold text-white mb-2">Verifying Transaction...</h3>
                        <p className="text-gray-400 text-sm">Checking Algorand TestNet</p>
                    </div>
                </div>
            )}

            {/* Submit Modal */}
            <Modal show={showSubmitModal} onClose={() => setShowSubmitModal(null)} title="Submit Milestone" icon="upload_file">
                <p className="text-gray-400 text-sm mb-4">Submitting: <strong className="text-white">{showSubmitModal?.name}</strong> ({showSubmitModal?.amount} ALGO)</p>
                <label className="block text-sm font-medium text-gray-400 mb-2">Describe what you completed *</label>
                <textarea className={inputClass + " min-h-[100px] mb-4"} value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Describe deliverables, attach links..." />
                <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm" onClick={() => handleSubmit(showSubmitModal)}>Submit for Review</button>
                    <button className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm" onClick={() => setShowSubmitModal(null)}>Cancel</button>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(null)} title="Reject Milestone" icon="cancel">
                <p className="text-gray-400 text-sm mb-4">Rejecting: <strong className="text-white">{showRejectModal?.name}</strong></p>
                <label className="block text-sm font-medium text-gray-400 mb-2">Reason for rejection *</label>
                <textarea className={inputClass + " min-h-[80px] mb-4"} value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Explain what needs improvement..." />
                <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm" onClick={() => handleReject(showRejectModal)}>Reject</button>
                    <button className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm" onClick={() => setShowRejectModal(null)}>Cancel</button>
                </div>
            </Modal>

            {/* Expense Modal */}
            <Modal show={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Log Expense" icon="receipt_long">
                <div className="space-y-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description *</label>
                        <input className={inputClass} value={expense.description} onChange={e => setExpense({ ...expense, description: e.target.value })} placeholder="e.g. Raspberry Pi × 5 units" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Amount (ALGO) *</label>
                        <input type="number" className={inputClass} value={expense.amount} onChange={e => setExpense({ ...expense, amount: e.target.value })} placeholder="15" min="0.01" step="0.01" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                        <select className={inputClass} value={expense.category} onChange={e => setExpense({ ...expense, category: e.target.value })}>
                            <option>General</option><option>Hardware</option><option>Software</option>
                            <option>Services</option><option>Travel</option><option>Other</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm" onClick={handleLogExpense}>Log Expense</button>
                    <button className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                </div>
            </Modal>

            {/* Fund Grant Modal */}
            <Modal show={showFundModal} onClose={() => setShowFundModal(false)} title="Fund Grant" icon="payments" maxW="max-w-xl">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-4 space-y-1">
                    <p><strong>Step 1:</strong> Click to open <strong>Lora Transaction Composer</strong></p>
                    <p><strong>Step 2:</strong> Create a payment transaction (receiver + amount)</p>
                    <p><strong>Step 3:</strong> Sign & submit, then paste Txn ID below</p>
                </div>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold mb-4 flex items-center justify-center gap-2" onClick={() => window.open(getLoraComposeUrl(), '_blank')}>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open Lora Composer
                </button>
                {grant.teamWallet && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
                        <span className="text-xs text-gray-500">Send to Team:</span>
                        <div className="font-mono text-xs text-purple-400 break-all select-all mt-1">{grant.teamWallet}</div>
                    </div>
                )}
                <label className="block text-sm font-medium text-gray-400 mb-2">Paste Transaction ID *</label>
                <input type="text" className={inputClass + " font-mono text-xs mb-4"} value={loraTxnId} onChange={e => { setLoraTxnId(e.target.value); setTxnVerified(null); }} placeholder="Paste transaction ID here..." />
                {txnVerified && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
                        ✓ Verified! {txnVerified.amount} ALGO from {shortAddress(txnVerified.sender)} → {shortAddress(txnVerified.receiver)}
                    </div>
                )}
                <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm disabled:opacity-50" onClick={handleFundGrant} disabled={verifying || !loraTxnId.trim()}>
                        {verifying ? 'Verifying...' : 'Verify & Submit'}
                    </button>
                    <button className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm" onClick={() => { setShowFundModal(false); setLoraTxnId(''); setTxnVerified(null); }}>Cancel</button>
                </div>
            </Modal>

            {/* Release via Lora Modal */}
            <Modal show={showReleaseLora} onClose={() => setShowReleaseLora(null)} title={`Release Funds — ${showReleaseLora?.name || ''}`} icon="send_money" maxW="max-w-xl">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-4">
                    Send <strong>{showReleaseLora?.amount} ALGO</strong> to the team wallet using Lora, then paste the transaction ID below.
                </div>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold mb-4 flex items-center justify-center gap-2" onClick={() => window.open(getLoraComposeUrl(), '_blank')}>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open Lora Composer
                </button>
                {grant.teamWallet && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
                        <div className="text-xs text-gray-500 mb-1">Receiver:</div>
                        <div className="font-mono text-xs text-purple-400 break-all select-all">{grant.teamWallet}</div>
                    </div>
                )}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
                    <span className="text-xs text-gray-500">Amount:</span> <span className="text-white font-bold ml-2">{showReleaseLora?.amount} ALGO</span>
                </div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Paste Transaction ID *</label>
                <input type="text" className={inputClass + " font-mono text-xs mb-4"} value={loraTxnId} onChange={e => { setLoraTxnId(e.target.value); setTxnVerified(null); }} placeholder="Paste transaction ID here..." />
                {txnVerified && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
                        ✓ Verified! {txnVerified.amount} ALGO • Round #{txnVerified.confirmedRound}
                    </div>
                )}
                <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm disabled:opacity-50" onClick={handleSubmitReleaseTxn} disabled={verifying || !loraTxnId.trim()}>
                        {verifying ? 'Verifying...' : 'Verify & Submit'}
                    </button>
                    <button className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm" onClick={() => { setShowReleaseLora(null); setLoraTxnId(''); setTxnVerified(null); }}>Cancel</button>
                </div>
            </Modal>

            {/* Breadcrumb */}
            <Link to="/dashboard" className="text-gray-500 hover:text-white text-sm no-underline flex items-center gap-1 mb-6 w-max transition-colors">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
            </Link>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Grant Info */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-8xl">token</span>
                        </div>
                        <div className="flex items-start justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize`}>{grant.status || 'Active'}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">{grant.name}</h1>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{grant.description}</p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-gray-400 mb-1">Total Grant</p>
                                <p className="text-xl font-bold text-white">{stats.totalFunding} <span className="text-sm font-normal text-gray-400">ALGO</span></p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-gray-400 mb-1">Disbursed</p>
                                <p className="text-xl font-bold text-indigo-400">{stats.releasedAmount} <span className="text-sm font-normal text-gray-400">ALGO</span></p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Progress</span>
                                <span className="text-white font-semibold">{stats.progressPercent}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full progress-bar-bg overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${stats.progressPercent}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{stats.funded}/{stats.totalMilestones} milestones funded</p>
                        </div>

                        {/* Participants */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Participants</h3>
                            {[
                                { name: grant.sponsorName, role: 'Sponsor', wallet: grant.sponsorWallet, gradient: 'from-blue-500 to-cyan-400', letter: 'S' },
                                { name: grant.adminName, role: 'Admin', wallet: grant.adminWallet, gradient: 'from-purple-500 to-pink-400', letter: 'A' },
                                { name: grant.teamName, role: 'Team', wallet: grant.teamWallet, gradient: 'from-orange-500 to-amber-400', letter: 'T' },
                            ].map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${p.gradient} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>{p.letter}</div>
                                        <div>
                                            <p className="text-sm text-white font-medium">{p.name || '—'}</p>
                                            <p className="text-xs text-gray-500">{p.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-gray-500 group-hover:text-indigo-400 transition-colors">{p.wallet ? shortAddress(p.wallet) : '—'}</span>
                                </div>
                            ))}
                        </div>

                        {/* Escrow */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-xs text-gray-500 mb-2">Multisig Escrow Address</p>
                            <div className="flex items-center gap-2 p-2 rounded bg-black/20 border border-dashed border-white/10">
                                <span className="material-symbols-outlined text-gray-500 text-sm">lock</span>
                                <span className="text-xs font-mono text-gray-300 truncate flex-1">{grant.escrowAddress}</span>
                            </div>
                            {liveBalance !== null && (
                                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    Wallet: {liveBalance.toFixed(2)} ALGO
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-6 flex gap-3">
                            {user.role === 'sponsor' && (
                                <button onClick={() => setShowFundModal(true)} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 glow-button">
                                    <span className="material-symbols-outlined text-[18px]">payments</span> Fund Grant
                                </button>
                            )}
                            {user.role === 'team' && (
                                <button onClick={() => setShowExpenseModal(true)} className="flex-1 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span> Log Expense
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Timeline + Audit */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Proposed Banner */}
                    {grant.status === 'proposed' && (
                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-yellow-500 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-1">Proposal Awaiting Funding</h4>
                                <p className="text-sm text-gray-400">Submitted by <strong className="text-white">{grant.proposedBy || grant.teamName}</strong></p>
                            </div>
                            {user.role === 'sponsor' && (
                                <button onClick={() => { setFundAmount('1'); setShowFundModal(true); }} className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm">
                                    Fund This Proposal
                                </button>
                            )}
                        </div>
                    )}

                    {/* Milestone Timeline */}
                    <div className="glass-panel rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-400">timeline</span>
                                Milestone Timeline
                            </h2>
                        </div>

                        <div className="relative pl-4">
                            <div className="timeline-line bg-gradient-to-b from-emerald-500 via-indigo-500 to-gray-700"></div>

                            {grant.milestones.map((m) => {
                                const sc = statusConfig[m.status] || statusConfig.pending;
                                return (
                                    <div key={m.id} className="relative flex gap-6 mb-10">
                                        <div className="flex-shrink-0 z-10 mt-1">
                                            <div className={`w-12 h-12 rounded-full ${sc.bg} border-2 ${sc.border} flex items-center justify-center shadow-lg`}>
                                                <span className={`material-symbols-outlined text-${sc.color}-400`}>{sc.icon}</span>
                                            </div>
                                        </div>
                                        <div className={`flex-1 bg-white/5 rounded-xl p-5 border ${sc.border}/30 hover:border-opacity-50 transition-colors ${m.status === 'pending' ? 'opacity-60' : ''}`}>
                                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{m.name}</h3>
                                                    <p className={`text-xs font-mono mt-1 text-${sc.color}-400`}>{sc.label} • {m.amount} ALGO ({m.percentage}%)</p>
                                                </div>
                                            </div>
                                            {m.description && <p className="text-sm text-gray-400 mb-4">{m.description}</p>}

                                            {/* Submission note */}
                                            {m.submissionNote && (
                                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-3">
                                                    <strong>Team submission:</strong> {m.submissionNote}
                                                </div>
                                            )}
                                            {/* Rejection note */}
                                            {m.rejectionNote && (
                                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-3">
                                                    <strong>Rejection reason:</strong> {m.rejectionNote}
                                                </div>
                                            )}
                                            {/* Votes */}
                                            {m.votes && m.votes.length > 0 && (
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm mb-3">
                                                    <strong className="text-gray-500">Votes:</strong>
                                                    {m.votes.map((v, i) => (
                                                        <span key={i} className={`ml-2 ${v.decision === 'approve' ? 'text-green-400' : 'text-red-400'}`}>
                                                            {v.decision === 'approve' ? '👍' : '👎'} {v.voter}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-3 flex-wrap mt-4">
                                                {user.role === 'team' && m.status === 'pending' && (
                                                    <button onClick={() => setShowSubmitModal(m)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px]">upload_file</span> Submit Work
                                                    </button>
                                                )}
                                                {user.role === 'team' && m.status === 'rejected' && (
                                                    <button onClick={() => handleResubmit(m)} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-all">
                                                        <span className="material-symbols-outlined text-[16px]">refresh</span> Resubmit
                                                    </button>
                                                )}
                                                {user.role === 'admin' && m.status === 'submitted' && (
                                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 w-full">
                                                        <p className="text-sm text-amber-200 mb-3 flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-sm">info</span> Submission requires review
                                                        </p>
                                                        <div className="flex gap-3">
                                                            <button onClick={() => handleApprove(m)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm">check_circle</span> Approve
                                                            </button>
                                                            <button onClick={() => setShowRejectModal(m)} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm">cancel</span> Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {user.role === 'sponsor' && m.status === 'approved' && (
                                                    <button onClick={() => handleReleaseFunds(m)} className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                                        Release {m.amount} ALGO via Lora
                                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                    </button>
                                                )}
                                                {m.status === 'submitted' && user.role !== 'team' && user.role !== 'admin' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleVote(m, 'approve')} className="px-3 py-1.5 rounded bg-green-500/10 text-green-400 text-sm border border-green-500/20 hover:bg-green-500/20">👍</button>
                                                        <button onClick={() => handleVote(m, 'reject')} className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 text-sm border border-red-500/20 hover:bg-red-500/20">👎</button>
                                                    </div>
                                                )}
                                                {m.status === 'funded' && m.txnId && (
                                                    <a href={getExplorerTxnUrl(m.txnId)} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 no-underline font-mono hover:bg-emerald-500/20 transition-colors">
                                                        <span className="material-symbols-outlined text-[14px]">verified</span>
                                                        Verified: {shortAddress(m.txnId)} <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                    </a>
                                                )}
                                            </div>

                                            {/* Dates */}
                                            {(m.submittedAt || m.approvedAt || m.fundedAt) && (
                                                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500 flex flex-wrap gap-3">
                                                    {m.submittedAt && <span>Submitted {new Date(m.submittedAt).toLocaleDateString()}</span>}
                                                    {m.approvedAt && <span>• Approved {new Date(m.approvedAt).toLocaleDateString()}</span>}
                                                    {m.fundedAt && <span>• Funded {new Date(m.fundedAt).toLocaleDateString()}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Expense Log */}
                    {grant.expenses && grant.expenses.length > 0 && (
                        <div className="glass-panel rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-400">receipt_long</span>
                                Expense Log
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-700">
                                            <th className="pb-3 pl-2">Description</th><th className="pb-3">Amount</th><th className="pb-3">Category</th><th className="pb-3">By</th><th className="pb-3 pr-2 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {grant.expenses.map((exp, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors border-b border-gray-800/50">
                                                <td className="py-3 pl-2 text-white">{exp.description}</td>
                                                <td className="py-3 text-yellow-400 font-bold">{exp.amount} ALGO</td>
                                                <td className="py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">{exp.category}</span></td>
                                                <td className="py-3 text-gray-400">{exp.loggedBy}</td>
                                                <td className="py-3 pr-2 text-right text-gray-400">{new Date(exp.timestamp).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold">
                                            <td className="py-3 pl-2 text-white">Total Spent</td>
                                            <td className="py-3 text-yellow-400">{grant.expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0).toFixed(2)} ALGO</td>
                                            <td colSpan={3}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Transaction History */}
                    {grant.transactions.length > 0 && (
                        <div className="glass-panel rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-400">history_edu</span>
                                On-Chain Audit Trail
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-700">
                                            <th className="pb-3 pl-2">Type</th><th className="pb-3">Txn ID</th><th className="pb-3">Note</th><th className="pb-3">Amount</th><th className="pb-3 pr-2 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {grant.transactions.map((txn, i) => (
                                            <tr key={i} className="group hover:bg-white/5 transition-colors border-b border-gray-800/50">
                                                <td className="py-4 pl-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${txn.type === 'fund' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{txn.type === 'fund' ? 'payments' : 'send_money'}</span>
                                                        {txn.type === 'fund' ? 'Fund' : 'Release'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    {txn.txnId ? (
                                                        <a href={getExplorerTxnUrl(txn.txnId)} target="_blank" rel="noreferrer" className="text-xs font-mono text-indigo-400 hover:text-indigo-300 no-underline flex items-center gap-1">
                                                            {shortAddress(txn.txnId)} <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                        </a>
                                                    ) : <span className="text-xs text-gray-600">—</span>}
                                                </td>
                                                <td className="py-4 text-gray-300 max-w-xs truncate">{txn.note}</td>
                                                <td className="py-4 text-white font-medium">{txn.amount} ALGO</td>
                                                <td className="py-4 pr-2 text-right text-gray-400">{new Date(txn.timestamp).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
