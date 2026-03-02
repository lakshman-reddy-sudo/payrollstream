import { Link } from 'react-router-dom';

export default function Landing({ user }) {
    return (
        <main className="flex-grow flex flex-col items-center justify-center relative overflow-hidden">
            {/* Floating blurs */}
            <div className="fixed top-20 right-0 w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>

            {/* Hero Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 py-20 lg:py-32">
                {/* Live badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-green-300 uppercase">Live on Algorand TestNet</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-white">
                    Transparent Grant <br />
                    Management on <span className="text-gradient">Algorand</span>
                </h1>

                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10 leading-relaxed">
                    Empowering sponsors, admins, and teams with a secure, role-based platform. Track every milestone and verify every payout on-chain.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link to="/create"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg glow-button flex items-center gap-2 no-underline">
                        Create Grant
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                    <Link to="/public"
                        className="px-8 py-4 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center gap-2 no-underline">
                        <span className="material-symbols-outlined">play_circle</span>
                        View Public Grants
                    </Link>
                </div>

                {/* Animated rings */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full -z-10 animate-[spin_60s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full -z-10 animate-[spin_40s_linear_infinite_reverse]"></div>
            </div>

            {/* Feature Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: 'flag', title: 'Milestone Payouts', desc: 'Funds are released only when milestones are met and approved. Ensures accountability for every Algo distributed.', color: 'purple', bgIcon: 'payments' },
                        { icon: 'verified_user', title: 'On-Chain Transparency', desc: 'Every transaction is recorded on the Algorand blockchain with a unique ID, creating an immutable audit trail.', color: 'blue', bgIcon: 'visibility' },
                        { icon: 'lock_person', title: 'Role-Based Control', desc: 'Distinct permissions for Sponsors, Admins, and Teams. Secure workflow from proposal to final delivery.', color: 'pink', bgIcon: 'admin_panel_settings' },
                    ].map((f, i) => (
                        <div key={i} className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className={`material-symbols-outlined text-8xl text-${f.color}-400`}>{f.bgIcon}</span>
                            </div>
                            <div className={`w-12 h-12 rounded-lg bg-${f.color}-500/20 flex items-center justify-center mb-6 text-${f.color}-400`}>
                                <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Section */}
            <div className="w-full bg-black/20 border-y border-white/5 py-12 mt-10 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="text-center px-4 py-4 md:py-0">
                            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">Blockchain Network</div>
                            <div className="text-4xl lg:text-5xl font-bold text-white">
                                <span className="text-gradient">Algorand</span>
                            </div>
                        </div>
                        <div className="text-center px-4 py-4 md:py-0">
                            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">Transaction Tool</div>
                            <div className="text-4xl lg:text-5xl font-bold text-white">Lora</div>
                        </div>
                        <div className="text-center px-4 py-4 md:py-0">
                            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">Smart Contracts</div>
                            <div className="text-4xl lg:text-5xl font-bold text-white">No TEAL</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflow Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4 text-white">Grant Lifecycle Workflow</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Seamless interaction between Sponsors, Admins, and Teams powered by Lora transaction composer.</p>
                </div>
                <div className="relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 -translate-y-1/2 z-0"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                        {[
                            { icon: 'edit_document', title: '1. Create', desc: 'Sponsor defines milestones & deliverables', color: 'purple' },
                            { icon: 'upload_file', title: '2. Submit', desc: 'Team uploads work proof for review', color: 'blue' },
                            { icon: 'fact_check', title: '3. Approve', desc: 'Admin verifies quality & approves milestone', color: 'pink' },
                            { icon: 'send_money', title: '4. Release', desc: 'Funds sent via Lora & verified on-chain', color: 'green' },
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center border-2 border-${step.color}-500/50 mb-6 group-hover:scale-110 transition-transform bg-gray-900 shadow-[0_0_15px_rgba(139,92,246,0.3)]`}>
                                    <span className={`material-symbols-outlined text-${step.color}-400`}>{step.icon}</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                                <p className="text-sm text-gray-400 px-2">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/30 backdrop-blur-md pt-16 pb-8 w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-lg">token</span>
                                </div>
                                <span className="font-bold text-xl tracking-tight text-white">GrantChain</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Built for the Algorand No-TEAL Hackathon. Leveraging native features for secure grant management.
                            </p>
                        </div>
                        <div>
                            <h5 className="text-white font-semibold mb-4">Platform</h5>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/dashboard" className="hover:text-purple-400 transition-colors no-underline text-gray-400">Browse Grants</Link></li>
                                <li><Link to="/analytics" className="hover:text-purple-400 transition-colors no-underline text-gray-400">Analytics Dashboard</Link></li>
                                <li><Link to="/create" className="hover:text-purple-400 transition-colors no-underline text-gray-400">Create Proposal</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-white font-semibold mb-4">Resources</h5>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="https://lora.algokit.io/testnet" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors no-underline text-gray-400">Lora Explorer</a></li>
                                <li><a href="https://developer.algorand.org" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors no-underline text-gray-400">Algorand Docs</a></li>
                                <li><a href="https://github.com/lakshman-reddy-sudo/grant-tracker" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors no-underline text-gray-400">GitHub Repo</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-white font-semibold mb-4">Network</h5>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                TestNet Status: Operational
                            </div>
                            <p className="text-xs text-gray-600">Built by Lakshman Reddy</p>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-600 text-sm">© 2025 GrantChain. Open Source.</p>
                        <a href="https://github.com/lakshman-reddy-sudo" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
