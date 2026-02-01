import React, { useState } from 'react';

const NetworkSwitch = ({ chainId, onNetworkSwitched }) => {
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(null);

  const TARGET_CHAIN_ID = 11155111; // Sepolia
  const SEPOLIA_CHAIN_ID = `0x${TARGET_CHAIN_ID.toString(16)}`;

  const isWrongNetwork = chainId && chainId !== TARGET_CHAIN_ID;

  const switchNetwork = async () => {
    if (!window.ethereum) {
      setError('MetaMask tidak terinstall');
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }]
      });

      if (onNetworkSwitched) {
        onNetworkSwitched(TARGET_CHAIN_ID);
      }
    } catch (err) {
      // If network doesn't exist in MetaMask, add it
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });

          if (onNetworkSwitched) {
            onNetworkSwitched(TARGET_CHAIN_ID);
          }
        } catch (addError) {
          setError('Gagal menambahkan network: ' + addError.message);
        }
      } else {
        setError('Gagal switch network: ' + err.message);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isWrongNetwork) {
    return (
      <div className="network-status correct">
        <span className="status-dot"></span>
        <span className="network-name">✅ Sepolia Testnet</span>
      </div>
    );
  }

  return (
    <div className="network-switch">
      <div className="network-warning">
        <span>⚠️ Wrong Network</span>
        <button
          onClick={switchNetwork}
          disabled={isSwitching}
          className="switch-btn"
        >
          {isSwitching ? 'Switching...' : '🔄 Switch to Sepolia'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default NetworkSwitch;
