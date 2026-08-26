'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortfolioPiece } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [pieces, setPieces] = useState<PortfolioPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'film' as 'film' | 'stills',
    vimeo_url: '',
    image_url: '',
  });
  const [file, setFile] = useState<File | null>(null);

  // Check auth
  useEffect(() => {
    const token = document.cookie.includes('admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchPieces();
    }
  }, []);

  const fetchPieces = async () => {
    try {
      const response = await fetch('/api/admin/portfolio');
      const data = await response.json();
      setPieces(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = formData.image_url;

    // Upload file if provided
    if (file) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('/api/admin/portfolio/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      } catch (err) {
        console.error('Upload error:', err);
        return;
      }
    }

    const url = editingId ? `/api/admin/portfolio/${editingId}` : '/api/admin/portfolio';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
        }),
      });

      if (response.ok) {
        fetchPieces();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          title: '',
          description: '',
          category: 'film',
          vimeo_url: '',
          image_url: '',
        });
        setFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (piece: PortfolioPiece) => {
    setEditingId(piece.id);
    setFormData({
      title: piece.title,
      description: piece.description || '',
      category: piece.category,
      vimeo_url: piece.vimeo_url || '',
      image_url: piece.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this piece?')) return;

    try {
      await fetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' });
      fetchPieces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'film',
      vimeo_url: '',
      image_url: '',
    });
    setFile(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0c0a0a',
      color: '#f2ede3',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid #333',
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: 0,
          }}>Portfolio Manager</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#e3251b',
                color: '#f2ede3',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
              }}>
              + Add Piece
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#948b86',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
              }}>
              Logout
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            backgroundColor: '#1a1818',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem',
            }}>
              {editingId ? 'Edit Piece' : 'Add New Piece'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#948b86',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#0c0a0a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#f2ede3',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#948b86',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'film' | 'stills' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#0c0a0a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#f2ede3',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="film">Film</option>
                    <option value="stills">Stills</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#948b86',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0c0a0a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#f2ede3',
                    fontSize: '14px',
                    fontFamily: 'system-ui',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#948b86',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}>
                    Vimeo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.vimeo_url}
                    onChange={(e) => setFormData({ ...formData, vimeo_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#0c0a0a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#f2ede3',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#948b86',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#0c0a0a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#f2ede3',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: '#948b86',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0c0a0a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#f2ede3',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#e3251b',
                    color: '#f2ede3',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}>
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#948b86',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#948b86' }}>Loading...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {pieces.map((piece) => (
              <div
                key={piece.id}
                style={{
                  backgroundColor: '#1a1818',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                {piece.image_url && (
                  <img
                    src={piece.image_url}
                    alt={piece.title}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    margin: '0 0 0.5rem',
                    color: '#e3251b',
                  }}>
                    {piece.title}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#948b86',
                    margin: '0 0 0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    {piece.category}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#b5aca5',
                    margin: '0 0 1rem',
                    lineHeight: '1.4',
                  }}>
                    {piece.description?.slice(0, 60)}...
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(piece)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        color: '#e3251b',
                        border: '1px solid #e3251b',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(piece.id)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        color: '#948b86',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}>
                      Delete
                    </button>
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
