const STORAGE_KEY = 'payrollstream_data';
const AUTH_KEY = 'payrollstream_auth';

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
 * @param {{ name: string, role: 'admin'|'employee', walletAddress?: string }}
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
// DATA STORE — Payrolls (adapted from Grants)
// ============================================================

function getData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { payrolls: [], nextId: 1 };
    } catch {
        return { payrolls: [], nextId: 1 };
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getGrants() {
    return getData().payrolls;
}

export function getGrant(id) {
    return getData().payrolls.find((g) => g.id === Number(id)) || null;
}

/**
 * Create a new payroll
 */
export function createGrant(payrollData) {
    const data = getData();
    const payroll = {
        id: data.nextId,
        status: 'active',
        transactions: [],
        expenses: [],
        ...payrollData,
        createdAt: new Date().toISOString(),
        milestones: (payrollData.milestones || []).map((m, i) => ({
            id: i + 1,
            status: 'pending',
            submittedAt: null,
            submittedBy: null,
            submissionNote: null,
            approvedAt: null,
            approvedBy: null,
            fundedAt: null,
            txnId: null,
            votes: [],
            rejectedAt: null,
            rejectionNote: null,
            ...m,
        })),
    };
    data.payrolls.push(payroll);
    data.nextId += 1;
    saveData(data);
    return payroll;
}

export function updateGrant(id, updates) {
    const data = getData();
    const index = data.payrolls.findIndex((g) => g.id === Number(id));
    if (index === -1) return null;
    data.payrolls[index] = { ...data.payrolls[index], ...updates };
    saveData(data);
    return data.payrolls[index];
}

export function updateMilestone(payrollId, milestoneId, updates) {
    const data = getData();
    const payroll = data.payrolls.find((g) => g.id === Number(payrollId));
    if (!payroll) return null;
    const milestone = payroll.milestones.find((m) => m.id === Number(milestoneId));
    if (!milestone) return null;
    Object.assign(milestone, updates);
    saveData(data);
    return milestone;
}

export function addTransaction(payrollId, txn) {
    const data = getData();
    const payroll = data.payrolls.find((g) => g.id === Number(payrollId));
    if (!payroll) return;
    payroll.transactions.push({
        ...txn,
        timestamp: new Date().toISOString(),
    });
    saveData(data);
}

/**
 * Add expense log for a payroll (Employee role)
 */
export function addExpense(payrollId, expense) {
    const data = getData();
    const payroll = data.payrolls.find((g) => g.id === Number(payrollId));
    if (!payroll) return;
    if (!payroll.expenses) payroll.expenses = [];
    payroll.expenses.push({
        ...expense,
        id: Date.now(),
        timestamp: new Date().toISOString(),
    });
    saveData(data);
}

/**
 * Add a vote to a milestone
 */
export function addVote(payrollId, milestoneId, vote) {
    const data = getData();
    const payroll = data.payrolls.find((g) => g.id === Number(payrollId));
    if (!payroll) return null;
    const milestone = payroll.milestones.find((m) => m.id === Number(milestoneId));
    if (!milestone) return null;
    if (!milestone.votes) milestone.votes = [];
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
    data.payrolls = data.payrolls.filter((g) => g.id !== Number(id));
    saveData(data);
}

/**
 * Calculate payroll stats
 */
export function getGrantStats(payroll) {
    const totalMilestones = payroll.milestones.length;
    const funded = payroll.milestones.filter((m) => m.status === 'funded').length;
    const approved = payroll.milestones.filter((m) => m.status === 'approved').length;
    const submitted = payroll.milestones.filter((m) => m.status === 'submitted').length;
    const rejected = payroll.milestones.filter((m) => m.status === 'rejected').length;
    const totalFunding = parseFloat(payroll.totalFunding) || 0;
    const releasedAmount = payroll.milestones
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

/**
 * Compute earned salary based on time elapsed (frontend only)
 * @param {object} payroll - payroll object with startTime, endTime, totalFunding
 * @returns {{ earned: number, percent: number, rate: number }}
 */
export function computeEarnedSalary(payroll) {
    const now = Date.now();
    const start = new Date(payroll.startTime || payroll.createdAt).getTime();
    const end = new Date(payroll.endTime || start + 30 * 24 * 60 * 60 * 1000).getTime();
    const totalSalary = parseFloat(payroll.totalFunding) || 0;
    const duration = end - start;
    if (duration <= 0 || totalSalary <= 0) return { earned: 0, percent: 0, rate: 0 };

    const elapsed = Math.max(0, Math.min(now - start, duration));
    const rate = totalSalary / duration;  // ALGO per millisecond
    const earned = rate * elapsed;
    const percent = (elapsed / duration) * 100;

    return {
        earned: Math.min(earned, totalSalary),
        percent: Math.min(percent, 100),
        rate: rate * 1000, // ALGO per second
    };
}
