# Web3 Voting dApp - E-Voting Ketua HIMA Informatika

Sistem voting berbasis blockchain untuk pemilihan Ketua HIMA Informatika, dibangun dengan React.js, Node.js/Express.js, dan Solidity smart contracts pada Sepolia testnet.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-ISC-blue)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.0-black)

## Daftar Isi

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi & Menjalankan Aplikasi](#instalasi--menjalankan-aplikasi)
  - [Clone Repository](#1-clone-repository)
  - [Setup Backend](#2-setup-backend)
  - [Setup Frontend](#3-setup-frontend)
  - [Buka Aplikasi di Browser](#4-buka-aplikasi-di-browser)
- [Deploy Smart Contract (Wajib Dilakukan)](#deploy-smart-contract-wajib-dilakukan)
  - [Opsi 1: Menggunakan Remix IDE](#opsi-1-menggunakan-remix-ide-recommended---mudah)
  - [Opsi 2: Menggunakan Hardhat](#opsi-2-menggunakan-hardhat-advanced)
- [Update Contract Address di Frontend](#update-contract-address-di-frontend)
- [Customization - Mengubah Nama Paslon](#customization--mengubah-nama-paslon)
- [Struktur Project](#struktur-project)
- [API Endpoints](#api-endpoints)
- [Smart Contract Functions](#smart-contract-functions)
- [Environment Variables](#environment-variables)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)
- [Links & Resources](#links--resources)

---

## Features

- Voting berbasis blockchain (transparan & tidak dapat dimanipulasi)
- Wallet connection via MetaMask
- Network switching ke Sepolia Testnet
- Hybrid data fetching (Blockchain + API fallback)
- Real-time vote counting
- Dark theme UI
- Responsive design (mobile & desktop)
- One address, one vote (anti-fraud)

## Tech Stack

### Frontend

- React 19.2.0 + Vite
- Ethers.js 6.16.0 (Web3 interaction)
- CSS Variables (Dark Theme)

### Backend

- Node.js + Express 5.2.1
- CORS enabled
- RESTful API

### Blockchain

- Solidity Smart Contract
- Sepolia Testnet
- Remix IDE (for deployment)

## Prerequisites

Sebelum memulai, pastikan Anda sudah menginstall:

- **Node.js** (v18 atau lebih tinggi) - [Download](https://nodejs.org/)
- **npm** (biasanya terinstall bersama Node.js)
- **MetaMask Extension** - [Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/)
- **Sepolia ETH** (testnet ETH untuk gas fee) - [Faucet](https://sepoliafaucet.com)

## Instalasi & Menjalankan Aplikasi

### 1. Clone Repository

```bash
git clone https://github.com/XsafiD/UAS-web3-dApp-voting.git
cd UAS-web3-dApp-voting
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Buat file `.env` di folder backend:

```bash
PORT=5000
NODE_ENV=development
```

Jalankan backend:

```bash
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

Buka terminal baru (biarkan backend tetap jalan):

```bash
cd frontend
npm install
cp .env.example .env
```

**PENTING:** Sebelum menjalankan frontend, Anda harus mengedit file `.env` dan mengisi `VITE_CONTRACT_ADDRESS` dengan alamat smart contract yang sudah di-deploy (lihat panduan deploy di bawah).

File `.env` frontend:

```bash
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
VITE_SEPOLIA_CHAIN_ID=11155111
```

Jalankan frontend:

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 4. Buka Aplikasi di Browser

Buka `http://localhost:5173` dan connect wallet MetaMask Anda.

---

## Deploy Smart Contract (Wajib Dilakukan)

Smart contract harus di-deploy terlebih dahulu sebelum aplikasi bisa digunakan. Ikuti langkah-langkah berikut:

### Opsi 1: Menggunakan Remix IDE (Recommended - Mudah)

1. **Buka Remix IDE**: https://remix.ethereum.org

2. **Buat File Baru**
   - Klik "+" di folder "contracts"
   - Beri nama: `VotingContract.sol`

3. **Paste Smart Contract Code**

   Copy code smart contract berikut (atau gunakan file yang tersedia):

   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   contract VotingContract {
       struct Candidate {
           uint256 id;
           string name;
           string ketua;
           string wakil;
           string visi;
           uint256 voteCount;
           bool exists;
       }

       mapping(uint256 => Candidate) public candidates;
       mapping(address => bool) public hasVoted;
       mapping(address => uint256) public voterChoice;

       uint256 public candidateCount;
       uint256 public totalVotes;
       bool public votingActive = true;
       address public admin;

       event CandidateAdded(uint256 indexed candidateId, string name);
       event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
       event VotingStatusChanged(bool isActive);

       modifier onlyAdmin() {
           require(msg.sender == admin, "Only admin can perform this action");
           _;
       }

       modifier votingActiveOnly() {
           require(votingActive, "Voting is not active");
           _;
       }

       constructor() {
           admin = msg.sender;
       }

       function addCandidate(string memory _name, string memory _ketua, string memory _wakil, string memory _visi) public onlyAdmin {
           candidateCount++;
           candidates[candidateCount] = Candidate({
               id: candidateCount,
               name: _name,
               ketua: _ketua,
               wakil: _wakil,
               visi: _visi,
               voteCount: 0,
               exists: true
           });
           emit CandidateAdded(candidateCount, _name);
       }

       function vote(uint256 _candidateId) public votingActiveOnly {
           require(!hasVoted[msg.sender], "Anda sudah memberikan suara");
           require(candidates[_candidateId].exists, "Invalid candidate");

           hasVoted[msg.sender] = true;
           voterChoice[msg.sender] = _candidateId;
           candidates[_candidateId].voteCount++;
           totalVotes++;

           emit VoteCast(msg.sender, _candidateId, block.timestamp);
       }

       function getAllCandidates() public view returns (Candidate[] memory) {
           Candidate[] memory allCandidates = new Candidate[](candidateCount);
           for (uint256 i = 1; i <= candidateCount; i++) {
               allCandidates[i - 1] = candidates[i];
           }
           return allCandidates;
       }

       function getCandidate(uint256 _candidateId) public view returns (Candidate memory) {
           require(candidates[_candidateId].exists, "Candidate not found");
           return candidates[_candidateId];
       }

       function getCandidateVoteCount(uint256 _candidateId) public view returns (uint256) {
           return candidates[_candidateId].voteCount;
       }

       function getVotingStats() public view returns (uint256, uint256, bool) {
           return (totalVotes, candidateCount, votingActive);
       }

       function getLeadingCandidate() public view returns (uint256) {
           uint256 leadingId = 1;
           uint256 maxVotes = 0;

           for (uint256 i = 1; i <= candidateCount; i++) {
               if (candidates[i].voteCount > maxVotes) {
                   maxVotes = candidates[i].voteCount;
                   leadingId = i;
               }
           }
           return leadingId;
       }

       function getResults() public view returns (uint256[] memory) {
           uint256[] memory results = new uint256[](candidateCount);
           for (uint256 i = 1; i <= candidateCount; i++) {
               results[i - 1] = candidates[i].voteCount;
           }
           return results;
       }

       function checkIfVoted(address _voter) public view returns (bool) {
           return hasVoted[_voter];
       }

       function getVoterChoice(address _voter) public view returns (uint256) {
           return voterChoice[_voter];
       }

       function setVotingStatus(bool _status) public onlyAdmin {
           votingActive = _status;
           emit VotingStatusChanged(_status);
       }

       function transferAdmin(address _newAdmin) public onlyAdmin {
           admin = _newAdmin;
       }
   }
   ```

4. **Compile Contract**
   - Pilih tab "Solidity Compiler" di kiri
   - Pilih compiler version: `0.8.0` atau lebih tinggi
   - Klik "Compile VotingContract.sol"

5. **Deploy ke Sepolia Testnet**
   - Pilih tab "Deploy & Run Transactions"
   - Di bagian "Environment", pilih "Injected Provider - MetaMask"
   - MetaMask akan terbuka, klik "Next" dan "Connect"
   - Pastikan Anda di Sepolia Testnet (Chain ID: 11155111)
   - Klik tombol "Deploy"

6. **Salin Contract Address**
   - Setelah deploy berhasil, contract akan muncul di bagian bawah
   - Klik pada contract yang sudah di-deploy
   - **Copy contract address** (format: `0x...`)
   - Simpan address ini untuk langkah selanjutnya!

7. **Tambahkan Kandidat**
   - Setelah deploy, expand contract di panel "Deployed Contracts"
   - Buka fungsi `addCandidate`
   - Masukkan data untuk setiap kandidat:
     - `_name`: Nama paslon (cth: "Paslon 01 - Ahmad & Siti")
     - `_ketua`: Nama ketua (cth: "Ahmad Pratama")
     - `_wakil`: Nama wakil (cth: "Siti Aminah")
     - `_visi`: Visi paslon
   - Klik "Transact" dan konfirmasi di MetaMask
   - Ulangi untuk semua kandidat

### Opsi 2: Menggunakan Hardhat (Advanced)

Jika Anda sudah familiar dengan Hardhat:

```bash
# Install Hardhat (jika belum)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Setup Hardhat project
npx hardhat init
```

---

## Update Contract Address di Frontend

Setelah smart contract di-deploy, update contract address di frontend:

### 1. Update file `.env` di folder frontend:

```bash
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0xGANTI_DENGAN_CONTRACT_ADDRESS_ANDA
VITE_SEPOLIA_CHAIN_ID=11155111
```

### 2. Restart Frontend

```bash
# Stop frontend (Ctrl+C)
# Jalankan lagi
npm run dev
```

### 3. Verifikasi

Buka aplikasi di browser, jika berhasil:

- Akan muncul tanda 🔗 di sebelah judul "Voting"
- Hasil voting menampilkan "(Blockchain)" bukan "(Backend)"

---

## Customization - Mengubah Nama Paslon

Ada 2 tempat yang perlu diupdate jika ingin mengubah data paslon:

### 1. Backend API (Dummy Data untuk Fallback)

Edit file `backend/routes/votes.js`:

```javascript
const candidates = [
  {
    id: 0,
    ketua: "Ahmad Pratama", // Ganti nama ketua
    wakil: "Siti Aminah", // Ganti nama wakil
    name: "Paslon 01 - Ahmad & Siti", // Ganti nama paslon
    description: "Visi: ...", // Ganti deskripsi
    visi: "Visi: ...", // Ganti visi
    voteCount: 142,
    color: "#8b5cf6",
    icon: "users",
  },
  // Tambahkan paslon lainnya di sini
];
```

### 2. Smart Contract (Blockchain)

Jika smart contract sudah di-deploy, Anda tidak bisa mengubah kandidat yang sudah ada. Tapi Anda bisa:

**Opsi A: Deploy ulang contract dengan data baru**

1. Ulangi langkah deploy di atas
2. Saat `addCandidate`, masukkan data kandidat baru

**Opsi B: Tambah kandidat baru di contract yang sudah ada**

1. Buka Remix IDE
2. Load contract yang sudah di-deploy
3. Gunakan fungsi `addCandidate` untuk menambah kandidat baru

**Opsi C: Reset dan deploy baru (paling mudah)**

1. Deploy contract baru
2. Update `VITE_CONTRACT_ADDRESS` di `.env`
3. Tambahkan semua kandidat dengan data baru

---

## Struktur Project

```
revisi/
├── backend/                 # Node.js/Express API
│   ├── routes/
│   │   └── votes.js        # API endpoints
│   ├── server.js           # Express server
│   └── package.json
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.jsx    # MetaMask connection
│   │   │   ├── VotingInterface.jsx  # Vote submission
│   │   │   ├── VoteResults.jsx      # Results display
│   │   │   └── NetworkSwitch.jsx    # Network switching
│   │   ├── contracts/
│   │   │   └── abi.json             # Smart contract ABI
│   │   ├── App.jsx
│   │   └── App.css                  # Dark theme styles
│   └── package.json
│
└── README.md
```

---

## API Endpoints

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| GET    | `/`                        | API info            |
| GET    | `/api/votes/candidates`    | Semua kandidat      |
| GET    | `/api/votes/candidate/:id` | Detail kandidat     |
| GET    | `/api/votes/stats`         | Statistik voting    |
| GET    | `/api/votes/history`       | Riwayat voting      |
| GET    | `/api/votes/summary`       | Ringkasan statistik |

---

## Smart Contract Functions

| Function                             | Description                    |
| ------------------------------------ | ------------------------------ |
| `vote(uint256 _candidateId)`         | Vote untuk kandidat            |
| `getAllCandidates()`                 | Ambil semua kandidat           |
| `getCandidate(uint256 _candidateId)` | Ambil detail kandidat          |
| `checkIfVoted(address _voter)`       | Cek apakah sudah vote          |
| `getVotingStats()`                   | Statistik voting               |
| `getLeadingCandidate()`              | Kandidat terdepan              |
| `addCandidate(...)`                  | Tambah kandidat (admin only)   |
| `setVotingStatus(bool)`              | Set status voting (admin only) |

---

## Environment Variables

### Backend (.env)

```bash
PORT=5000
NODE_ENV=development
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0x...
VITE_SEPOLIA_CHAIN_ID=11155111
```

---

## FAQ

### Q: Apakah harus deploy smart contract sendiri?

**A:** Ya, smart contract harus di-deploy ke Sepolia testnet agar aplikasi bisa berfungsi. Gunakan Remix IDE untuk kemudahan.

### Q: Berapa biaya deploy smart contract?

**A:** Deploy ke Sepolia Testnet GRATIS. Anda hanya perlu Sepolia ETH (bisa didapat dari faucet) untuk gas fee.

### Q: Apakah bisa mengubah kandidat setelah deploy?

**A:** Bisa, dengan fungsi `addCandidate` di Remix IDE. Tapi kandidat yang sudah ditambah tidak bisa dihapus.

### Q: Apakah satu address bisa vote lebih dari sekali?

**A:** Tidak bisa. Smart contract membatasi satu address hanya bisa satu vote.

### Q: Bagaimana jika voting belum dimulai?

**A:** Admin bisa mematikan voting dengan fungsi `setVotingStatus(false)` di Remix IDE.

### Q: Bagaimana cara cek hasil voting di blockchain?

**A:** Buka Sepolia Etherscan dan masukkan contract address Anda.

---

## Troubleshooting

### MetaMask tidak terdeteksi

- Pastikan MetaMask extension sudah terinstall
- Refresh halaman browser
- Cek apakah MetaMask sudah unlock

### Gagal connect ke wallet

- Buka MetaMask dan pastikan tidak ada pending request
- Coba refresh dan connect lagi

### Wrong Network

- Klik tombol "Switch to Sepolia" di aplikasi
- Atau switch manual di MetaMask ke Sepolia Testnet

### Smart contract error

- Pastikan `VITE_CONTRACT_ADDRESS` di `.env` sudah benar
- Cek apakah contract sudah di-deploy di Sepolia
- Restart frontend setelah update `.env`

### Tidak bisa vote

- Pastikan saldo ETH cukup untuk gas fee
- Cek apakah sudah vote sebelumnya (satu address = satu vote)
- Pastikan voting status aktif

### Data kandidat tidak muncul

- Pastikan backend sudah jalan di port 5000
- Cek console browser untuk error
- Tambahkan minimal 1 kandidat di smart contract

---

## Contributing

Contributions are welcome! Silakan fork dan buat pull request.

## License

[ISC](LICENSE)

---

## Authors

[XsafiD](https://github.com/XsafiD)

Dibuat untuk UAS Pemrograman Web - Universitas Nahdlatul Ulama Yogyakarta

---

## Links & Resources

- **Sepolia Faucet**: https://sepoliafaucet.com
- **Remix IDE**: https://remix.ethereum.org
- **Sepolia Etherscan**: https://sepolia.etherscan.io
- **MetaMask**: https://metamask.io
- **React Docs**: https://react.dev
- **Ethers.js Docs**: https://docs.ethers.org
- **Solidity Docs**: https://docs.soliditylang.org
