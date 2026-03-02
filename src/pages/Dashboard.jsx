import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats } from '../utils/store';
import { shortAddress, getExplorerTxnUrl } from '../utils/algorand';

export default function Dashboard({ user, walletAddress }) {
    const [grants, setGrants] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        setGrants(getGrants());
    }, []);

    const filteredGrants = grants.filter(g => {
        const matchesSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
        const stats = getGrantStats(g);
        const matchesFilter = filter === 'all' ||
            (filter === 'active' && g.status === 'active') ||
            (filter === 'completed' && stats.progressPercent === 100) ||
            (filter === 'draft' && g.status === 'proposed');
        return matchesSearch && matchesFilter;
    });

    const allStats = grants.reduce(
        (acc, g) => {
            const s = getGrantStats(g);
            acc.totalFunding += s.totalFunding;
            acc.released += s.releasedAmount;
            acc.remaining += s.remainingAmount;
            acc.totalGrants += 1;
            acc.totalMilestones += s.totalMilestones;
            acc.fundedMilestones += s.funded;
            acc.pendingApprovals += s.submitted;
            return acc;
        },
        { totalFunding: 0, released: 0, remaining: 0, totalGrants: 0, totalMilestones: 0, fundedMilestones: 0, pendingApprovals: 0 }
    );

    const getActionItems = () => {
        const items = [];
        grants.forEach(g => {
            g.milestones.forEach(m => {
                if (user.role === 'admin' && m.status === 'submitted') items.push({ grant: g, milestone: m, action: 'Review & Approve', icon: 'fact_check' });
                if (user.role === 'sponsor' && m.status === 'approved') items.push({ grant: g, milestone: m, action: 'Release Funds', icon: 'send_money' });
                if (user.role === 'team' && m.status === 'pending') items.push({ grant: g, milestone: m, action: 'Submit Work', icon: 'upload_file' });
                if (user.role === 'team' && m.status === 'rejected') items.push({ grant: g, milestone: m, action: 'Resubmit', icon: 'refresh' });
            });
        });
        return items;
    };
    const actionItems = getActionItems();

    const statusIcons = { active: 'rocket_launch', proposed: 'edit_document', completed: 'check_circle' };
    const statusColors = { active: 'cyan', proposed: 'yellow', completed: 'green' };
    const roleIcons = { sponsor: 'science', admin: 'code', team: 'forest' };
    const roleColors = { sponsor: 'indigo', admin: 'purple', team: 'green' };

    return (
        <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto w-full" style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Ambient blurs */}
            <div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage your decentralized grants on Algorand</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-[#141522] border border-gray-700 rounded-lg text-sm text-gray-300">
                        <span className="material-symbols-outlined text-green-400 text-lg">wifi</span>
                        <span>TestNet</span>
                    </div>
                    {(user.role === 'sponsor' || user.role === 'admin') && (
                        <Link to="/create" className="no-underline bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-purple-900/30 flex items-center text-sm">
                            <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
                            Create Grant
                        </Link>
                    )}
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-cyan-400">rocket_launch</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Active Grants</p>
                    <h2 className="text-3xl font-bold text-white">{allStats.totalGrants}</h2>
                    <div className="mt-4 flex items-center text-xs text-green-400 bg-green-400/10 w-max px-2 py-1 rounded-full">
                        <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                        {allStats.fundedMilestones} milestones funded
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-purple-400">pending_actions</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Pending Actions</p>
                    <h2 className="text-3xl font-bold text-white">{actionItems.length}</h2>
                    <div className="mt-4 flex items-center text-xs text-yellow-400 bg-yellow-400/10 w-max px-2 py-1 rounded-full">
                        <span className="material-symbols-outlined text-sm mr-1">{actionItems.length > 0 ? 'warning' : 'check'}</span>
                        {actionItems.length > 0 ? 'Action required' : 'All clear'}
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-indigo-400">savings</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Total Funded</p>
                    <h2 className="text-3xl font-bold text-white">{allStats.totalFunding} <span className="text-lg text-gray-500 font-normal">ALGO</span></h2>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <span className="material-symbols-outlined text-sm mr-1">payments</span>
                        {allStats.released} ALGO released
                    </div>
                </div>
            </div>

            {/* Action Items */}
            {actionItems.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-400">bolt</span>
                        Your Action Items
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {actionItems.slice(0, 6).map((item, i) => (
                            <Link key={i} to={`/grant/${item.grant.id}`} className="no-underline">
                                <div className="glass-card p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-purple-500/50 hover:border-l-purple-400 transition-all">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-white font-semibold text-sm">{item.action}</div>
                                        <div className="text-gray-400 text-xs truncate">{item.milestone.name} • {item.grant.name}</div>
                                        <div className="text-purple-400 text-xs font-mono mt-0.5">{item.milestone.amount} ALGO</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full sm:w-96">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500">search</span>
                    <input
                        className="w-full bg-[#141522] border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block pl-10 p-2.5 placeholder-gray-500 outline-none"
                        placeholder="Search grants by name..."
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex space-x-3 w-full sm:w-auto overflow-x-auto">
                    {['all', 'active', 'completed', 'draft'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap font-medium transition-colors ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#141522] border border-gray-700 hover:bg-[#1E2532] text-gray-300'
                                }`}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grant Cards */}
            {filteredGrants.length === 0 ? (
                <div className="text-center py-20">
                    <span className="material-symbols-outlined text-6xl text-gray-600 mb-4 block">inbox</span>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No grants found</h3>
                    <p className="text-gray-500 mb-6">{search ? 'Try a different search term' : 'Create your first grant to get started'}</p>
                    {user.role === 'sponsor' && (
                        <Link to="/create" className="no-underline bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                            <span className="material-symbols-outlined">add</span> Create Grant
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGrants.map((grant) => {
                        const stats = getGrantStats(grant);
                        const sColor = statusColors[grant.status] || 'gray';
                        return (
                            <Link key={grant.id} to={`/grant/${grant.id}`} className="no-underline">
                                <article className="glass-panel rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-colors group p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg bg-${sColor}-900/50 flex items-center justify-center text-${sColor}-400 border border-${sColor}-500/20`}>
                                                <span className="material-symbols-outlined">{statusIcons[grant.status] || 'folder'}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg leading-tight">{grant.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{grant.teamName || 'No team'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${sColor}-500/10 text-${sColor}-400 border border-${sColor}-500/20 capitalize`}>
                                            {grant.status || 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">{grant.description}</p>
                                    <div className="mt-auto">
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Milestones ({stats.funded}/{stats.totalMilestones})</span>
                                            <span className="text-white">{stats.progressPercent}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full progress-bar-bg overflow-hidden mb-6">
                                            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${stats.progressPercent}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-gray-700/50 pt-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Funding</p>
                                                <p className="text-lg font-bold text-white">{stats.totalFunding} <span className="text-xs text-gray-400 font-normal">ALGO</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Escrow</p>
                                                <span className="text-xs font-mono text-gray-400">{shortAddress(grant.escrowAddress)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}

                    {/* Create New Card */}
                    <Link to="/create" className="no-underline">
                        <div className="border border-dashed border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center h-full hover:bg-white/5 transition-colors group min-h-[250px]">
                            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-white">add</span>
                            </div>
                            <h3 className="text-gray-300 font-medium">Create New Grant</h3>
                            <p className="text-gray-500 text-sm text-center mt-2 px-6">Start a new project and define milestones.</p>
                        </div>
                    </Link>
                </div>
            )}

            {/* Recent Transactions */}
            {grants.some(g => g.transactions && g.transactions.length > 0) && (
                <div className="mt-10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-400">history_edu</span>
                        Recent Transactions
                    </h3>
                    <div className="glass-panel rounded-2xl p-6 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-500 border-b border-gray-700">
                                    <th className="pb-3 pl-2">Type</th>
                                    <th className="pb-3">Project</th>
                                    <th className="pb-3">Amount</th>
                                    <th className="pb-3">Note</th>
                                    <th className="pb-3">Date</th>
                                    <th className="pb-3 pr-2 text-right">Txn ID</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {grants
                                    .flatMap(g => (g.transactions || []).map(t => ({ ...t, grantName: g.name })))
                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                    .slice(0, 10)
                                    .map((txn, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-colors border-b border-gray-800/50">
                                            <td className="py-4 pl-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${txn.type === 'fund'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[14px]">{txn.type === 'fund' ? 'payments' : 'send_money'}</span>
                                                    {txn.type === 'fund' ? 'Fund' : 'Release'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-white font-medium">{txn.grantName}</td>
                                            <td className="py-4 text-white font-medium">{txn.amount} ALGO</td>
                                            <td className="py-4 text-gray-400 max-w-xs truncate">{txn.note}</td>
                                            <td className="py-4 text-gray-400">{new Date(txn.timestamp).toLocaleDateString()}</td>
                                            <td className="py-4 pr-2 text-right">
                                                {txn.txnId ? (
                                                    <a href={getExplorerTxnUrl(txn.txnId)} target="_blank" rel="noreferrer"
                                                        className="text-xs font-mono text-indigo-400 hover:text-indigo-300 no-underline flex items-center gap-1 justify-end">
                                                        {shortAddress(txn.txnId)} <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                    </a>
                                                ) : <span className="text-xs text-gray-600">Off-chain</span>}
                                            </td>
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
