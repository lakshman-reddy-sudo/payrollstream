const STORAGE_KEY = 'algorand_grant_tracker';
const AUTH_KEY = 'grantchain_auth';

// ============================================================
// AUTH SYSTEM
// ============================================================

/**
 * Get current logged-in user
 * @returns {{ name: string, role: string, walletAddress: string } | null}
 */
export function getCurrentUser() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Login a user
 * @param {{ name: string, role: 'sponsor'|'admin'|'team', walletAddress?: string }}
 */
export function loginUser({ name, role, walletAddress = '' }) {
    const user = { name, role, walletAddress, loggedInAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
}

/**
 * Update wallet address for logged-in user
 */
export function updateUserWallet(walletAddress) {
    const user = getCurrentUser();
    if (user) {
        user.walletAddress = walletAddress;
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
}

/**
 * Logout
 */
export function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
}

// ============================================================
// DATA STORE
// ============================================================

function getData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { grants: [], nextId: 1 };
    } catch {
        return { grants: [], nextId: 1 };
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getGrants() {
    return getData().grants;
}

export function getGrant(id) {
    return getData().grants.find((g) => g.id === Number(id)) || null;
}

/**
 * Create a new grant
 */
export function createGrant(grantData) {
    const data = getData();
    const grant = {
        id: data.nextId,
        ...grantData,
        createdAt: new Date().toISOString(),
        status: 'active',
        milestones: (grantData.milestones || []).map((m, i) => ({
            ...m,
            id: i + 1,
            status: 'pending',
            submittedAt: null,
            submittedBy: null,
            submissionNote: null,
            approvedAt: null,
            approvedBy: null,
            fundedAt: null,
            txnId: null,
            votes: [],            // DAO voting
            rejectedAt: null,
            rejectionNote: null,
        })),
        transactions: [],
        expenses: [],           // Team expense logs
    };
    data.grants.push(grant);
    data.nextId += 1;
    saveData(data);
    return grant;
}

export function updateGrant(id, updates) {
    const data = getData();
    const index = data.grants.findIndex((g) => g.id === Number(id));
    if (index === -1) return null;
    data.grants[index] = { ...data.grants[index], ...updates };
    saveData(data);
    return data.grants[index];
}

export function updateMilestone(grantId, milestoneId, updates) {
    const data = getData();
    const grant = data.grants.find((g) => g.id === Number(grantId));
    if (!grant) return null;
    const milestone = grant.milestones.find((m) => m.id === Number(milestoneId));
    if (!milestone) return null;
    Object.assign(milestone, updates);
    saveData(data);
    return milestone;
}

export function addTransaction(grantId, txn) {
    const data = getData();
    const grant = data.grants.find((g) => g.id === Number(grantId));
    if (!grant) return;
    grant.transactions.push({
        ...txn,
        timestamp: new Date().toISOString(),
    });
    saveData(data);
}

/**
 * Add expense log for a grant (Team role)
 */
export function addExpense(grantId, expense) {
    const data = getData();
    const grant = data.grants.find((g) => g.id === Number(grantId));
    if (!grant) return;
    if (!grant.expenses) grant.expenses = [];
    grant.expenses.push({
        ...expense,
        id: Date.now(),
        timestamp: new Date().toISOString(),
    });
    saveData(data);
}

/**
 * Add a DAO vote to a milestone
 */
export function addVote(grantId, milestoneId, vote) {
    const data = getData();
    const grant = data.grants.find((g) => g.id === Number(grantId));
    if (!grant) return null;
    const milestone = grant.milestones.find((m) => m.id === Number(milestoneId));
    if (!milestone) return null;
    if (!milestone.votes) milestone.votes = [];
    // Prevent double voting
    const existing = milestone.votes.find((v) => v.voter === vote.voter);
    if (existing) {
        existing.decision = vote.decision;
        existing.timestamp = new Date().toISOString();
    } else {
        milestone.votes.push({ ...vote, timestamp: new Date().toISOString() });
    }
    saveData(data);
    return milestone;
}

export function deleteGrant(id) {
    const data = getData();
    data.grants = data.grants.filter((g) => g.id !== Number(id));
    saveData(data);
}

/**
 * Calculate grant stats
 */
export function getGrantStats(grant) {
    const totalMilestones = grant.milestones.length;
    const funded = grant.milestones.filter((m) => m.status === 'funded').length;
    const approved = grant.milestones.filter((m) => m.status === 'approved').length;
    const submitted = grant.milestones.filter((m) => m.status === 'submitted').length;
    const rejected = grant.milestones.filter((m) => m.status === 'rejected').length;
    const totalFunding = parseFloat(grant.totalFunding) || 0;
    const releasedAmount = grant.milestones
        .filter((m) => m.status === 'funded')
        .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    const remainingAmount = totalFunding - releasedAmount;
    const progressPercent = totalMilestones > 0 ? Math.round((funded / totalMilestones) * 100) : 0;

    return {
        totalMilestones, funded, approved, submitted, rejected,
        pending: totalMilestones - funded - approved - submitted - rejected,
        totalFunding, releasedAmount, remainingAmount, progressPercent,
    };
}


