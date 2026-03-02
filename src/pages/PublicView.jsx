import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats } from '../utils/store';
import { shortAddress, getExplorerTxnUrl, getExplorerAddrUrl } from '../utils/algorand';

export default function PublicView() {
    const [grants, setGrants] = useState([]);
    const [expanded, setExpanded] = useState(null);
    useEffect(() => { setGrants(getGrants()); }, []);

    const toggle = (id) => setExpanded(expanded === id ? null : id);

    const totalFunding = grants.reduce((s, g) => s + (parseFloat(g.totalFunding) || 0), 0);
    const totalGrants = grants.length;
    const totalMilestones = grants.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const totalFunded = grants.reduce((s, g) => s + (g.milestones?.filter(m => m.status === 'funded').length || 0), 0);

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Public Header */}
            <div className="nav-blur sticky top-0 z-50 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-xl">token</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">GrantChain</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Public Dashboard</span>
                    </div>
                    <Link to="/login" className="no-underline flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all">
                        <span className="material-symbols-outlined text-[18px]">login</span> Login
                    </Link>
                </div>
            </div>

            {/* Hero */}
            <div className="text-center py-16 px-4 relative">
                <div className="absolute top-0 left-[30%] w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
                <h1 className="text-4xl font-extrabold text-white mb-4 relative z-10">
                    Transparent <span className="text-gradient">Grant Tracking</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-6 relative z-10">
                    All student project grants tracked on the Algorand blockchain. Fully transparent and verifiable.
                </p>
                <div className="flex gap-3 justify-center relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <span className="material-symbols-outlined text-[14px]">link</span> Algorand
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="material-symbols-outlined text-[14px]">verified</span> TestNet Verified
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Active Grants', value: totalGrants, icon: 'inventory_2', color: 'purple' },
                        { label: 'Total Funding', value: `${totalFunding.toFixed(1)} ALGO`, icon: 'savings', color: 'cyan' },
                        { label: 'Milestones', value: totalMilestones, icon: 'flag', color: 'blue' },
                        { label: 'Milestones Funded', value: totalFunded, icon: 'check_circle', color: 'green' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className={`material-symbols-outlined text-5xl text-${s.color}-400`}>{s.icon}</span>
                            </div>
                            <p className="text-gray-400 text-sm font-medium mb-1">{s.label}</p>
                            <h2 className="text-2xl font-bold text-white">{s.value}</h2>
                        </div>
                    ))}
                </div>

                {/* Live Feed Header */}
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">live_tv</span>
                        Transparency Feed
                    </h2>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-400 font-medium">Live</span>
                    </div>
                </div>

                {grants.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-6xl text-gray-600 mb-4 block">inbox</span>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No grants yet</h3>
                        <p className="text-gray-500">Grants will appear here once created by sponsors.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {grants.map(grant => {
                            const stats = getGrantStats(grant);
                            const isOpen = expanded === grant.id;
                            return (
                                <div key={grant.id} className="glass-panel rounded-2xl p-6 cursor-pointer hover:border-purple-500/30 transition-all"
                                    onClick={() => toggle(grant.id)}>
                                    {/* Summary */}
                                    <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">{grant.name}</h3>
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">{grant.status}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{grant.description}</p>
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">groups</span>{grant.teamName || 'Team'}</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">paid</span>{grant.sponsorName || 'Sponsor'}</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{new Date(grant.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">{stats.totalFunding} <span className="text-sm font-normal text-gray-400">ALGO</span></div>
                                            <div className="text-xs text-gray-500">{stats.progressPercent}% complete</div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="w-full h-2 rounded-full progress-bar-bg overflow-hidden mb-2">
                                        <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${stats.progressPercent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>{stats.funded}/{stats.totalMilestones} milestones funded</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">{isOpen ? 'expand_less' : 'expand_more'}</span>
                                            {isOpen ? 'Collapse' : 'Expand'}
                                        </span>
                                    </div>

                                    {/* Expanded */}
                                    {isOpen && (
                                        <div className="mt-5 pt-5 border-t border-white/10 space-y-6" onClick={e => e.stopPropagation()}>
                                            {/* Escrow */}
                                            {grant.escrowAddress && (
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-dashed border-white/10">
                                                    <span className="material-symbols-outlined text-gray-500 text-sm">lock</span>
                                                    <span className="text-xs text-gray-500">Escrow:</span>
                                                    <span className="text-xs font-mono text-gray-300 truncate flex-1">{grant.escrowAddress}</span>
                                                    {grant.escrowAddress.length === 58 && (
                                                        <a href={getExplorerAddrUrl(grant.escrowAddress)} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 no-underline hover:text-indigo-300 flex items-center gap-0.5">
                                                            Explorer <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Milestones */}
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-indigo-400 text-[18px]">flag</span> Milestones
                                                </h4>
                                                <div className="space-y-2">
                                                    {grant.milestones.map(m => {
                                                        const statusColors = { funded: 'emerald', approved: 'blue', submitted: 'amber', pending: 'slate', rejected: 'red' };
                                                        const sc = statusColors[m.status] || 'slate';
                                                        return (
                                                            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex-wrap gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`w-2 h-2 rounded-full bg-${sc}-500`}></span>
                                                                    <span className="text-sm text-white font-medium">{m.name}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-${sc}-500/10 text-${sc}-400 border border-${sc}-500/20 capitalize`}>{m.status}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm text-purple-400 font-semibold">{m.amount} ALGO</span>
                                                                    {m.txnId && (
                                                                        <a href={getExplorerTxnUrl(m.txnId)} target="_blank" rel="noreferrer"
                                                                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] no-underline border border-emerald-500/20 font-mono hover:bg-emerald-500/20 transition-colors">
                                                                            <span className="material-symbols-outlined text-[12px]">verified</span>
                                                                            {shortAddress(m.txnId)}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Transactions */}
                                            {grant.transactions && grant.transactions.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-purple-400 text-[18px]">history_edu</span> On-Chain Transactions
                                                    </h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="text-xs font-semibold text-gray-500 border-b border-gray-700">
                                                                    <th className="pb-2 pl-2">Type</th><th className="pb-2">Amount</th><th className="pb-2">Note</th><th className="pb-2">Date</th><th className="pb-2 pr-2 text-right">Txn</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-sm">
                                                                {grant.transactions.map((txn, i) => (
                                                                    <tr key={i} className="hover:bg-white/5 transition-colors border-b border-gray-800/50">
                                                                        <td className="py-2.5 pl-2">
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${txn.type === 'fund' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                                                {txn.type === 'fund' ? 'Fund' : 'Release'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2.5 text-white font-medium">{txn.amount} ALGO</td>
                                                                        <td className="py-2.5 text-gray-400 max-w-[200px] truncate">{txn.note}</td>
                                                                        <td className="py-2.5 text-gray-400">{new Date(txn.timestamp).toLocaleDateString()}</td>
                                                                        <td className="py-2.5 pr-2 text-right">
                                                                            {txn.txnId ? (
                                                                                <a href={getExplorerTxnUrl(txn.txnId)} target="_blank" rel="noreferrer" className="text-xs font-mono text-indigo-400 no-underline hover:text-indigo-300">
                                                                                    {shortAddress(txn.txnId)} ↗
                                                                                </a>
                                                                            ) : <span className="text-xs text-gray-600">—</span>}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-16 pb-6">
                    <p className="text-gray-600 text-sm">GrantChain — Transparent Grant & Fund Tracking on <strong className="text-gray-400">Algorand</strong></p>
                    <p className="text-gray-700 text-xs mt-1">All transactions are verifiable on the Algorand TestNet blockchain</p>
                </div>
            </div>
        </div>
    );
}
