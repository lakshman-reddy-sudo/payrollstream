import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGrant } from '../utils/store';
import { createMultisigAddress } from '../utils/algorand';

export default function CreateGrant({ user, walletAddress }) {
    const navigate = useNavigate();
    const isEmployee = user?.role === 'employee';
    const [form, setForm] = useState({
        name: '', description: '',
        employeeName: isEmployee ? (user?.name || '') : '',
        employeeWallet: isEmployee ? (walletAddress || '') : '',
        adminName: !isEmployee ? (user?.name || '') : '',
        adminWallet: !isEmployee ? (walletAddress || '') : '',
        totalFunding: '',
        startTime: '',
        endTime: '',
    });
    const [milestones, setMilestones] = useState([
        { name: '', description: '', percentage: 30 },
        { name: '', description: '', percentage: 30 },
        { name: '', description: '', percentage: 40 },
    ]);
    const [toast, setToast] = useState(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const addMilestone = () => setMilestones([...milestones, { name: '', description: '', percentage: 0 }]);
    const removeMilestone = (i) => setMilestones(milestones.filter((_, idx) => idx !== i));
    const updateMilestone = (i, field, value) => {
        const u = [...milestones]; u[i] = { ...u[i], [field]: value }; setMilestones(u);
    };
    const totalPct = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
    const showToast = (type, msg) => { setToast({ type, message: msg }); setTimeout(() => setToast(null), 3500); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return showToast('error', 'Payroll name is required');
        if (!form.totalFunding || Number(form.totalFunding) <= 0) return showToast('error', 'Enter valid total salary');
        if (!form.employeeName.trim()) return showToast('error', 'Employee name is required');
        if (milestones.some(m => !m.name.trim())) return showToast('error', 'All milestones need a name');
        if (totalPct !== 100) return showToast('error', `Percentages must total 100% (currently ${totalPct}%)`);

        try {
            let escrowAddress = '';
            let multisigParams = null;
            const addrs = [...new Set([form.adminWallet, form.employeeWallet].filter(a => a && a.length >= 58))];
            if (addrs.length >= 2) {
                try { const ms = createMultisigAddress(addrs, 2); escrowAddress = ms.address; multisigParams = ms.params; }
                catch { escrowAddress = `ESCROW_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`; }
            } else { escrowAddress = `ESCROW_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`; }

            const total = parseFloat(form.totalFunding);
            const fmtMilestones = milestones.map((m, i) => ({
                name: m.name || `Phase ${i + 1}`, description: m.description,
                percentage: Number(m.percentage),
                amount: ((Number(m.percentage) / 100) * total).toFixed(2),
            }));

            const data = {
                ...form, teamName: form.employeeName, teamWallet: form.employeeWallet,
                sponsorName: form.adminName, sponsorWallet: form.adminWallet,
                escrowAddress, multisigParams, milestones: fmtMilestones,
                startTime: form.startTime || new Date().toISOString(),
                endTime: form.endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
            if (isEmployee) { data.status = 'proposed'; data.proposedBy = user.name; }
            else {
                data.transactions = [{
                    type: 'fund', amount: String(total),
                    note: `Initial payroll funding by ${user.name}`,
                    from: form.adminWallet ? form.adminWallet.slice(0, 12) + '…' : user.name,
                    to: escrowAddress.slice(0, 12) + '…', txnId: null,
                    timestamp: new Date().toISOString(),
                }];
            }

            const payroll = createGrant(data);
            showToast('success', `Payroll "${payroll.name}" created!`);
            setTimeout(() => navigate(`/grant/${payroll.id}`), 1200);
        } catch (err) {
            showToast('error', `Failed: ${err.message || 'Unknown error'}`);
        }
    };

    return (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 24px', animation: 'fadeUp 0.4s ease' }}>
            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div className="badge-accent" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                    {isEmployee ? 'Submit Work' : 'New Payroll'}
                </div>
                <h1 className="text-h1">{isEmployee ? 'Submit Work Report' : 'Create New Payroll'}</h1>
                <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                    {isEmployee ? 'Submit work for verification and salary release' : 'Define salary, timeline, and milestones'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Payroll Details */}
                <div className="card-flat" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>description</span>
                        Payroll Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Payroll Name *</label>
                            <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Q1 2025 Developer Salary" />
                        </div>
                        <div>
                            <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
                            <textarea className="input" name="description" value={form.description} onChange={handleChange} placeholder="Describe the payroll scope…" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Total Salary (ALGO) *</label>
                                <input type="number" className="input" name="totalFunding" value={form.totalFunding} onChange={handleChange} placeholder="100" min="1" step="0.01" />
                            </div>
                            <div>
                                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Start Date</label>
                                <input type="datetime-local" className="input" name="startTime" value={form.startTime} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>End Date</label>
                                <input type="datetime-local" className="input" name="endTime" value={form.endTime} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participants */}
                <div className="card-flat" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span>
                        Participants
                    </h3>
                    {[
                        { label: 'Admin (Employer)', nameF: 'adminName', walletF: 'adminWallet', ph: 'Admin name' },
                        { label: 'Employee', nameF: 'employeeName', walletF: 'employeeWallet', ph: 'Employee name' },
                    ].map((p, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: i === 0 ? '1rem' : 0 }}>
                            <div>
                                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>{p.label} Name</label>
                                <input className="input" name={p.nameF} value={form[p.nameF]} onChange={handleChange} placeholder={p.ph} />
                            </div>
                            <div>
                                <label className="text-caption" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>{p.label} Wallet</label>
                                <input className="input text-mono" style={{ fontSize: '0.75rem' }} name={p.walletF} value={form[p.walletF]} onChange={handleChange} placeholder="Algorand address" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Milestones */}
                <div className="card-flat" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
                            Milestones
                        </h3>
                        <span className={totalPct === 100 ? 'badge-success' : 'badge-warning'}>{totalPct === 100 ? '✓' : '!'} {totalPct}%</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {milestones.map((m, i) => (
                            <div key={i} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span className="text-caption" style={{ color: 'var(--text-primary)' }}>Phase {i + 1}</span>
                                    {milestones.length > 1 && (
                                        <button type="button" onClick={() => removeMilestone(i)} className="btn-ghost" style={{ padding: 4, color: 'var(--error)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <input className="input" value={m.name} onChange={e => updateMilestone(i, 'name', e.target.value)} placeholder="Phase name *" />
                                    <input className="input" value={m.description} onChange={e => updateMilestone(i, 'description', e.target.value)} placeholder="What will be delivered?" />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <input type="number" className="input" style={{ maxWidth: 100 }} value={m.percentage} onChange={e => updateMilestone(i, 'percentage', e.target.value)} min="0" max="100" />
                                        <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                            % = <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{form.totalFunding ? ((Number(m.percentage) / 100) * Number(form.totalFunding)).toFixed(2) : '0.00'}</span> ALGO
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addMilestone} className="btn-outline" style={{
                        marginTop: '1rem', width: '100%', padding: '10px 0', borderRadius: 'var(--radius-md)',
                        borderStyle: 'dashed',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Add Phase
                    </button>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" disabled={totalPct !== 100} className="btn-primary" style={{ flex: 1, padding: '14px 0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isEmployee ? 'upload_file' : 'stream'}</span>
                        {isEmployee ? 'Submit Work' : 'Create Payroll'}
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')} className="btn-outline" style={{ padding: '14px 28px' }}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
