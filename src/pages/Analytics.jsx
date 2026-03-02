import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrants, getGrantStats } from '../utils/store';
import { shortAddress, getExplorerTxnUrl } from '../utils/algorand';

const COLORS = { funded: '#8b5cf6', approved: '#10b981', submitted: '#3b82f6', pending: '#f59e0b', rejected: '#ef4444' };
const CATEGORY_COLORS = { General: '#8b5cf6', Hardware: '#3b82f6', Software: '#10b981', Services: '#f59e0b', Travel: '#ec4899', Other: '#64748b' };

export default function Analytics({ user }) {
    const [grants, setGrants] = useState([]);
    useEffect(() => { setGrants(getGrants()); }, []);

    const allMilestones = grants.flatMap(g => g.milestones || []);
    const allExpenses = grants.flatMap(g => g.expenses || []);
    const allTransactions = grants.flatMap(g => (g.transactions || []).map(t => ({ ...t, grantName: g.name })));

    const statusCounts = { funded: 0, approved: 0, submitted: 0, pending: 0, rejected: 0 };
    allMilestones.forEach(m => { if (statusCounts[m.status] !== undefined) statusCounts[m.status]++; });
    const totalMilestones = allMilestones.length;

    const totalFunding = grants.reduce((s, g) => s + (parseFloat(g.totalFunding) || 0), 0);
    const totalReleased = grants.reduce((s, g) => s + getGrantStats(g).releasedAmount, 0);
    const totalExpenses = allExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    const categoryMap = {};
    allExpenses.forEach(e => { const cat = e.category || 'General'; categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(e.amount) || 0); });
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const maxCategoryAmount = categories.length > 0 ? categories[0][1] : 1;

    const grantUtilization = grants.map(g => {
        const stats = getGrantStats(g);
        return { name: g.name, total: stats.totalFunding, released: stats.releasedAmount, remaining: stats.remainingAmount, progress: stats.progressPercent };
    });

    const DonutChart = ({ data, size = 180 }) => {
        const total = Object.values(data).reduce((s, v) => s + v, 0);
        if (total === 0) return <div className="text-center text-gray-500 py-10">No milestones yet</div>;
        const radius = 60, cx = size / 2, cy = size / 2;
        let cumulative = 0;
        const segments = [];
        Object.entries(data).forEach(([status, count]) => {
            if (count === 0) return;
            const pct = count / total;
            const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
            cumulative += pct;
            const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
            const largeArc = pct > 0.5 ? 1 : 0;
            const x1 = cx + radius * Math.cos(startAngle), y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle), y2 = cy + radius * Math.sin(endAngle);
            segments.push(<path key={status} d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={COLORS[status]} opacity={0.85} />);
        });
        return (
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
                {segments}
                <circle cx={cx} cy={cy} r={35} fill="#141522" />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="9">milestones</text>
            </svg>
        );
    };

    return (
        <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto w-full" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="fixed top-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-indigo-400">bar_chart</span>
                    Analytics Dashboard
                </h1>
                <p className="text-gray-400 mt-1">Fund utilization, milestone progress, and spending insights</p>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Grants', value: grants.length, icon: 'inventory_2', color: 'purple' },
                    { label: 'Total Funding', value: `${totalFunding.toFixed(1)} ALGO`, icon: 'savings', color: 'cyan' },
                    { label: 'Released', value: `${totalReleased.toFixed(1)} ALGO`, icon: 'payments', color: 'green' },
                    { label: 'Expenses', value: `${totalExpenses.toFixed(1)} ALGO`, icon: 'receipt_long', color: 'yellow' },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Donut */}
                <div className="glass-panel rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-400">donut_large</span>
                        Milestone Status
                    </h3>
                    <div className="flex items-center gap-8 flex-wrap">
                        <DonutChart data={statusCounts} />
                        <div className="flex flex-col gap-3">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-3 text-sm">
                                    <div className="w-3 h-3 rounded" style={{ background: COLORS[status] }}></div>
                                    <span className="text-gray-400 capitalize w-20">{status}</span>
                                    <span className="text-white font-bold">{count}</span>
                                    <span className="text-gray-600 text-xs">({totalMilestones > 0 ? Math.round(count / totalMilestones * 100) : 0}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="glass-panel rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-400">pie_chart</span>
                        Expense Breakdown
                    </h3>
                    {categories.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No expenses logged yet</div>
                    ) : (
                        <div className="space-y-4">
                            {categories.map(([cat, amount]) => (
                                <div key={cat}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">{cat}</span>
                                        <span className="text-white font-semibold">{amount.toFixed(1)} ALGO</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full progress-bar-bg overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(amount / maxCategoryAmount) * 100}%`, background: CATEGORY_COLORS[cat] || '#8b5cf6' }}></div>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t border-white/10 pt-3 flex justify-between text-sm font-bold">
                                <span className="text-gray-400">Total</span><span className="text-white">{totalExpenses.toFixed(1)} ALGO</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fund Utilization */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl mb-10">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400">tracking_adjustments</span>
                    Fund Utilization per Grant
                </h3>
                {grantUtilization.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No grants yet</div>
                ) : (
                    <div className="space-y-6">
                        {grantUtilization.map((g, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-semibold">{g.name}</span>
                                    <span className="text-sm text-gray-400">
                                        {g.released.toFixed(1)} / {g.total.toFixed(1)} ALGO ({g.progress}%)
                                    </span>
                                </div>
                                <div className="w-full h-4 rounded-full progress-bar-bg overflow-hidden mb-2">
                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700" style={{ width: `${g.total > 0 ? (g.released / g.total) * 100 : 0}%` }}></div>
                                </div>
                                <div className="flex gap-6 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Released: {g.released.toFixed(1)} ALGO</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600"></span>Remaining: {g.remaining.toFixed(1)} ALGO</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">history_edu</span>
                    Recent Transactions
                </h3>
                {allTransactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No transactions yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-500 border-b border-gray-700">
                                    <th className="pb-3 pl-2">Grant</th><th className="pb-3">Type</th><th className="pb-3">Amount</th><th className="pb-3">Note</th><th className="pb-3">Date</th><th className="pb-3 pr-2 text-right">Txn</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {allTransactions.slice(0, 20).map((txn, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors border-b border-gray-800/50">
                                        <td className="py-3 pl-2 text-white font-medium max-w-[150px] truncate">{txn.grantName}</td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${txn.type === 'fund' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                <span className="material-symbols-outlined text-[14px]">{txn.type === 'fund' ? 'payments' : 'send_money'}</span>
                                                {txn.type === 'fund' ? 'Fund' : 'Release'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-white font-medium">{txn.amount} ALGO</td>
                                        <td className="py-3 text-gray-400 max-w-[200px] truncate">{txn.note}</td>
                                        <td className="py-3 text-gray-400">{new Date(txn.timestamp).toLocaleDateString()}</td>
                                        <td className="py-3 pr-2 text-right">
                                            {txn.txnId ? (
                                                <a href={getExplorerTxnUrl(txn.txnId)} target="_blank" rel="noreferrer"
                                                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 no-underline flex items-center gap-1 justify-end">
                                                    {shortAddress(txn.txnId)} <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                </a>
                                            ) : <span className="text-xs text-gray-600">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
