import { PeraWalletConnect } from '@perawallet/connect';

const peraWallet = new PeraWalletConnect({
    chainId: 416002, // Algorand TestNet
});

/**
 * Connect Pera Wallet
 * @returns {Promise<string[]>} connected accounts
 */
export async function connectWallet() {
    try {
        const accounts = await peraWallet.connect();
        return accounts;
    } catch (error) {
        if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
            console.error('Wallet connection error:', error);
        }
        throw error;
    }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet() {
    await peraWallet.disconnect();
}

/**
 * Sign transactions using Pera Wallet
 * @param {Uint8Array[]} txnGroups - Array of encoded transactions
 * @returns {Promise<Uint8Array[]>} signed transactions
 */
export async function signTransactions(txnGroups) {
    const signedTxns = await peraWallet.signTransaction([txnGroups]);
    return signedTxns;
}

/**
 * Reconnect on page reload (if user previously connected)
 * @param {function} onConnect - callback with accounts
 */
export function reconnectWallet(onConnect) {
    peraWallet
        .reconnectSession()
        .then((accounts) => {
            if (accounts.length > 0) {
                onConnect(accounts);
            }
        })
        .catch(() => {
            // No previous session
        });

    peraWallet.connector?.on('disconnect', () => {
        onConnect([]);
    });
}

export { peraWallet };
