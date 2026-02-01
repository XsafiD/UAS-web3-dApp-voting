import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnect = ({ onAccountChange, onBalanceChange, onChainIdChange }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const TARGET_CHAIN_ID = 11155111; // Sepolia

  // Cek MetaMask terinstall
  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask tidak terinstall. Silakan install MetaMask extension.');
      return false;
    }
    return true;
  };

  // Connect wallet
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);

    if (!checkMetaMask()) {
      setIsLoading(false);
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);

        // Get balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(accounts[0]);
        const formattedBalance = ethers.formatEther(bal);
        setBalance(formattedBalance);

        // Get chain ID
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));

        // Callback ke parent
        if (onAccountChange) onAccountChange(accounts[0]);
        if (onBalanceChange) onBalanceChange(formattedBalance);
        if (onChainIdChange) onChainIdChange(Number(network.chainId));
      }
    } catch (err) {
      handleWalletError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet errors
  const handleWalletError = (err) => {
    console.error('Wallet error:', err);

    switch (err.code) {
      case 4001:
        setError('Anda menolak koneksi wallet.');
        break;
      case -32002:
        setError('Permintaan sudah pending. Silakan buka MetaMask.');
        break;
      case 4900:
        setError('Wallet terputus.');
        break;
      default:
        setError('Gagal terhubung: ' + err.message);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setError(null);
    if (onAccountChange) onAccountChange(null);
    if (onBalanceChange) onBalanceChange(null);
    if (onChainIdChange) onChainIdChange(null);
  };

  // Auto-check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (checkMetaMask()) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const bal = await provider.getBalance(accounts[0]);
            const formattedBalance = ethers.formatEther(bal);
            setBalance(formattedBalance);

            const network = await provider.getNetwork();
            setChainId(Number(network.chainId));

            if (onAccountChange) onAccountChange(accounts[0]);
            if (onBalanceChange) onBalanceChange(formattedBalance);
            if (onChainIdChange) onChainIdChange(Number(network.chainId));
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          setError(null);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const isWrongNetwork = chainId && chainId !== TARGET_CHAIN_ID;

  return (
    <div className="wallet-connect">
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {account ? (
        <div className="wallet-info">
          {isWrongNetwork && (
            <div className="network-warning">
              <span>⚠️ Wrong Network - Harap switch ke Sepolia Testnet</span>
            </div>
          )}

          <div className="account-info">
            <span className="address-label">Connected:</span>
            <span className="address">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button onClick={disconnectWallet} className="disconnect-btn">
              Disconnect
            </button>
          </div>
          <div className="balance-info">
            <span className="balance-label">Saldo:</span>
            <span className="balance">
              {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '-'}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isLoading}
          className="connect-btn"
        >
          {isLoading ? 'Connecting...' : '🔌 Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
