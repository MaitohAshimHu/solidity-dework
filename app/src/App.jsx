import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import abi from './deworkAbi/dework.json';
import './App.css';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// ─── Toast ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast: addToast, dismiss };
}

function ToastContainer({ toasts, dismiss }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{icons[t.type]}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-msg">{t.message}</div>}
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const weiToEth = wei => {
  try { return parseFloat(ethers.formatEther(wei.toString())).toFixed(6) + ' ETH'; }
  catch { return wei.toString() + ' wei'; }
};

const shortAddr = addr => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—';
const tsToDate  = ts => {
  try {
    const n = Number(ts);
    if (!n) return '—';
    return new Date(n * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return '—'; }
};

function getError(e) {
  // Try to surface a friendly revert reason
  const msg = e?.reason || e?.data?.message || e?.shortMessage || e?.message || 'Transaction failed';
  return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
}

// ─── Shared FormInput ─────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ address, onConnect }) {
  const connected = address && address !== 'Not Connected';
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="logo">
          <div className="logo-icon">⛓</div>
          Dework
        </div>
        <button
          className={`wallet-btn${connected ? ' connected' : ''}`}
          onClick={!connected ? onConnect : undefined}
        >
          {connected && <span className="wallet-dot" />}
          {connected ? shortAddr(address) : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  );
}

// ─── FREELANCER TAB ───────────────────────────────────────────────────────────
function FreelancerTab({ contract, toast }) {
  // Register
  const [regForm, setRegForm] = useState({ name: '', experience: '', rate: '' });
  const [regLoading, setRegLoading] = useState(false);

  // Lookup
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setRegLoading(true);
    try {
      const tx = await contract.registerFreelancerProfile(
        regForm.name,
        Number(regForm.experience),
        BigInt(regForm.rate),
      );
      await tx.wait();
      toast('success', 'Profile registered!', 'Your freelancer profile is on-chain.');
      setRegForm({ name: '', experience: '', rate: '' });
    } catch (err) {
      toast('error', 'Registration failed', getError(err));
    } finally {
      setRegLoading(false);
    }
  }

  async function handleLookup(e) {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const p = await contract.getFreelancerProfile(BigInt(lookupId));
      setLookupResult(p);
    } catch (err) {
      toast('error', 'Lookup failed', getError(err));
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <div>
      {/* Register */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>👤</span> Register as Freelancer</div>
        </div>
        <form onSubmit={handleRegister}>
          <div className="form-grid cols-2">
            <Field label="Display Name">
              <input
                placeholder="e.g. Alice Smith"
                value={regForm.name}
                onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Years of Experience">
              <input
                type="number" min="0" max="50"
                placeholder="e.g. 5"
                value={regForm.experience}
                onChange={e => setRegForm(f => ({ ...f, experience: e.target.value }))}
                required
              />
            </Field>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <label>Hourly Rate (in Wei)</label>
              <input
                type="number" min="0"
                placeholder="e.g. 1000000000000000 (0.001 ETH)"
                value={regForm.rate}
                onChange={e => setRegForm(f => ({ ...f, rate: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={regLoading}
            >
              {regLoading
                ? <span className="btn-loading">⟳</span>
                : '⚡ Register Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Lookup */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>🔍</span> Lookup Freelancer</div>
        </div>
        <form onSubmit={handleLookup}>
          <div className="form-grid cols-2">
            <Field label="Freelancer ID">
              <input
                type="number" min="0"
                placeholder="e.g. 0"
                value={lookupId}
                onChange={e => setLookupId(e.target.value)}
                required
              />
            </Field>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label style={{ opacity: 0 }}>_</label>
              <button type="submit" className="btn btn-secondary" disabled={lookupLoading}>
                {lookupLoading ? <span className="btn-loading">⟳</span> : '🔍 Fetch'}
              </button>
            </div>
          </div>
        </form>

        {lookupResult && (
          <div className="profile-card">
            <div className="profile-row">
              <span className="key">ID</span>
              <span className="val">{lookupResult.id?.toString()}</span>
            </div>
            <div className="profile-row">
              <span className="key">Name</span>
              <span className="val">{lookupResult.name}</span>
            </div>
            <div className="profile-row">
              <span className="key">Wallet</span>
              <span className="val">{shortAddr(lookupResult.wallet)}</span>
            </div>
            <div className="profile-row">
              <span className="key">Experience</span>
              <span className="val">{lookupResult.experienceYears?.toString()} yrs</span>
            </div>
            <div className="profile-row">
              <span className="key">Hourly Rate</span>
              <span className="val">{weiToEth(lookupResult.hourlyRateWei)}</span>
            </div>
            <div className="profile-row">
              <span className="key">Available</span>
              <span className="val">
                {lookupResult.isAvailableHire
                  ? <span className="badge badge-green">● Available</span>
                  : <span className="badge badge-red">● Unavailable</span>}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EMPLOYER TAB ─────────────────────────────────────────────────────────────
function EmployerTab({ contract, toast }) {
  const [regName, setRegName] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setRegLoading(true);
    try {
      const tx = await contract.registerEmployerProfile(regName);
      await tx.wait();
      toast('success', 'Employer registered!', 'Your employer profile is on-chain.');
      setRegName('');
    } catch (err) {
      toast('error', 'Registration failed', getError(err));
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><span>🏢</span> Register as Employer</div>
      </div>
      <form onSubmit={handleRegister}>
        <Field label="Company / Name">
          <input
            placeholder="e.g. Acme Corp"
            value={regName}
            onChange={e => setRegName(e.target.value)}
            required
          />
        </Field>
        <div className="mt-4">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={regLoading}
          >
            {regLoading ? <span className="btn-loading">⟳</span> : '⚡ Register Employer'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── JOBS TAB ─────────────────────────────────────────────────────────────────
function JobsTab({ contract, toast }) {
  // Create job
  const [createForm, setCreateForm] = useState({
    employerId: '', title: '', description: '', deadline: '', price: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // View jobs
  const [viewEmployerId, setViewEmployerId] = useState('');
  const [jobs, setJobs]           = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Hire freelancer
  const [hireForm, setHireForm]   = useState({ employerId: '', freelancerId: '', jobId: '' });
  const [hireLoading, setHireLoading] = useState(false);

  // Release payment
  const [payForm, setPayForm]     = useState({ employerId: '', jobId: '', freelancerId: '' });
  const [payLoading, setPayLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const price = BigInt(createForm.price);
      // deadline input is in days → convert to seconds
      const deadlineSecs = BigInt(Math.floor(Number(createForm.deadline) * 86400));
      const tx = await contract.createJobListing(
        BigInt(createForm.employerId),
        {
          title:              createForm.title,
          description:        createForm.description,
          deadlineTimestamp:  deadlineSecs,
          fixedPriceInWei:    price,
        },
        { value: price }
      );
      await tx.wait();
      toast('success', 'Job created!', 'Your job listing is live with escrow funded.');
      setCreateForm({ employerId: '', title: '', description: '', deadline: '', price: '' });
    } catch (err) {
      toast('error', 'Create job failed', getError(err));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleViewJobs(e) {
    e.preventDefault();
    setJobsLoading(true);
    setJobs([]);
    try {
      const list = await contract.getJobList(BigInt(viewEmployerId));
      setJobs(list);
      if (list.length === 0) toast('info', 'No jobs found', 'This employer has no job listings yet.');
    } catch (err) {
      toast('error', 'Fetch failed', getError(err));
    } finally {
      setJobsLoading(false);
    }
  }

  async function handleHire(e) {
    e.preventDefault();
    setHireLoading(true);
    try {
      const tx = await contract.hireFreelancer(
        BigInt(hireForm.employerId),
        BigInt(hireForm.freelancerId),
        BigInt(hireForm.jobId),
      );
      await tx.wait();
      toast('success', 'Freelancer hired!', 'The job is now assigned.');
      setHireForm({ employerId: '', freelancerId: '', jobId: '' });
    } catch (err) {
      toast('error', 'Hire failed', getError(err));
    } finally {
      setHireLoading(false);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    setPayLoading(true);
    try {
      const tx = await contract.releaseEscrowPayment(
        BigInt(payForm.employerId),
        BigInt(payForm.jobId),
        BigInt(payForm.freelancerId),
      );
      await tx.wait();
      toast('success', 'Payment released!', 'Escrow funds sent to the freelancer.');
      setPayForm({ employerId: '', jobId: '', freelancerId: '' });
    } catch (err) {
      toast('error', 'Payment failed', getError(err));
    } finally {
      setPayLoading(false);
    }
  }

  function jobStatus(job) {
    if (job.isPaid)              return <span className="badge badge-purple">● Paid</span>;
    if (job.hasHiredFreelancer)  return <span className="badge badge-amber">● In Progress</span>;
    if (job.isOpen)              return <span className="badge badge-green">● Open</span>;
    return                              <span className="badge badge-red">● Closed</span>;
  }

  return (
    <div>
      {/* Create Job */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📋</span> Post a Job</div>
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-grid cols-2">
              <Field label="Your Employer ID">
                <input
                  type="number" min="0"
                  placeholder="e.g. 0"
                  value={createForm.employerId}
                  onChange={e => setCreateForm(f => ({ ...f, employerId: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Deadline (days from now)">
                <input
                  type="number" min="1"
                  placeholder="e.g. 30"
                  value={createForm.deadline}
                  onChange={e => setCreateForm(f => ({ ...f, deadline: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <Field label="Job Title">
              <input
                placeholder="e.g. Build a DeFi Dashboard"
                value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </Field>
            <Field label="Description">
              <textarea
                placeholder="Describe the scope, tech stack, deliverables…"
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </Field>
            <Field label="Fixed Price (Wei) — will be held in escrow">
              <input
                type="number" min="0"
                placeholder="e.g. 10000000000000000 (0.01 ETH)"
                value={createForm.price}
                onChange={e => setCreateForm(f => ({ ...f, price: e.target.value }))}
                required
              />
            </Field>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary btn-full" disabled={createLoading}>
              {createLoading ? <span className="btn-loading">⟳</span> : '🚀 Post Job & Fund Escrow'}
            </button>
          </div>
        </form>
      </div>

      {/* View Jobs */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📂</span> View Job Listings</div>
        </div>
        <form onSubmit={handleViewJobs} style={{ display: 'flex', gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Employer ID</label>
            <input
              type="number" min="0"
              placeholder="e.g. 0"
              value={viewEmployerId}
              onChange={e => setViewEmployerId(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <label style={{ opacity: 0 }}>_</label>
            <button type="submit" className="btn btn-secondary" disabled={jobsLoading}>
              {jobsLoading ? <span className="btn-loading">⟳</span> : '🔍 Load'}
            </button>
          </div>
        </form>

        {jobs.length > 0 && (
          <div className="jobs-grid mt-4">
            {jobs.map((job, i) => (
              <div key={i} className="job-card">
                <div className="job-card-top">
                  <span className="job-title">{job.title}</span>
                  {jobStatus(job)}
                </div>
                <p className="job-desc">{job.description}</p>
                <div className="job-meta">
                  <span>🆔 Job #{job.id?.toString()}</span>
                  <span>💰 {weiToEth(job.fixedPriceInWei)}</span>
                  <span>📅 Deadline: {tsToDate(job.deadlineTimestamp)}</span>
                  {job.hasHiredFreelancer && (
                    <span>👷 Freelancer #{job.hiredFreelancerId?.toString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hire Freelancer */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>🤝</span> Hire a Freelancer</div>
        </div>
        <form onSubmit={handleHire}>
          <div className="form-grid cols-2">
            <Field label="Your Employer ID">
              <input type="number" min="0" placeholder="e.g. 0"
                value={hireForm.employerId}
                onChange={e => setHireForm(f => ({ ...f, employerId: e.target.value }))} required />
            </Field>
            <Field label="Freelancer ID">
              <input type="number" min="0" placeholder="e.g. 0"
                value={hireForm.freelancerId}
                onChange={e => setHireForm(f => ({ ...f, freelancerId: e.target.value }))} required />
            </Field>
            <Field label="Job ID">
              <input type="number" min="0" placeholder="e.g. 0"
                value={hireForm.jobId}
                onChange={e => setHireForm(f => ({ ...f, jobId: e.target.value }))} required />
            </Field>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary" disabled={hireLoading}>
              {hireLoading ? <span className="btn-loading">⟳</span> : '🤝 Hire Freelancer'}
            </button>
          </div>
        </form>
      </div>

      {/* Release Payment */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>💸</span> Release Escrow Payment</div>
        </div>
        <form onSubmit={handlePay}>
          <div className="form-grid cols-2">
            <Field label="Your Employer ID">
              <input type="number" min="0" placeholder="e.g. 0"
                value={payForm.employerId}
                onChange={e => setPayForm(f => ({ ...f, employerId: e.target.value }))} required />
            </Field>
            <Field label="Job ID">
              <input type="number" min="0" placeholder="e.g. 0"
                value={payForm.jobId}
                onChange={e => setPayForm(f => ({ ...f, jobId: e.target.value }))} required />
            </Field>
            <Field label="Freelancer ID">
              <input type="number" min="0" placeholder="e.g. 0"
                value={payForm.freelancerId}
                onChange={e => setPayForm(f => ({ ...f, freelancerId: e.target.value }))} required />
            </Field>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary" disabled={payLoading}>
              {payLoading ? <span className="btn-loading">⟳</span> : '💸 Release Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────────────────────
function StatsTab({ contract, toast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchStats() {
    setLoading(true);
    try {
      const [fl, em, bps, penalty] = await Promise.all([
        contract.getNumberOfRegisteredFreelancers(),
        contract.getNumberOfRegisteredEmployers(),
        contract.BPS_DENOMINATOR(),
        contract.LATE_PENALITY_BPS_PER_DAY(),
      ]);
      setStats({
        freelancers: fl.toString(),
        employers:   em.toString(),
        bps:         bps.toString(),
        penalty:     (Number(penalty) / 100).toFixed(0) + '% / day',
      });
    } catch (err) {
      toast('error', 'Stats fetch failed', getError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><span>📊</span> Platform Stats</div>
        <button className="btn btn-secondary btn-sm" onClick={fetchStats} disabled={loading}>
          {loading ? <span className="btn-loading">⟳</span> : '↻ Refresh'}
        </button>
      </div>

      {!stats ? (
        <div className="empty">
          <div className="icon">📡</div>
          <p>Click Refresh to load on-chain stats.</p>
        </div>
      ) : (
        <div className="profile-card">
          <div className="profile-row">
            <span className="key">👤 Registered Freelancers</span>
            <span className="val">{stats.freelancers}</span>
          </div>
          <div className="profile-row">
            <span className="key">🏢 Registered Employers</span>
            <span className="val">{stats.employers}</span>
          </div>
          <div className="profile-row">
            <span className="key">⚖️ Late Penalty</span>
            <span className="val">{stats.penalty}</span>
          </div>
          <div className="profile-row">
            <span className="key">🔢 BPS Denominator</span>
            <span className="val">{stats.bps}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'freelancer', label: 'Freelancer', icon: '👤' },
  { id: 'employer',   label: 'Employer',   icon: '🏢' },
  { id: 'jobs',       label: 'Jobs',       icon: '📋' },
  { id: 'stats',      label: 'Stats',      icon: '📊' },
];

export default function App() {
  const [address,  setAddress]  = useState(null);
  const [contract, setContract] = useState(null);
  const [tab,      setTab]      = useState('freelancer');
  const { toasts, toast, dismiss } = useToast();

  async function connectWallet() {
    if (!window.ethereum) {
      toast('error', 'MetaMask not found', 'Please install the MetaMask browser extension.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const c        = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setContract(c);
      setAddress(accounts[0]);
      toast('success', 'Wallet connected', shortAddr(accounts[0]));

      // Listen for account changes
      window.ethereum.on('accountsChanged', accs => {
        if (accs.length === 0) { setAddress(null); setContract(null); }
        else setAddress(accs[0]);
      });
    } catch (err) {
      toast('error', 'Connection failed', getError(err));
    }
  }

  const connected = !!address && !!contract;

  return (
    <div className="app">
      <Navbar address={address} onConnect={connectWallet} />

      <main className="main-content">
        {!connected ? (
          <div className="lock-screen">
            <div className="lock-icon">🔐</div>
            <h2>Welcome to Dework</h2>
            <p>
              A decentralized freelance marketplace on Ethereum.
              Connect your MetaMask wallet to get started.
            </p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`tab-btn${tab === t.id ? ' active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab === 'freelancer' && <FreelancerTab contract={contract} toast={toast} />}
            {tab === 'employer'   && <EmployerTab   contract={contract} toast={toast} />}
            {tab === 'jobs'       && <JobsTab       contract={contract} toast={toast} />}
            {tab === 'stats'      && <StatsTab      contract={contract} toast={toast} />}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
