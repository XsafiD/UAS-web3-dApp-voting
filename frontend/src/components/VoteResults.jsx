import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CONTRACT_ABI from '../contracts/abi.json';

const VoteResults = ({ onRefresh }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingBlockchain, setUsingBlockchain] = useState(false);

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Cek jika contract sudah di-deploy
    const isContractDeployed = CONTRACT_ADDRESS &&
      CONTRACT_ADDRESS !== 'DEPLOY_CONTRACT_FIRST' &&
      CONTRACT_ADDRESS.length > 20;

    setUsingBlockchain(isContractDeployed);
    fetchStats(isContractDeployed);

    // Refresh setiap 10 detik
    const interval = setInterval(() => {
      fetchStats(isContractDeployed);
    }, 10000);

    return () => clearInterval(interval);
  }, [CONTRACT_ADDRESS, onRefresh]);

  const fetchStats = async (useBlockchain = false) => {
    setLoading(true);
    setError(null);

    try {
      if (useBlockchain && window.ethereum) {
        // Fetch dari smart contract
        await fetchFromBlockchain();
      } else {
        // Fetch dari backend API (fallback)
        await fetchFromAPI();
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Jika blockchain gagal, coba fallback ke API
      if (useBlockchain) {
        console.log('Falling back to API...');
        await fetchFromAPI();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFromBlockchain = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Get data dari smart contract
      const candidatesData = await contract.getAllCandidates();
      const totalVotesData = await contract.totalVotes();
      const leadingIdData = await contract.getLeadingCandidate();

      // Format data
      const candidates = candidatesData.map((c, idx) => ({
        id: c.id.toString(),
        name: c.name,
        ketua: c.ketua,
        wakil: c.wakil,
        voteCount: parseInt(c.voteCount.toString()),
        color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][idx] || '#8b5cf6'
      }));

      // Sort by vote count
      const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
      const maxVotes = Math.max(...candidates.map(c => c.voteCount), 0);

      setStats({
        candidates: sortedCandidates.map((c, idx) => ({
          ...c,
          rank: idx + 1,
          percentage: totalVotesData > 0
            ? ((c.voteCount / parseInt(totalVotesData.toString())) * 100).toFixed(1)
            : '0.0'
        })),
        totalVotes: parseInt(totalVotesData.toString()),
        totalCandidates: candidates.length,
        leadingCandidate: {
          id: parseInt(leadingIdData.toString()),
          voteCount: candidates[parseInt(leadingIdData.toString())]?.voteCount || 0
        },
        maxVotes: maxVotes
      });
    } catch (err) {
      console.error('Blockchain fetch error:', err);
      throw err;
    }
  };

  const fetchFromAPI = async () => {
    try {
      const response = await fetch(`${API_URL}/api/votes/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stats');
      }

      const maxVotes = Math.max(...data.data.candidates.map(c => c.voteCount), 0);

      setStats({
        ...data.data,
        maxVotes: maxVotes
      });
    } catch (err) {
      console.error('API fetch error:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="vote-results loading">
        <div className="loading-spinner"></div>
        <p>Memuat hasil voting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-results error">
        <p>⚠️ Error: {error}</p>
        <button onClick={() => fetchStats(usingBlockchain)} className="retry-btn">🔄 Coba Lagi</button>
      </div>
    );
  }

  if (!stats || !stats.candidates) {
    return <div className="vote-results empty">Tidak ada data voting</div>;
  }

  return (
    <div className="vote-results">
      <div className="results-header">
        <h2>📊 Hasil Voting {usingBlockchain ? '(Blockchain)' : '(Backend)'}</h2>
        <div className="total-votes">
          <span className="total-number">{stats.totalVotes}</span>
          <span className="total-label">Total Suara</span>
        </div>
      </div>

      <div className="results-list">
        {stats.candidates.map((candidate, index) => {
          const isLeading = parseInt(candidate.id) === stats.leadingCandidate?.id;

          return (
            <div
              key={candidate.id}
              className={`result-item ${isLeading ? 'leading' : ''}`}
            >
              <div className="result-header">
                <div className="result-rank">
                  <span className="rank-number">#{candidate.rank}</span>
                  {isLeading && <span className="leading-badge">🏆 Memimpin</span>}
                </div>
                <div className="result-percentage">{candidate.percentage}%</div>
              </div>

              <div className="candidate-info">
                <div className="candidate-name">{candidate.name}</div>
                <div className="candidate-details">
                  <span className="detail-label">Ketua:</span>
                  <span className="detail-value">{candidate.ketua}</span>
                </div>
                <div className="candidate-details">
                  <span className="detail-label">Wakil:</span>
                  <span className="detail-value">{candidate.wakil}</span>
                </div>
              </div>

              <div className="vote-count-info">
                <span className="vote-count-number">{candidate.voteCount}</span>
                <span className="vote-count-label">suara</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${candidate.percentage}%`,
                    backgroundColor: candidate.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="results-footer">
        <p>Total Kandidat: {stats.totalCandidates}</p>
        <p className="update-time">
          {usingBlockchain
            ? '🔗 Data dari Blockchain Sepolia (real-time)'
            : '📡 Data dari Backend API (dummy)'}
        </p>
      </div>
    </div>
  );
};

export default VoteResults;
