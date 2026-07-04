import { useEffect, useState } from 'react';

function DashboardPage() {
  const [spots, setSpots] = useState([]);
  const [form, setForm] = useState({ name: '', value: '', description: '', amount: 0, isMain: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const loadSpots = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/spot`, { credentials: 'include' });
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : []);
    } catch (error) {
      setSpots([]);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/auth/status`, { credentials: 'include' });
      const data = await res.json();
      setIsAdmin(res.ok && Boolean(data.ok));
      if (!res.ok || !data.ok) {
        setMessage('');
      }
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    loadSpots();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backendUrl}/api/auth?password=${encodeURIComponent(password)}`, { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok && data.ok) {
        setIsAdmin(true);
        setMessage('تمت المصادقة بنجاح');
        loadSpots();
      } else {
        setMessage(data.message || 'كلمة المرور غير صحيحة');
      }
    } catch (error) {
      setMessage('خطأ في الاتصال بالخادم');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setMessage('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${backendUrl}/api/spot/${editingId}` : `${backendUrl}/api/spot`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        if (editingId) {
          setSpots((prev) => prev.map((spot) => (spot._id === editingId ? data : spot)));
          setMessage('تم تعديل العرض بنجاح');
        } else {
          setSpots((prev) => [...prev, data]);
          setMessage('تمت إضافة العرض بنجاح');
        }
        setForm({ name: '', value: '', description: '', amount: 0, isMain: false });
        setEditingId(null);
      } else {
        setMessage(data.message || (editingId ? 'فشل التعديل' : 'فشل الإضافة'));
      }
    } catch (error) {
      setMessage('خطأ في الاتصال');
    }
  };

  const handleEdit = (spot) => {
    setEditingId(spot._id);
    setForm({
      name: spot.name || '',
      value: spot.value || '',
      description: spot.description || '',
      amount: Number(spot.amount) || 0,
      isMain: Boolean(spot.isMain),
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/spot/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSpots((prev) => prev.filter((spot) => spot._id !== id));
        setMessage('تم حذف العرض بنجاح');
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || 'فشل الحذف');
      }
    } catch (error) {
      setMessage('خطأ في الاتصال');
    }
  };

  if (checkingAuth) {
    return (
      <main className="page dashboard-page">
        <section className="hero-card">
          <h1>لوحة الإدارة</h1>
          <p>جاري التحقق من الجلسة...</p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="page dashboard-page">
        <section className="hero-card">
          <h1>لوحة الإدارة</h1>
          <p>أدخل كلمة المرور للوصول إلى إدارة السبوتات.</p>
        </section>

        <form onSubmit={handleAuth} className="dashboard-form">
          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">دخول</button>
        </form>

        {message && <p>{message}</p>}
      </main>
    );
  }

  return (
    <main className="page dashboard-page">
      <section className="hero-card dashboard-hero">
        <div>
          <h1>لوحة الإدارة</h1>
          <p>أضف، عدل أو احذف العروض التي تظهر في العجلة.</p>
        </div>
        <div className="hero-badge">إدارة سريعة</div>
      </section>

      <form onSubmit={handleSubmit} className="dashboard-form">
        <input placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="القيمة" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <input placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" placeholder="الكمية" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        <label className="switch-row">
          <input type="checkbox" checked={Boolean(form.isMain)} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} />
          <span>تفعيل هذا السبوت</span>
        </label>
        <button type="submit">{editingId ? 'تعديل سبوت' : 'إضافة سبوت'}</button>
        {editingId && (
          <button type="button" className="secondary-btn" onClick={() => { setEditingId(null); setForm({ name: '', value: '', description: '', amount: 0, isMain: false }); }}>
            إلغاء
          </button>
        )}
      </form>

      {message && <p>{message}</p>}

      <section className="dashboard-list">
        {spots.map((spot) => (
          <div key={spot._id} className="spot-card dashboard-card">
            <div>
              <h3>{spot.name}</h3>
              <p>{spot.description}</p>
            </div>
            <div className="dashboard-meta">
              <strong>{spot.amount > 0 ? spot.value : '—'}</strong>
              <small>{spot.amount}</small>
              <div className="dashboard-actions">
                <button type="button" className="secondary-btn" onClick={() => handleEdit(spot)}>تعديل</button>
                <button type="button" className="danger-btn" onClick={() => handleDelete(spot._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default DashboardPage;
