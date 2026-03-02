import algosdk from 'algosdk';

// Algorand TestNet Clients (public Algonode endpoints - no auth needed)
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const indexerClient = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '');

/**
 * Create a multisig escrow address
 * @param {string[]} addresses - Array of wallet addresses (sponsor, admin, faculty)
 * @param {number} threshold - Number of required signatures (default: 2)
 * @returns {{ address: string, params: object }}
 */
export function createMultisigAddress(addresses, threshold = 2) {
    const msigParams = {
        version: 1,
        threshold,
        addrs: addresses,
    };
    const multisigAddr = algosdk.multisigAddress(msigParams);
    return { address: multisigAddr, params: msigParams };
}

/**
 * Get suggested transaction params
 */
export async function getSuggestedParams() {
    return await algodClient.getTransactionParams().do();
}

/**
 * Create a funding transaction (sponsor → escrow)
 * @param {string} senderAddr
 * @param {string} escrowAddr
 * @param {number} amountInAlgo
 * @param {string} note
 * @returns {algosdk.Transaction}
 */
export async function createFundingTxn(senderAddr, escrowAddr, amountInAlgo, note = '') {
    const suggestedParams = await getSuggestedParams();
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddr,
        to: escrowAddr,
        amount: algosdk.algosToMicroalgos(amountInAlgo),
        note: new TextEncoder().encode(note),
        suggestedParams,
    });
    return txn;
}

/**
 * Create a milestone release transaction (escrow → team via multisig)
 * @param {string} escrowAddr
 * @param {string} teamAddr
 * @param {number} amountInAlgo
 * @param {string} milestoneNote
 * @returns {algosdk.Transaction}
 */
export async function createMilestoneReleaseTxn(escrowAddr, teamAddr, amountInAlgo, milestoneNote) {
    const suggestedParams = await getSuggestedParams();
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: escrowAddr,
        to: teamAddr,
        amount: algosdk.algosToMicroalgos(amountInAlgo),
        note: new TextEncoder().encode(`MILESTONE: ${milestoneNote}`),
        suggestedParams,
    });
    return txn;
}

/**
 * Create a self-transaction for expense logging
 * @param {string} teamAddr
 * @param {string} expenseNote
 * @returns {algosdk.Transaction}
 */
export async function createExpenseLogTxn(teamAddr, expenseNote) {
    const suggestedParams = await getSuggestedParams();
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: teamAddr,
        to: teamAddr,
        amount: 0,
        note: new TextEncoder().encode(`EXPENSE: ${expenseNote}`),
        suggestedParams,
    });
    return txn;
}

/**
 * Get account balance
 * @param {string} address
 * @returns {Promise<number>} balance in ALGO
 */
export async function getBalance(address) {
    try {
        const accountInfo = await algodClient.accountInformation(address).do();
        return algosdk.microalgosToAlgos(accountInfo.amount);
    } catch {
        return 0;
    }
}

/**
 * Get transaction history for an address from the Indexer
 * @param {string} address
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getTransactionHistory(address, limit = 20) {
    try {
        const response = await indexerClient
            .searchForTransactions()
            .address(address)
            .limit(limit)
            .do();
        return (response.transactions || []).map((txn) => ({
            id: txn.id,
            sender: txn.sender,
            receiver: txn['payment-transaction']?.receiver || '',
            amount: txn['payment-transaction']?.amount
                ? algosdk.microalgosToAlgos(txn['payment-transaction'].amount)
                : 0,
            note: txn.note ? new TextDecoder().decode(new Uint8Array(Buffer.from(txn.note, 'base64'))) : '',
            roundTime: txn['round-time'],
            confirmedRound: txn['confirmed-round'],
        }));
    } catch {
        return [];
    }
}

/**
 * Wait for transaction confirmation
 * @param {string} txId
 * @returns {Promise<object>}
 */
export async function waitForConfirmation(txId) {
    return await algosdk.waitForConfirmation(algodClient, txId, 4);
}

/**
 * Submit a signed transaction
 * @param {Uint8Array} signedTxn
 * @returns {Promise<string>} transaction ID
 */
export async function submitTransaction(signedTxn) {
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    await waitForConfirmation(txid);
    return txid;
}

/**
 * Format address for display
 * @param {string} address
 * @returns {string} shortened address
 */
export function shortAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format microAlgos to ALGO string
 */
export function formatAlgo(microAlgos) {
    return (microAlgos / 1_000_000).toFixed(4);
}

export { algodClient, indexerClient, algosdk };
