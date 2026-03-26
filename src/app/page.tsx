'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CheckCircle2, Lock, MapPin, Ticket, Unlock } from 'lucide-react';

type Location = { id: number; name: string; valuable_message: string; hint_for_others: string; };

export default function Home() {
  return (
    <Suspense fallback={<div className="container-mobile"><p>Loading...</p></div>}>
      <ScavengerApp />
    </Suspense>
  )
}

function ScavengerApp() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location');

  const [locations, setLocations] = useState<Location[]>([]);
  const [scannedIds, setScannedIds] = useState<number[]>([]);
  const [uuid, setUuid] = useState<string>('');
  const [currentScan, setCurrentScan] = useState<Location | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [claimStatus, setClaimStatus] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Locations & Handle LocalStorage
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));
      
    // LocalStorage Init
    let savedIds = JSON.parse(localStorage.getItem('scannedLocations') || '[]');
    let savedUuid = localStorage.getItem('userUuid');
    let hasClaimed = localStorage.getItem('hasClaimedTicket') === 'true';

    if (!savedUuid) {
      savedUuid = crypto.randomUUID();
      localStorage.setItem('userUuid', savedUuid);
    }
    
    setUuid(savedUuid);
    setScannedIds(savedIds);
    setFormSubmitted(hasClaimed);
    if (savedIds.length >= 5) setIsCompleted(true);
  }, []);

  // 2. Handle New Scan via URL Param
  useEffect(() => {
    if (!locationParam || locations.length === 0 || !uuid) return;
    
    const locId = parseInt(locationParam);
    if (isNaN(locId) || locId < 1 || locId > 5) return;

    let updatedIds = [...scannedIds];
    const loc = locations.find(l => l.id === locId);
    
    if (loc && !updatedIds.includes(locId)) {
      updatedIds.push(locId);
      setScannedIds(updatedIds);
      localStorage.setItem('scannedLocations', JSON.stringify(updatedIds));
      setCurrentScan(loc);

      // Ping Progress API
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, scan_count: updatedIds.length })
      });

      if (updatedIds.length === 5) {
        setIsCompleted(true);
        triggerMassiveConfetti();
      } else {
        triggerScanConfetti();
      }
    } else if (loc && updatedIds.includes(locId)) {
      setCurrentScan(loc);
    }
    
    // Remove query param to clean URL after processing using History API
    window.history.replaceState({}, '', '/');
  }, [locationParam, locations, uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerScanConfetti = () => {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#00ffcc', '#bf00ff'] });
  };

  const triggerMassiveConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00ffcc', '#bf00ff']
      });
      confetti({
        particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00ffcc', '#bf00ff']
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, phone_number: phone })
      });
      if (res.ok) {
        setFormSubmitted(true);
        localStorage.setItem('hasClaimedTicket', 'true');
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Target: Digital Ticket (100% and form submitted)
  if (formSubmitted) {
    return (
      <main className="container-mobile" style={{ justifyContent: 'center' }}>
        <div className="ticket animate-pop-in">
          <Ticket size={48} color="var(--neon-green)" style={{ margin: '0 auto 20px' }} />
          <h2 className="neon-text-green" style={{ marginBottom: '10px' }}>VIP TICKET</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Mission Accomplished</p>
          
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '5px' }}>{name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{phone}</p>
          </div>
          
          <p style={{ fontWeight: 600, color: 'white', borderTop: '1px dashed var(--panel-border)', paddingTop: '20px' }}>
            Show this screen at the ATM circle at 4:00 PM to collect your gift.
          </p>
          <p style={{ color: 'var(--neon-red)', fontSize: '0.8rem', marginTop: '10px', fontWeight: 'bold' }}>
            Do not refresh or close this tab!
          </p>
        </div>
      </main>
    );
  }

  // Render Target: 100% Completed, Needs to submit form
  if (isCompleted) {
    return (
      <main className="container-mobile animate-pop-in" style={{ justifyContent: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={64} className="neon-text-purple" style={{ margin: '0 auto 20px', color: 'var(--neon-purple)' }} />
          <h1 className="neon-text-purple" style={{ fontSize: '2rem', marginBottom: '15px' }}>Mission Accomplished!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            You've successfully tracked down all 5 nodes. Enter your details to lock in your victory and claim your exclusive merchandise.
          </p>
          
          <form onSubmit={handleFormSubmit} style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" 
              required 
              placeholder="Enter your full name" 
              value={name} 
              onChange={res => setName(res.target.value)} 
            />
            
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', marginTop: '10px' }}>Phone Number</label>
            <input 
              type="tel" 
              required 
              placeholder="Enter your phone number" 
              value={phone} 
              onChange={res => setPhone(res.target.value)} 
            />
            
            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Claim My Prize'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const progressPct = (scannedIds.length / 5) * 100;
  const missingLocations = locations.filter(l => !scannedIds.includes(l.id));

  // Render Target: Active Scavenger Hunt
  return (
    <main className="container-mobile">
      <header style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
          Network <span className="neon-text-green">Breach</span>
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-secondary)' }}>
          <span>System Override</span>
          <span className="neon-text-green" style={{ fontWeight: 'bold' }}>{scannedIds.length}/5 Nodes</span>
        </div>
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
      </header>

      {currentScan && (
        <section className="glass-panel animate-slide-up" style={{ marginBottom: '30px', borderLeft: '4px solid var(--neon-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Unlock size={24} className="neon-text-green" style={{ marginRight: '10px', color: 'var(--neon-green)' }} />
            <h2 style={{ fontSize: '1.2rem', color: 'white' }}>Node Unlocked</h2>
          </div>
          <p style={{ fontStyle: 'italic', color: '#e0e0e0', lineHeight: 1.6 }}>"{currentScan.valuable_message}"</p>
        </section>
      )}

      {scannedIds.length === 0 && !currentScan && (
        <section className="glass-panel" style={{ marginBottom: '30px', textAlign: 'center' }}>
          <MapPin size={40} className="neon-text-purple" style={{ margin: '0 auto 15px', color:'var(--neon-purple)' }} />
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Awaiting Scan</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Locate and scan a QR node to begin decrypting the system.</p>
        </section>
      )}

      <section>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Missing Clues
        </h3>
        {missingLocations.map(loc => (
          <div key={loc.id} className="glass-panel" style={{ marginBottom: '15px', opacity: 0.8, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Lock size={20} style={{ color: 'var(--text-secondary)', marginRight: '12px', marginTop: '2px' }} />
              <div>
                <h4 style={{ color: 'white', marginBottom: '5px' }}>Encrypted Node {loc.id}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hint: {loc.hint_for_others}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
