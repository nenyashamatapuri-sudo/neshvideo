'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CATEGORIES,
  type GalleryImage,
  type PortfolioCategory,
  type PortfolioPiece,
} from '@/lib/supabase';

const EMPTY = {
  title: '',
  slug: '',
  description: '',
  category: 'directing' as PortfolioCategory,
  client: '',
  agency: '',
  vimeo_url: '',
  image_url: '',
  storage_path: '',
  coming_soon: false,
  sort_order: 0,
};

const C = {
  ink: '#0c0a0a',
  panel: '#1a1818',
  rule: '#333',
  paper: '#f2ede3',
  dim: '#948b86',
  red: '#e3251b',
  gold: '#e9a733',
};

const label: React.CSSProperties = {
  display: 'block',
  color: C.dim,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
};

const field: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem',
  backgroundColor: C.ink,
  border: `1px solid ${C.rule}`,
  borderRadius: 4,
  color: C.paper,
  fontSize: 14,
  boxSizing: 'border-box',
};

const button = (primary = false): React.CSSProperties => ({
  padding: '0.7rem 1.4rem',
  backgroundColor: primary ? C.red : 'transparent',
  color: primary ? C.paper : C.dim,
  border: primary ? 'none' : `1px solid ${C.rule}`,
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
});

export default function AdminDashboard() {
  const router = useRouter();
  const [pieces, setPieces] = useState<PortfolioPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<PortfolioCategory>('directing');
  const [form, setForm] = useState(EMPTY);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  /** Reads the catalogue. Deliberately free of state, so both the mount effect
   *  and the after-save refresh can use it without ordering surprises. */
  const loadPieces = useCallback(async (): Promise<PortfolioPiece[]> => {
    const response = await fetch('/api/admin/portfolio');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Failed to fetch');
    return Array.isArray(data) ? data : [];
  }, []);

  const fetchPieces = useCallback(async () => {
    try {
      setPieces(await loadPieces());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio pieces');
      setPieces([]);
    } finally {
      setLoading(false);
    }
  }, [loadPieces]);

  useEffect(() => {
    if (!document.cookie.includes('admin_token')) {
      router.push('/admin/login');
      return;
    }

    // A late response must not write into a dashboard that has moved on.
    let live = true;
    loadPieces()
      .then((list) => {
        if (live) setPieces(list);
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : 'Failed to load portfolio pieces');
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [router, loadPieces]);

  /** Sends files to the bucket and hands back what was stored. */
  const upload = async (files: File[]) => {
    const body = new FormData();
    files.forEach((f) => body.append('file', f));
    const response = await fetch('/api/admin/portfolio/upload', { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Upload failed');
    return data.files as { url: string; storage_path: string }[];
  };

  const onThumb = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      const [up] = await upload([files[0]]);
      setForm((f) => ({ ...f, image_url: up.url, storage_path: up.storage_path }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      const up = await upload(Array.from(files));
      setGallery((g) => [
        ...g,
        ...up.map((u, i) => ({ ...u, caption: '', sort_order: g.length + i })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setGallery(next.map((img, i) => ({ ...img, sort_order: i })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const url = editingId ? `/api/admin/portfolio/${editingId}` : '/api/admin/portfolio';

    try {
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          images: gallery.map((img, i) => ({ ...img, sort_order: i })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Save failed');

      await fetchPieces();
      setNotice(`Saved “${form.title}”. Live within 60 seconds.`);
      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save piece');
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (piece: PortfolioPiece) => {
    setEditingId(piece.id);
    setForm({
      title: piece.title,
      slug: piece.slug ?? '',
      description: piece.description ?? '',
      category: piece.category,
      client: piece.client ?? '',
      agency: piece.agency ?? '',
      vimeo_url: piece.vimeo_url ?? '',
      image_url: piece.image_url ?? '',
      storage_path: piece.storage_path ?? '',
      coming_soon: piece.coming_soon ?? false,
      sort_order: piece.sort_order ?? 0,
    });
    setGallery(Array.isArray(piece.images) ? piece.images : []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (piece: PortfolioPiece) => {
    if (!confirm(`Delete “${piece.title}” and its uploaded images?`)) return;
    try {
      const response = await fetch(`/api/admin/portfolio/${piece.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Delete failed');
      fetchPieces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete piece');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY, category: tab });
    setGallery([]);
  };

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY, category: tab, sort_order: pieces.filter((p) => p.category === tab).length });
    setGallery([]);
    setShowForm(true);
  };

  const inTab = pieces.filter((p) => p.category === tab);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.ink, color: C.paper, fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${C.rule}` }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Portfolio Manager</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={startNew} style={button(true)}>+ Add Piece</button>
            <button
              onClick={() => {
                document.cookie = 'admin_token=; path=/; max-age=0';
                router.push('/admin/login');
              }}
              style={button()}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Sections, so the CMS is divided the way the site is. */}
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c, i) => {
            const count = pieces.filter((p) => p.category === c.value).length;
            const active = tab === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setTab(c.value)}
                style={{
                  padding: '0.6rem 1.1rem',
                  backgroundColor: active ? C.panel : 'transparent',
                  color: active ? C.paper : C.dim,
                  border: `1px solid ${active ? C.red : C.rule}`,
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {String(i + 1).padStart(2, '0')} {c.label}
                <span style={{ color: C.dim, marginLeft: 8 }}>{count}</span>
              </button>
            );
          })}
        </nav>

        {error && (
          <div style={{ backgroundColor: 'rgba(227,37,27,0.1)', border: `1px solid ${C.red}`, color: C.red, padding: '1rem', borderRadius: 4, marginBottom: '1.5rem', fontSize: 14 }}>
            {error}
          </div>
        )}
        {notice && (
          <div style={{ backgroundColor: 'rgba(233,167,51,0.1)', border: `1px solid ${C.gold}`, color: C.gold, padding: '1rem', borderRadius: 4, marginBottom: '1.5rem', fontSize: 14 }}>
            {notice}
          </div>
        )}

        {showForm && (
          <div style={{ backgroundColor: C.panel, border: `1px solid ${C.rule}`, borderRadius: 8, padding: '1.75rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 1.5rem' }}>
              {editingId ? 'Edit Piece' : 'Add New Piece'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={label}>Title</label>
                  <input style={field} value={form.title} required
                    onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label style={label}>Category</label>
                  <select style={field} value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as PortfolioCategory })}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={label}>Client</label>
                  <input style={field} value={form.client} placeholder="Nike"
                    onChange={(e) => setForm({ ...form, client: e.target.value })} />
                </div>
                <div>
                  <label style={label}>Agency</label>
                  <input style={field} value={form.agency} placeholder="Wieden + Kennedy"
                    onChange={(e) => setForm({ ...form, agency: e.target.value })} />
                </div>
                <div>
                  <label style={label}>Order</label>
                  <input style={field} type="number" value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={label}>Description</label>
                <textarea style={{ ...field, minHeight: 90, fontFamily: 'system-ui' }} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={label}>Vimeo URL — film only</label>
                <input style={field} value={form.vimeo_url} placeholder="https://vimeo.com/886076080"
                  onChange={(e) => setForm({ ...form, vimeo_url: e.target.value })} />
                <p style={{ color: C.dim, fontSize: 12, margin: '0.5rem 0 0' }}>
                  Video files are far too large for the image bucket. Upload to Vimeo and paste the link here.
                </p>
              </div>

              {/* ---- thumbnail ---- */}
              <div style={{ marginBottom: '1.25rem', padding: '1.1rem', border: `1px solid ${C.rule}`, borderRadius: 6 }}>
                <label style={label}>Thumbnail — the tile on the section page</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {form.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image_url} alt="" style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 4, border: `1px solid ${C.rule}` }} />
                  )}
                  <div style={{ flex: 1, display: 'grid', gap: '0.6rem' }}>
                    <input style={field} type="file" accept="image/*" disabled={busy}
                      onChange={(e) => onThumb(e.target.files)} />
                    <input style={field} value={form.image_url} placeholder="…or paste an image URL"
                      onChange={(e) => setForm({ ...form, image_url: e.target.value, storage_path: '' })} />
                  </div>
                </div>
              </div>

              {/* ---- gallery ---- */}
              <div style={{ marginBottom: '1.5rem', padding: '1.1rem', border: `1px solid ${C.rule}`, borderRadius: 6 }}>
                <label style={label}>Gallery — stills people scroll through ({gallery.length})</label>
                <input style={{ ...field, marginBottom: gallery.length ? '1rem' : 0 }} type="file" accept="image/*" multiple disabled={busy}
                  onChange={(e) => onGallery(e.target.files)} />

                {gallery.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {gallery.map((img, i) => (
                      <div key={img.url} style={{ border: `1px solid ${C.rule}`, borderRadius: 4, padding: '0.5rem' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2, display: 'block' }} />
                        <input
                          style={{ ...field, padding: '0.35rem', fontSize: 12, margin: '0.5rem 0' }}
                          value={img.caption ?? ''}
                          placeholder="Caption"
                          onChange={(e) =>
                            setGallery(gallery.map((g, n) => (n === i ? { ...g, caption: e.target.value } : g)))
                          }
                        />
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button type="button" onClick={() => moveImage(i, i - 1)} style={{ ...button(), flex: 1, padding: '0.3rem', fontSize: 11 }}>←</button>
                          <button type="button" onClick={() => moveImage(i, i + 1)} style={{ ...button(), flex: 1, padding: '0.3rem', fontSize: 11 }}>→</button>
                          <button type="button" onClick={() => setGallery(gallery.filter((_, n) => n !== i))}
                            style={{ ...button(), flex: 1, padding: '0.3rem', fontSize: 11, color: C.red, borderColor: C.red }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', color: C.dim, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.coming_soon}
                  onChange={(e) => setForm({ ...form, coming_soon: e.target.checked })} />
                Coming soon — show the title but do not open it
              </label>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={busy} style={{ ...button(true), opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'Working…' : editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={handleCancel} style={button()}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: C.dim }}>Loading…</p>
        ) : inTab.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: C.dim, backgroundColor: C.panel, border: `1px solid ${C.rule}`, borderRadius: 8 }}>
            Nothing in {CATEGORIES.find((c) => c.value === tab)?.label} yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {inTab.map((piece) => (
              <div key={piece.id} style={{ backgroundColor: C.panel, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 160, backgroundColor: C.ink }}>
                  {piece.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={piece.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                    {piece.vimeo_url && <Tag color={C.gold}>Film</Tag>}
                    {piece.images?.length > 0 && <Tag color={C.dim}>{piece.images.length} stills</Tag>}
                    {piece.coming_soon && <Tag color={C.red}>Soon</Tag>}
                  </div>
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 0.35rem', color: C.paper }}>{piece.title}</h3>
                  <p style={{ fontSize: 12, color: C.dim, margin: '0 0 0.9rem' }}>
                    {[piece.client, piece.agency].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(piece)} style={{ ...button(), flex: 1, color: C.red, borderColor: C.red, fontSize: 12 }}>Edit</button>
                    <button onClick={() => handleDelete(piece)} style={{ ...button(), flex: 1, fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      padding: '2px 7px',
      borderRadius: 3,
      backgroundColor: 'rgba(12,10,10,0.82)',
      color,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}
