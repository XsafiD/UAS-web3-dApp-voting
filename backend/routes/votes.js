const express = require('express');
const router = express.Router();

// Dummy candidates data untuk voting Ketua HIMA Informatika
const candidates = [
  {
    id: 0,
    ketua: 'Ahmad Pratama',
    wakil: 'Siti Aminah',
    name: 'Paslon 01 - Ahmad & Siti',
    description: 'Visi: Mewujudkan HIMA Informatika yang progresif, inklusif, dan berorientasi pada mahasiswa.',
    visi: 'Mewujudkan HIMA Informatika yang progresif, inklusif, dan berorientasi pada mahasiswa.',
    voteCount: 142,
    color: '#8b5cf6', // Violet 500
    icon: 'users'
  },
  {
    id: 1,
    ketua: 'Budi Santoso',
    wakil: 'Rina Wijaya',
    name: 'Paslon 02 - Budi & Rina',
    description: 'Visi: Membangun ekosistem mahasiswa Informatika yang unggul dalam prestasi dan inovasi teknologi.',
    visi: 'Membangun ekosistem mahasiswa Informatika yang unggul dalam prestasi dan inovasi teknologi.',
    voteCount: 98,
    color: '#3b82f6', // Blue 500
    icon: 'users'
  },
  {
    id: 2,
    ketua: 'Candra Dewi',
    wakil: 'Doni Prasetyo',
    name: 'Paslon 03 - Candra & Doni',
    description: 'Visi: Menjadikan HIMA Informatika sebagai wadah kreativitas dan pengembangan soft skills mahasiswa.',
    visi: 'Menjadikan HIMA Informatika sebagai wadah kreativitas dan pengembangan soft skills mahasiswa.',
    voteCount: 115,
    color: '#10b981', // Emerald 500
    icon: 'users'
  },
  {
    id: 3,
    ketua: 'Eko Kurniawan',
    wakil: 'Fani Rahmawati',
    name: 'Paslon 04 - Eko & Fani',
    description: 'Visi: Menciptakan HIMA Informatika yang transparan, akuntabel, dan pro-aktif dalam menangani aspirasi mahasiswa.',
    visi: 'Menciptakan HIMA Informatika yang transparan, akuntabel, dan pro-aktif dalam menangani aspirasi mahasiswa.',
    voteCount: 87,
    color: '#f59e0b', // Amber 500
    icon: 'users'
  }
];

// Dummy vote history data
const voteHistory = [
  {
    id: 1,
    voter: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    voterShort: '0x742d...0bEb',
    candidateId: 0,
    candidateName: 'Paslon 01 - Ahmad & Siti',
    timestamp: '2024-01-15T10:30:00Z',
    txHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890'
  },
  {
    id: 2,
    voter: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    voterShort: '0x8ba1...DBA72',
    candidateId: 1,
    candidateName: 'Paslon 02 - Budi & Rina',
    timestamp: '2024-01-15T11:45:00Z',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  }
];

// @desc    Get all candidates
// @route   GET /api/votes/candidates
// @access  Public
router.get('/candidates', async (req, res) => {
  try {
    const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

    res.status(200).json({
      success: true,
      count: sortedCandidates.length,
      data: sortedCandidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single candidate by ID
// @route   GET /api/votes/candidate/:id
// @access  Public
router.get('/candidate/:id', async (req, res) => {
  try {
    const candidate = candidates.find(
      c => c.id === parseInt(req.params.id)
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: `Candidate with id ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get voting statistics
// @route   GET /api/votes/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
    const totalCandidates = candidates.length;

    const leadingCandidate = candidates.reduce((a, b) =>
      a.voteCount > b.voteCount ? a : b
    );

    const candidatesWithPercentage = candidates.map(c => ({
      ...c,
      percentage: totalVotes > 0
        ? ((c.voteCount / totalVotes) * 100).toFixed(2)
        : '0.00'
    }));

    const rankedCandidates = [...candidatesWithPercentage]
      .sort((a, b) => b.voteCount - a.voteCount)
      .map((c, index) => ({
        ...c,
        rank: index + 1
      }));

    res.status(200).json({
      success: true,
      data: {
        totalVotes,
        totalCandidates,
        leadingCandidate: {
          id: leadingCandidate.id,
          name: leadingCandidate.name,
          voteCount: leadingCandidate.voteCount
        },
        candidates: rankedCandidates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get voting history
// @route   GET /api/votes/history
// @access  Public
router.get('/history', async (req, res) => {
  try {
    const { candidateId, limit } = req.query;

    let filtered = [...voteHistory];

    if (candidateId !== undefined) {
      filtered = filtered.filter(v =>
        v.candidateId === parseInt(candidateId)
      );
    }

    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get summary statistics
// @route   GET /api/votes/summary
// @access  Public
router.get('/summary', async (req, res) => {
  try {
    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
    const totalCandidates = candidates.length;
    const totalHistory = voteHistory.length;

    const avgVotesPerCandidate = totalCandidates > 0
      ? (totalVotes / totalCandidates).toFixed(2)
      : '0.00';

    const mostRecentVote = voteHistory.length > 0
      ? voteHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
      : null;

    res.status(200).json({
      success: true,
      data: {
        totalVotes,
        totalCandidates,
        totalVotesRecorded: totalHistory,
        averageVotesPerCandidate,
        mostRecentVote: mostRecentVote ? {
          candidateName: mostRecentVote.candidateName,
          timestamp: mostRecentVote.timestamp
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
