import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGrant } from '../utils/store';
import { createMultisigAddress } from '../utils/algorand';

export default function CreateGrant({ user, walletAddress }) {
    const navigate = useNavigate();
    const isTeam = user?.role === 'team';
    const isSponsor = user?.role === 'sponsor';
    const [form, setForm] = useState({
        name: '', description: '',
        teamName: isTeam ? (user?.name || '') : '',
        teamWallet: isTeam ? (walletAddress || '') : '',
        sponsorName: isSponsor ? (user?.name || '') : '',
        sponsorWallet: isSponsor ? (walletAddress || '') : '',
        adminName: '', adminWallet: '', totalFunding: '',
    });
    const [milestones, setMilestones] = useState([
        { name: '', description: '', percentage: 30 },
        { name: '', description: '', percentage: 30 },
        { name: '', description: '', percentage: 40 },
    ]);
    const [toast, setToast] = useState(null);

    const isAdmin = user?.role === 'admin';

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const addMilestone = () => setMilestones([...milestones, { name: '', description: '', percentage: 0 }]);
    const removeMilestone = (index) => setMilestones(milestones.filter((_, i) => i !== index));
    const updateMilestone = (index, field, value) => {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        setMilestones(updated);
    };
    const totalPercentage = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
    const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3500); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return showToast('error', 'Project name is required');
        if (!form.totalFunding || Number(form.totalFunding) <= 0) return showToast('error', 'Enter a valid funding amount');
        if (!form.teamName.trim()) return showToast('error', 'Team name is required');
        if (milestones.some(m => !m.name.trim())) return showToast('error', 'All milestones need a name');
        if (totalPercentage !== 100) return showToast('error', `Milestone percentages must total 100% (currently ${totalPercentage}%)`);

        try {
            let escrowAddress = '';
            let multisigParams = null;
            const uniqueAddresses = [...new Set([form.sponsorWallet, form.adminWallet, form.teamWallet].filter(a => a && a.length >= 58))];
            if (uniqueAddresses.length >= 2) {
                try {
                    const msig = createMultisigAddress(uniqueAddresses, 2);
                    escrowAddress = msig.address;
                    multisigParams = msig.params;
                } catch { escrowAddress = `ESCROW_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`; }
            } else {
                escrowAddress = `ESCROW_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
            }

            const totalFunding = parseFloat(form.totalFunding);
            const formattedMilestones = milestones.map((m, i) => ({
                name: m.name || `Milestone ${i + 1}`, description: m.description,
                percentage: Number(m.percentage),
                amount: ((Number(m.percentage) / 100) * totalFunding).toFixed(2),
            }));

            const grantData = { ...form, escrowAddress, multisigParams, milestones: formattedMilestones };
            if (isTeam) { grantData.status = 'proposed'; grantData.proposedBy = user.name; }
            else {
                grantData.transactions = [{
                    type: 'fund', amount: String(totalFunding),
                    note: `Initial grant funding by ${user.name}`,
                    from: form.sponsorWallet ? form.sponsorWallet.slice(0, 12) + '...' : user.name,
                    to: escrowAddress.slice(0, 12) + '...', txnId: null, timestamp: new Date().toISOString(),
                }];
            }

            const grant = createGrant(grantData);
            showToast('success', isTeam ? `Proposal "${grant.name}" submitted!` : `Grant "${grant.name}" created!`);
            setTimeout(() => navigate(`/grant/${grant.id}`), 1500);
        } catch (err) {
            console.error('Grant creation error:', err);
            showToast('error', `Failed: ${err.message || 'Unknown error'}`);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm";
    const monoInputClass = inputClass + " font-mono text-xs";

    return (
        <div className="relative z-10 p-6 lg:p-8 max-w-3xl mx-auto w-full" style={{ animation: 'fadeIn 0.4s ease' }}>
            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

            <div className="fixed top-[-10%] left-[30%] w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {isTeam ? 'Submit Project Proposal' : 'Create New Grant'}
                </h1>
                <p className="text-gray-400">
                    {isTeam ? 'Submit your project for sponsor funding — milestones define how funds are released' : 'Set up a milestone-based grant with multisig escrow on Algorand'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Details */}
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">description</span>
                        Project Details
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Project Name *</label>
                            <input type="text" className={inputClass} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Smart Campus IoT Network" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                            <textarea className={inputClass + " min-h-[100px] resize-y"} name="description" value={form.description} onChange={handleChange} placeholder="Describe the project objectives, expected outcomes..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Total Funding (ALGO) *</label>
                            <input type="number" className={inputClass} name="totalFunding" value={form.totalFunding} onChange={handleChange} placeholder="100" min="1" step="0.01" />
                        </div>
                    </div>
                </div>

                {/* Participants */}
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">group</span>
                        Participants
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Sponsor', icon: 'paid', color: 'purple', nameField: 'sponsorName', walletField: 'sponsorWallet', placeholder: 'Your name' },
                            { label: 'Admin / Faculty', icon: 'shield_person', color: 'blue', nameField: 'adminName', walletField: 'adminWallet', placeholder: 'e.g. Prof. Reddy' },
                            { label: 'Team', icon: 'groups', color: 'green', nameField: 'teamName', walletField: 'teamWallet', placeholder: 'e.g. Team Alpha' },
                        ].map((p, i) => (
                            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-2">
                                        <span className={`material-symbols-outlined text-${p.color}-400 text-[16px]`}>{p.icon}</span>
                                        {p.label} Name {p.nameField === 'teamName' && '*'}
                                    </label>
                                    <input type="text" className={inputClass} name={p.nameField} value={form[p.nameField]} onChange={handleChange} placeholder={p.placeholder} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">{p.label} Wallet</label>
                                    <input type="text" className={monoInputClass} name={p.walletField} value={form[p.walletField]} onChange={handleChange} placeholder="Algorand address" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        A 2-of-3 multisig escrow will be created from the wallet addresses above.
                    </div>
                </div>

                {/* Milestones */}
                <div className="glass-panel rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-400">flag</span>
                            Milestones
                        </h3>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${totalPercentage === 100 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {totalPercentage === 100 ? '✓' : '!'} {totalPercentage}%
                        </span>
                    </div>

                    <div className="space-y-4">
                        {milestones.map((m, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-semibold text-white">Milestone {i + 1}</span>
                                    {milestones.length > 1 && (
                                        <button type="button" onClick={() => removeMilestone(i)} className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <input type="text" className={inputClass} value={m.name} onChange={(e) => updateMilestone(i, 'name', e.target.value)} placeholder="Milestone name *" />
                                    <input type="text" className={inputClass} value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)} placeholder="What will be delivered?" />
                                    <div className="flex items-center gap-3">
                                        <input type="number" className={inputClass + " max-w-[100px]"} value={m.percentage} onChange={(e) => updateMilestone(i, 'percentage', e.target.value)} min="0" max="100" />
                                        <span className="text-sm text-gray-500">
                                            % = <span className="text-purple-400 font-semibold">{form.totalFunding ? ((Number(m.percentage) / 100) * Number(form.totalFunding)).toFixed(2) : '0.00'}</span> ALGO
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addMilestone}
                        className="mt-4 w-full py-3 rounded-xl border border-dashed border-gray-600 hover:border-purple-500/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add Milestone
                    </button>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button type="submit" disabled={totalPercentage !== 100}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold glow-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                        <span className="material-symbols-outlined">{isTeam ? 'upload_file' : 'rocket_launch'}</span>
                        {isTeam ? 'Submit Proposal' : 'Create Grant & Fund Escrow'}
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')}
                        className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-medium transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
