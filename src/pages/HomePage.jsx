import { useEffect, useState } from 'react';

const palette = ['#16a34a', '#f59e0b', '#0f766e', '#2563eb', '#dc2626', '#7c3aed'];

function HomePage() {
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showPrize, setShowPrize] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [copied, setCopied] = useState(false);
  // process is not recognized in the browser, so we need to ensure that we are using the correct environment variable for the backend URL.

  const backendUrl = import.meta.env.VITE_BACKEND_URL;


  useEffect(() => {
    fetch(`${backendUrl}/api/spot`)
      .then((res) => res.json())
      .then((data) => setSpots(Array.isArray(data) ? data : []))
      .catch(() => setSpots([]));

    // Load from localStorage if already played
    const savedSpot = localStorage.getItem('wonSpot');
    if (savedSpot) {
      try {
        const parsed = JSON.parse(savedSpot);
        if (parsed && parsed.name) {
          setSelectedSpot(parsed);
          setHasPlayed(true);
        }
      } catch (err) {
        console.error('Error parsing saved spot', err);
      }
    }
  }, []);

  const handleSpin = async () => {
    if (loading || hasPlayed) return;

    if (!spots.length) {
      setSelectedSpot(null);
      setShowPrize(false);
      return;
    }

    setLoading(true);
    setSelectedSpot(null);
    setShowPrize(false);

    try {
      const res = await fetch(`${backendUrl}/api/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.spot) {
        throw new Error(data?.message || 'No eligible spot');
      }

      const index = spots.findIndex((spot) => spot._id === data.spot._id);
      if (index >= 0) {
        const segmentAngle = 360 / spots.length;
        const targetAngle = segmentAngle / 2 + index * segmentAngle;
        const nextRotation = rotation + 360 * 6 + (360 - targetAngle);
        setRotation(nextRotation);

        window.setTimeout(() => {
          setSelectedSpot(data.spot);
          setShowPrize(true);
          setHasPlayed(true);
          setLoading(false);
          localStorage.setItem('wonSpot', JSON.stringify(data.spot));
        }, 6500);
        return;
      }

      setSelectedSpot(data.spot);
      setShowPrize(true);
      setHasPlayed(true);
      setLoading(false);
      localStorage.setItem('wonSpot', JSON.stringify(data.spot));
    } catch (error) {
      console.error(error);
      setSelectedSpot(null);
      setShowPrize(false);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wheelBackground = spots.length
    ? `conic-gradient(${spots
        .map((spot, index) => `${palette[index % palette.length]} 0 ${(index + 1) * (360 / spots.length)}deg`)
        .join(', ')})`
    : 'conic-gradient(#222 0 100%)';

  const promoCode = selectedSpot
    ? `ETHANOL-${(selectedSpot.name || 'VIP').slice(0, 4).toUpperCase()}-${(selectedSpot.value || 'PR').replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase()}`
    : '';


  return (
    <main className="page home-page">
      <section className="hero-card hero-spotlight">
        <div>
          <p className="eyebrow">إيثانول • سيارات • خصومات حية</p>
          <h1>لف العجلة واكتشف كود خصم على الإيثانول أو مزايا مميزة لسيارتك</h1>
          <p>كل دورة تمنحك فرصة جديدة للحصول على عرض خاص، سواءً لشراء الإيثانول أو للاستفادة من خدمات السيارات المميزة.</p>
        </div>
        <div className="hero-badge">خصومات فورية</div>
      </section>

      {hasPlayed && selectedSpot && (
        <section className="hero-card active-coupon-section animate-fade-in">
          <div className="coupon-card-header">
            <span className="live-indicator">كوبونك النشط الحالي 🏷️</span>
            <h3>{selectedSpot.name}</h3>
            <p>{selectedSpot.description}</p>
          </div>
          <div className="coupon-card-body">
            <span className="coupon-value">{selectedSpot.value}</span>
            <div className="coupon-box-glow">
              <span className="code-label">كود الخصم الخاص بك:</span>
              <strong className="code-text">{promoCode}</strong>
              <button className="copy-btn-action" onClick={handleCopy}>
                {copied ? '✓ تم النسخ!' : '📋 نسخ الكود'}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="wheel-panel">
        <div className="wheel-stage">
          <div className="pointer" aria-hidden="true" />
          <div className="wheel" style={{ background: wheelBackground, transform: `rotate(${rotation}deg)` }}>
            <button className="wheel-center" onClick={handleSpin} disabled={loading || hasPlayed}>
              {loading ? 'جاري التدوير...' : hasPlayed ? 'انتهت المحاولة 🔒' : 'لف العجلة الآن'}
            </button>
            {spots.length > 0 && (
              <div className="wheel-labels">
                {spots.map((spot, index) => {
                  const angle = (index + 0.5) * (360 / spots.length);
                  const x = 50 + Math.cos(((angle - 90) * Math.PI) / 180) * 34;
                  const y = 50 + Math.sin(((angle - 90) * Math.PI) / 180) * 34;
                  return (
                    <div
                      key={spot._id}
                      className="wheel-label"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <span>{spot.name}</span>
                      <small>{spot.description}</small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </section>

      {showPrize && selectedSpot && (
        <div className="prize-overlay" role="dialog" aria-modal="true">
          <div className="result-card prize-modal">
            <p className="eyebrow">مبروك! خصمك جاهز 🎉</p>
            <h2>{selectedSpot.name}</h2>
            <p className="prize-value">{selectedSpot.value}</p>
            <div className="promo-box">
              <span>كود الخصم</span>
              <strong>{promoCode}</strong>
            </div>
            <p>استخدم هذا الكود عند شراء الإيثانول أو خلال أي خدمة سيارات مميزة من فريقنا.</p>
            <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="copy-btn-action" onClick={handleCopy}>
                {copied ? '✓ تم النسخ!' : '📋 نسخ الكود'}
              </button>
              <button className="secondary-btn" onClick={() => setShowPrize(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );

}

export default HomePage;
