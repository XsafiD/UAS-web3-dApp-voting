import React, { useState, useEffect } from "react";
import WalletConnect from "./components/WalletConnect";
import NetworkSwitch from "./components/NetworkSwitch";
import VotingInterface from "./components/VotingInterface";
import VoteResults from "./components/VoteResults";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshResults, setRefreshResults] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const TARGET_CHAIN_ID = 11155111; // Sepolia

  // Fetch candidates from backend
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/votes/candidates`);
        const data = await response.json();
        if (data.success) {
          setCandidates(data.data);
        }
      } catch (err) {
        console.error("Error fetching candidates:", err);
      }
    };

    fetchCandidates();
  }, [refreshResults]);

  // Check if user has voted
  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!account) {
        setHasVoted(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/votes/history`);
        const data = await response.json();

        if (data.success && data.data) {
          const hasVotedBefore = data.data.some(
            (record) =>
              record.voterAddress.toLowerCase() === account.toLowerCase(),
          );
          setHasVoted(hasVotedBefore);
        }
      } catch (err) {
        console.error("Error checking voting status:", err);
      }
    };

    checkVotingStatus();
  }, [account]);

  const handleVoteSubmitted = () => {
    setRefreshResults((prev) => !prev);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🗳️ E-Voting Ketua HIMA Informatika</h1>
          <p>Sistem Voting Berbasis Blockchain - Pemilihan Ketua HIMA</p>
        </div>

        <div className="header-actions">
          <NetworkSwitch chainId={chainId} onNetworkSwitched={setChainId} />
          <WalletConnect
            onAccountChange={setAccount}
            onBalanceChange={setBalance}
            onChainIdChange={setChainId}
          />
        </div>
      </header>

      <main className="app-main">
        <div className="content-grid">
          <div className="voting-section">
            <VotingInterface
              account={account}
              chainId={chainId}
              hasVoted={hasVoted}
              onVoteSubmitted={handleVoteSubmitted}
            />
          </div>

          <div className="results-section">
            <VoteResults onRefresh={refreshResults} />
          </div>
        </div>

        {account && (
          <div className="user-info-bar">
            <div className="info-item">
              <span className="info-label">Wallet:</span>
              <span className="info-value">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Saldo:</span>
              <span className="info-value">
                {balance ? `${parseFloat(balance).toFixed(4)} ETH` : "-"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span
                className={`info-value ${chainId === TARGET_CHAIN_ID ? "success" : "warning"}`}
              >
                {chainId === TARGET_CHAIN_ID
                  ? "✅ Sepolia Connected"
                  : "⚠️ Wrong Network"}
              </span>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Web3 Voting dApp UAS © 2026 | Built with React + Vite + Ethers.js</p>
        <p className="footer-note">Sepolia Testnet | HIMA Informatika</p>
      </footer>
    </div>
  );
}

export default App;
