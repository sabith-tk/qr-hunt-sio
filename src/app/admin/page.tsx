'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, Database } from 'lucide-react';

type ProgressStat = { scan_count: number; users: number; };
type Winner = { id: number; full_name: string; phone_number: string; timestamp: string; claim_status: boolean | number; };

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<{ totalWinners: number, progressStats: ProgressStat[] } | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);

  const fetchData = async () => {
    try {
      const [mRes, wRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/winners')
      ]);
      const mData = await mRes.json();
      const wData = await wRes.json();
      setMetrics(mData);
      setWinners(wData);
    } catch (e) {
      console.error('Error fetching admin data', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const toggleClaimStatus = async (id: number, currentStatus: boolean | number) => {
    try {
      const res = await fetch(`/api/admin/winners/${id}/claim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_status: !currentStatus })
      });
      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!metrics) return <div style={{ padding: '40px', color: 'white' }}>Loading Admin Dashboard...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Database size={32} className="neon-text-green" style={{ marginRight: '15px' }} />
          <h1 style={{ fontSize: '2rem', letterSpacing: '1px' }}>System Admin <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>| Operations</span></h1>
        </div>
      </header>

      {/* Hero Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <CheckCircle size={40} className="neon-text-green" style={{ marginBottom: '15px' }} />
          <h2 style={{ fontSize: '3rem', margin: 0 }}>{metrics.totalWinners}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Total Winners</p>
        </div>

        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <Users size={24} className="neon-text-purple" style={{ marginRight: '10px' }} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Active Players Progress</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map(level => {
              const stat = metrics.progressStats.find(s => s.scan_count === level);
              const count = stat ? stat.users : 0;
              return (
                <div key={level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Level {level}/5</span>
                  <div style={{ flex: 1, margin: '0 15px', background: 'var(--panel-border)', height: '6px', borderRadius: '3px', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', top: 0, left: 0, height: '100%', 
                      background: 'var(--neon-purple)', borderRadius: '3px',
                      width: `${Math.min((count / 100) * 100, 100)}%` // arbitrary scale for visual
                    }} />
                  </div>
                  <span style={{ fontWeight: 600, width: '30px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '15px' }}>
          Winners Database
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>Full Name</th>
                <th style={{ padding: '15px' }}>Phone Number</th>
                <th style={{ padding: '15px' }}>Timestamp</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Claim Status</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {winners.map(winner => (
                <tr key={winner.id} style={{ borderBottom: '1px solid rgba(40,40,50,0.3)' }}>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>#{winner.id}</td>
                  <td style={{ padding: '15px', fontWeight: 600 }}>{winner.full_name}</td>
                  <td style={{ padding: '15px', fontFamily: 'monospace' }}>{winner.phone_number}</td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(winner.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: winner.claim_status ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 51, 102, 0.1)',
                      color: winner.claim_status ? 'var(--neon-green)' : 'var(--neon-red)'
                    }}>
                      {winner.claim_status ? 'CLAIMED' : 'UNCLAIMED'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleClaimStatus(winner.id, winner.claim_status)}
                      style={{ 
                        background: winner.claim_status ? 'transparent' : 'var(--neon-green)',
                        color: winner.claim_status ? 'var(--text-secondary)' : '#000',
                        border: winner.claim_status ? '1px solid var(--panel-border)' : 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {winner.claim_status ? 'Undo' : 'Mark as Claimed'}
                    </button>
                  </td>
                </tr>
              ))}
              {winners.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No winners recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
