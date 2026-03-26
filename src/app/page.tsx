'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CheckCircle2, Lock, MapPin, Ticket, Unlock, Camera, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

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
  const [userName, setUserName] = useState<string | null>(null);
  
  const [currentScan, setCurrentScan] = useState<Location | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Scanner UI State
  const [showScanner, setShowScanner] = useState(false);

  // Form State
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Welcome Welcome Screen Input
  const [welcomeName, setWelcomeName] = useState('');

  // 1. Fetch Locations & Handle LocalStorage
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));
      
    // LocalStorage Init
    let savedIds = JSON.parse(localStorage.getItem('scannedLocations') || '[]');
    let savedUuid = localStorage.getItem('userUuid');
    let savedName = localStorage.getItem('userName');
    let hasClaimed = localStorage.getItem('hasClaimedTicket') === 'true';

    if (!savedUuid) {
      savedUuid = crypto.randomUUID();
      localStorage.setItem('userUuid', savedUuid);
    }
    
    setUuid(savedUuid);
    setUserName(savedName);
    setScannedIds(savedIds);
    setFormSubmitted(hasClaimed);
    if (savedIds.length >= 5) setIsCompleted(true);
  }, []);

  // Central Function to Process a Scanned Location ID
  const processLocationId = (locId: number) => {
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
  };

  // 2. Handle New Scan via URL Param directly
  useEffect(() => {
    if (!userName || !locationParam || locations.length === 0 || !uuid) return;
    processLocationId(parseInt(locationParam));
    window.history.replaceState({}, '', '/');
  }, [locationParam, locations, uuid, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Handle Scan via In-App Camera
  const handleInAppScan = (text: string) => {
    setShowScanner(false);
    try {
      // Expecting URL like https://qr-hunt-sio.vercel.app/?location=3
      const url = new URL(text);
      const loc = url.searchParams.get('location');
      if (loc) {
        processLocationId(parseInt(loc));
      } else {
        alert("Invalid QR Code Format!");
      }
    } catch(e) {
      alert("Unrecognized or Invalid QR code. Make sure to scan the nodes only!");
    }
  };

  const triggerScanConfetti = () => {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#00ffcc', '#bf00ff'] });
  };

  const triggerMassiveConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00ffcc', '#bf00ff'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00ffcc', '#bf00ff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const submitWelcomeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if(welcomeName.trim()) {
      setUserName(welcomeName.trim());
      localStorage.setItem('userName', welcomeName.trim());
    }
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !phone) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: userName, phone_number: phone })
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

  // Render Initial Welcome Screen If No Name
  if (userName === null) {
    return (
      <main className="container-mobile" style={{ justifyContent: 'center' }}>
        <div className="glass-panel animate-pop-in" style={{ textAlign: 'center' }}>
          <h1 className="neon-text-green" style={{ fontSize: '2rem', marginBottom: '10px' }}>Network Breach</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Initialize connection sequence by identifying yourself.</p>
          <form onSubmit={submitWelcomeForm}>
            <input 
              type="text" 
              required 
              placeholder="Enter your Codename / Full Name" 
              value={welcomeName} 
              autoFocus
              onChange={e => setWelcomeName(e.target.value)} 
            />
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Initialize Hunt</button>
          </form>
        </div>
      </main>
    );
  }

  // Render Target: Digital Ticket (100% and form submitted)
  if (formSubmitted) {
    return (
      <main className="container-mobile" style={{ justifyContent: 'center' }}>
        <div className="ticket animate-pop-in">
          <Ticket size={48} color="var(--neon-green)" style={{ margin: '0 auto 20px' }} />
          <h2 className="neon-text-green" style={{ marginBottom: '10px' }}>VIP TICKET</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Mission Accomplished</p>
          
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '5px' }}>{userName}</h3>
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
          <h1 className="neon-text-purple" style={{ fontSize: '2rem', marginBottom: '15px' }}>Mission Accomplished, {userName}!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            You've successfully tracked down all 5 nodes. Enter your phone number to lock in your victory and claim your exclusive merchandise.
          </p>
          
          <form onSubmit={handleCompletionSubmit} style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Phone Number</label>
            <input 
              type="tel" 
              required 
              placeholder="Enter your phone number" 
              value={phone} 
              autoFocus
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

  // Render Camera Overlay
  if (showScanner) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'black', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'white' }}>Scan Node QR Code</h2>
          <button onClick={() => setShowScanner(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>
            <X size={32} />
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <Scanner 
              onScan={(result) => handleInAppScan(result[0].rawValue)}
              formats={['qr_code']}
            />
          </div>
        </div>
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Position the QR code within the frame to scan.
        </div>
      </div>
    );
  }

  // Render Target: Active Scavenger Hunt
  return (
    <main className="container-mobile">
      <header style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>
          Network <span className="neon-text-green">Breach</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>Agent: <span style={{color: 'white'}}>{userName}</span></p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-secondary)' }}>
          <span>System Override</span>
          <span className="neon-text-green" style={{ fontWeight: 'bold' }}>{scannedIds.length}/5 Nodes</span>
        </div>
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
      </header>

      {/* Floating Action Button for Scanner */}
      <button 
        onClick={() => setShowScanner(true)}
        style={{
          width: '100%',
          padding: '16px',
          background: 'rgba(0, 255, 204, 0.15)',
          border: '1px solid var(--neon-green)',
          color: 'var(--neon-green)',
          borderRadius: '12px',
          fontFamily: 'var(--font-heading)',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
        className="animate-pop-in"
      >
        <Camera style={{ marginRight: '10px' }} /> Activate Scanner
      </button>

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
          <p style={{ color: 'var(--text-secondary)' }}>Locate and scan a QR node using the button above to begin decrypting the system.</p>
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
