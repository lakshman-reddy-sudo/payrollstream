import { DeflyWalletConnect } from '@blockshake/defly-connect';
import { PeraWalletConnect } from '@perawallet/connect';

const deflyWallet = new DeflyWalletConnect({
    chainId: 416002, // TestNet
});

const peraWallet = new PeraWalletConnect({
    chainId: 416002, // TestNet
});

let currentWalletType = null;
let currentWallet = null;

/**
 * Get available wallet types
 * @returns {Array} Array of wallet options
 */
export function getWalletTypes() {
    return [
        { id: 'pera', name: 'Pera Wallet', icon: 'account_balance_wallet', color: '#000' },
        { id: 'defly', name: 'Defly Wallet', icon: 'wallet', color: '#6A28D9' },
    ];
}

/**
 * Connect to selected wallet
 * @param {string} walletType - 'pera' or 'defly'
 * @returns {Promise<string[]>} connected accounts
 */
export async function connectWallet(walletType = 'pera') {
    try {
        let accounts;
        if (walletType === 'pera') {
            accounts = await peraWallet.connect();
            currentWallet = peraWallet;
        } else if (walletType === 'defly') {
            accounts = await deflyWallet.connect();
            currentWallet = deflyWallet;
        } else {
            throw new Error(`Unknown wallet type: ${walletType}`);
        }
        currentWalletType = walletType;
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
    if (currentWalletType === 'pera') {
        peraWallet.disconnect();
    } else if (currentWalletType === 'defly') {
        await deflyWallet.disconnect();
    }
    currentWallet = null;
    currentWalletType = null;
}

/**
 * Reconnect on page reload
 * @param {function} onConnect - callback with accounts
 */
export function reconnectWallet(onConnect) {
    // Try Pera first
    peraWallet
        .reconnectSession()
        .then((accounts) => {
            if (accounts.length > 0) {
                currentWallet = peraWallet;
                currentWalletType = 'pera';
                onConnect(accounts);
                return;
            }
            // If Pera fails, try Defly
            deflyWallet
                .reconnectSession()
                .then((deflyAccounts) => {
                    if (deflyAccounts.length > 0) {
                        currentWallet = deflyWallet;
                        currentWalletType = 'defly';
                        onConnect(deflyAccounts);
                    }
                })
                .catch(() => {
                    // No previous session
                });
        })
        .catch(() => {
            // Pera failed, try Defly
            deflyWallet
                .reconnectSession()
                .then((accounts) => {
                    if (accounts.length > 0) {
                        currentWallet = deflyWallet;
                        currentWalletType = 'defly';
                        onConnect(accounts);
                    }
                })
                .catch(() => {
                    // No previous session
                });
        });

    // Listen for disconnections
    peraWallet.connector?.on('disconnect', () => {
        onConnect([]);
    });
    deflyWallet.connector?.on('disconnect', () => {
        onConnect([]);
    });
}

export function getCurrentWalletType() {
    return currentWalletType;
}

export { deflyWallet, peraWallet };
