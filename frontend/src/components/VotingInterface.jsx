import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CONTRACT_ABI from '../contracts/abi.json';

const VotingInterface = ({
  account,
  chainId,
  hasVoted,
  onVoteSubmitted
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingBlockchain, setUsingBlockchain] = useState(false);

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const TARGET_CHAIN_ID = 11155111;

  const isWrongNetwork = chainId && chainId !== TARGET_CHAIN_ID;

  // Load candidates from smart contract or backend
  useEffect(() => {
    const isContractDeployed = CONTRACT_ADDRESS &&
      CONTRACT_ADDRESS !== 'DEPLOY_CONTRACT_FIRST' &&
      CONTRACT_ADDRESS.length > 20;

    setUsingBlockchain(isContractDeployed);
    fetchCandidates(isContractDeployed);
  }, [CONTRACT_ADDRESS]);

  // Refresh candidates after vote
  useEffect(() => {
    if (hasVoted) {
      const isContractDeployed = CONTRACT_ADDRESS &&
        CONTRACT_ADDRESS !== 'DEPLOY_CONTRACT_FIRST' &&
        CONTRACT_ADDRESS.length > 20;
      fetchCandidates(isContractDeployed);
    }
  }, [hasVoted]);

  const fetchCandidates = async (useBlockchain = false) => {
    setLoading(true);
    try {
      if (useBlockchain && window.ethereum) {
        await fetchFromBlockchain();
      } else {
        await fetchFromAPI();
      }
    } catch (err) {
      // Silently handle fetch errors
      // Fallback to API if blockchain fails
      if (useBlockchain) {
        await fetchFromAPI();
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

      const candidatesData = await contract.getAllCandidates();

      const formattedCandidates = candidatesData.map((c, idx) => ({
        id: c.id.toString(),
        ketua: c.ketua,
        wakil: c.wakil,
        name: c.name,
        visi: c.visi,
        voteCount: parseInt(c.voteCount.toString()),
        color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][idx] || '#8b5cf6'
      }));

      setCandidates(formattedCandidates);
    } catch (err) {
      // Blockchain fetch failed
      throw err;
    }
  };

  const fetchFromAPI = async () => {
    try {
      const response = await fetch(`${API_URL}/api/votes/candidates`);
      const data = await response.json();
      if (data.success) {
        setCandidates(data.data);
      }
    } catch (err) {
      // API fetch failed
      throw err;
    }
  };

  // Reset when account changes
  useEffect(() => {
    setSelectedCandidate(null);
    setError(null);
    setSuccess(null);
  }, [account]);

  const handleVote = async () => {
    if (!account) {
      setError('Silakan connect wallet terlebih dahulu');
      return;
    }

    if (isWrongNetwork) {
      setError('Silakan switch ke Sepolia Testnet');
      return;
    }

    if (selectedCandidate === null) {
      setError('Silakan pilih pasangan calon terlebih dahulu');
      return;
    }

    if (hasVoted) {
      setError('Anda sudah memberikan suara');
      return;
    }

    // Check if contract is deployed
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'DEPLOY_CONTRACT_FIRST' || CONTRACT_ADDRESS.length < 10) {
      setError('Smart contract belum di-deploy. Silakan deploy contract terlebih dahulu.');
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Call vote function
      const tx = await contract.vote(selectedCandidate);

      // Wait for transaction
      await tx.wait();

      setSuccess('🎉 Suara Anda berhasil direkam di blockchain!');

      if (onVoteSubmitted) {
        onVoteSubmitted(selectedCandidate);
      }

      // Refresh candidates from blockchain
      await fetchFromBlockchain();

      // Reset selection
      setTimeout(() => {
        setSelectedCandidate(null);
        setSuccess(null);
      }, 5000);
    } catch (err) {
      // Handle various error codes with user-friendly messages
      if (err.code === 4001) {
        setError('Anda menolak transaksi voting');
      } else if (err.reason) {
        // Smart contract error message
        if (err.reason.includes('sudah memberikan suara') || err.reason.includes('already voted')) {
          setError('⚠️ Anda sudah memberikan suara. Satu address hanya bisa vote satu kali.');
        } else if (err.reason.includes('Invalid candidate')) {
          setError('⚠️ Kandidat tidak valid. Silakan pilih kembali.');
        } else if (err.reason.includes('Voting belum dimulai')) {
          setError('⚠️ Voting belum dimulai atau sudah berakhir.');
        } else {
          setError(`⚠️ ${err.reason}`);
        }
      } else if (err.message) {
        // Parse error message for common patterns
        const errorMsg = err.message;
        if (errorMsg.includes('already voted') || errorMsg.includes('hasVoted')) {
          setError('⚠️ Anda sudah memberikan suara. Satu address hanya bisa vote satu kali.');
        } else if (errorMsg.includes('execution reverted')) {
          setError('⚠️ Transaksi gagal. Anda mungkin sudah vote sebelumnya.');
        } else {
          setError('⚠️ Gagal melakukan voting. Silakan coba lagi.');
        }
      } else {
        setError('⚠️ Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="voting-interface">
        <h2>🗳️ Voting Ketua HIMA Informatika</h2>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Memuat pasangan calon...</p>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="voting-interface">
        <h2>🗳️ Voting Ketua HIMA Informatika</h2>
        <div className="connect-prompt">
          <p>⚠️ Tidak ada data kandidat. Silakan refresh halaman.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-interface">
      <h2>🗳️ Voting Ketua HIMA Informatika {usingBlockchain && '🔗'}</h2>

      {!account && (
        <div className="connect-prompt">
          <p>🔌 Silakan connect wallet terlebih dahulu untuk memberikan suara</p>
        </div>
      )}

      {account && isWrongNetwork && (
        <div className="network-error">
          <p>⚠️ Harap switch ke Sepolia Testnet terlebih dahulu</p>
        </div>
      )}

      {account && !isWrongNetwork && (
        <>
          {hasVoted ? (
            <div className="already-voted-card">
              <div className="voted-icon">✅</div>
              <h3>Terima Kasih!</h3>
              <p>Anda sudah memberikan suara untuk pemilihan Ketua HIMA Informatika.</p>
              <p className="note">Satu address hanya dapat memilih satu pasangan calon.</p>
            </div>
          ) : (
            <>
              <div className="candidates-grid">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`candidate-card ${
                      selectedCandidate === candidate.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedCandidate(candidate.id)}
                  >
                    <div
                      className="candidate-header"
                      style={{ backgroundColor: candidate.color }}
                    >
                      <span className="candidate-number">0{parseInt(candidate.id) + 1}</span>
                      <span className="candidate-icon">👥</span>
                    </div>
                    <div className="candidate-body">
                      <h3>{candidate.name}</h3>
                      <div className="candidate-names">
                        <div className="candidate-role">
                          <span className="role-label">Ketua:</span>
                          <span className="role-name">{candidate.ketua}</span>
                        </div>
                        <div className="candidate-role">
                          <span className="role-label">Wakil:</span>
                          <span className="role-name">{candidate.wakil}</span>
                        </div>
                      </div>
                      <p className="candidate-visi">{candidate.visi}</p>
                      <div className="vote-count">
                        <span className="count-number">{candidate.voteCount}</span>
                        <span className="count-label">Suara</span>
                      </div>
                    </div>
                    {selectedCandidate === candidate.id && (
                      <div className="selected-badge">✓ Dipilih</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="voting-action">
                <p className="select-prompt">
                  {selectedCandidate !== null
                    ? `Anda memilih Paslon 0${parseInt(selectedCandidate) + 1}`
                    : 'Silakan pilih pasangan calon di atas'}
                </p>
                <button
                  onClick={handleVote}
                  disabled={isVoting || selectedCandidate === null}
                  className="vote-btn"
                >
                  {isVoting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <span className="vote-icon">🗳️</span>
                      Kirim Suara
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="error-message">
                  <span>⚠️ {error}</span>
                  <button onClick={() => setError(null)} className="close-btn">×</button>
                </div>
              )}

              {success && (
                <div className="success-message">
                  <span>{success}</span>
                  <button onClick={() => setSuccess(null)} className="close-btn">×</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default VotingInterface;
