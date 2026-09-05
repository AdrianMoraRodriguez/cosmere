import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WikiLayout from '../../components/WikiLayout';
import { supabase } from '../../lib/supabase';

export default function FichasPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState('archivo');
  const [showForm, setShowForm] = useState(false);
  const [editingFicha, setEditingFicha] = useState(null);
  const [formData, setFormData] = useState({
    character_name: '',
    nivel: 1,
    caminos: '',
    ascendencia: '',
    image_url: '',
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    const savedCampaign = localStorage.getItem('currentCampaign') || 'archivo';
    setCampaign(savedCampaign);

    loadFichas(parsedUser, savedCampaign);
  }, []);

  const loadFichas = async (parsedUser, camp) => {
    try {
      let query = supabase
        .from('character_sheets')
        .select('*')
        .eq('campaign', camp);

      // Si no es DM, solo mostrar sus fichas
      if (parsedUser.role !== 'admin') {
        query = query.eq('username', parsedUser.username);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setFichas(data || []);
    } catch (err) {
      console.error('Error cargando fichas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignChange = (camp) => {
    setCampaign(camp);
    setLoading(true);
    loadFichas(user, camp);
  };

  const handleCreateClick = () => {
    setEditingFicha(null);
    setFormData({
      character_name: '',
      nivel: 1,
      caminos: '',
      ascendencia: '',
      image_url: '',
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEditClick = (ficha) => {
    setEditingFicha(ficha);
    setFormData({
      character_name: ficha.character_name,
      nivel: ficha.nivel,
      caminos: ficha.caminos || '',
      ascendencia: ficha.ascendencia || '',
      image_url: ficha.image_url || '',
    });
    setImagePreview(ficha.image_url);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setFormData({ ...formData, image_url: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.character_name.trim()) {
      alert('El nombre del personaje es requerido');
      return;
    }

    try {
      if (editingFicha) {
        const { error } = await supabase
          .from('character_sheets')
          .update({
            character_name: formData.character_name,
            nivel: formData.nivel,
            caminos: formData.caminos,
            ascendencia: formData.ascendencia,
            image_url: formData.image_url,
          })
          .eq('id', editingFicha.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('character_sheets')
          .insert([{
            character_name: formData.character_name,
            nivel: formData.nivel,
            caminos: formData.caminos,
            ascendencia: formData.ascendencia,
            image_url: formData.image_url,
            username: user.username,
            campaign: campaign,
          }]);

        if (error) throw error;
      }

      setShowForm(false);
      loadFichas(user, campaign);
    } catch (err) {
    console.error('Error:', err);
    alert(err.message);
  }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta ficha?')) return;

    try {
      const { error } = await supabase
        .from('character_sheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadFichas(user, campaign);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar la ficha');
    }
  };

  if (!user) return null;

  const campaignName = campaign === 'archivo' ? 'El Archivo de las Tormentas' : 'Mistborn';

  return (
    <WikiLayout user={user} onLogout={() => { localStorage.removeItem('user'); router.push('/login'); }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--text-1)', fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>
            📋 {user.role === 'admin' ? 'Todas las Fichas' : 'Mis Fichas de Personaje'}
          </h1>
          <p style={{ color: 'var(--text-4)', fontSize: '14px', margin: 0 }}>
            Campaña: <strong>{campaignName}</strong>
          </p>
        </div>

        {/* Filtro de campaña (solo DM) + Botón crear */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {user.role === 'admin' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleCampaignChange('archivo')}
                style={{
                  background: campaign === 'archivo' ? 'var(--accent)' : 'var(--bg-hover)',
                  color: campaign === 'archivo' ? 'white' : 'var(--text-2)',
                  border: `1px solid ${campaign === 'archivo' ? 'var(--accent)' : 'var(--border-card)'}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ⚔️ Archivo
              </button>
              <button
                onClick={() => handleCampaignChange('mistborn')}
                style={{
                  background: campaign === 'mistborn' ? 'var(--accent)' : 'var(--bg-hover)',
                  color: campaign === 'mistborn' ? 'white' : 'var(--text-2)',
                  border: `1px solid ${campaign === 'mistborn' ? 'var(--accent)' : 'var(--border-card)'}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🔥 Mistborn
              </button>
            </div>
          )}

          <button
            onClick={handleCreateClick}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: user.role === 'admin' ? 'auto' : '0',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + Crear Ficha Nueva
          </button>
        </div>

        {/* Listado */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-4)' }}>
            Cargando fichas...
          </div>
        ) : fichas.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ color: 'var(--text-2)', fontSize: '16px', fontWeight: '600' }}>
              No hay fichas de personaje
            </p>
            <p style={{ color: 'var(--text-4)', fontSize: '14px', marginTop: '8px' }}>
              {user.role === 'admin' ? 'Los jugadores aún no han creado fichas' : 'Crea tu primera ficha para empezar'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {fichas.map(ficha => (
              <div key={ficha.id}>
                <Link href={`/fichas/${ficha.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-dim)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-card)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Imagen */}
                    {ficha.image_url ? (
                      <img
                        src={ficha.image_url}
                        alt={ficha.character_name}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                          objectPosition: 'center',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '160px',
                        background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                      }}>
                        👤
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{
                        color: 'var(--text-1)',
                        fontSize: '16px',
                        fontWeight: '700',
                        margin: '0 0 4px 0',
                      }}>
                        {ficha.character_name}
                      </h3>

                      <p style={{
                        color: 'var(--text-4)',
                        fontSize: '12px',
                        margin: '0 0 12px 0',
                      }}>
                        Nivel {ficha.nivel}
                      </p>

                      {ficha.caminos && (
                        <p style={{
                          color: 'var(--text-3)',
                          fontSize: '11px',
                          margin: '0 0 4px 0',
                        }}>
                          <strong>Caminos:</strong> {ficha.caminos}
                        </p>
                      )}

                      {ficha.ascendencia && (
                        <p style={{
                          color: 'var(--text-3)',
                          fontSize: '11px',
                          margin: '0 0 8px 0',
                        }}>
                          <strong>Ascendencia:</strong> {ficha.ascendencia}
                        </p>
                      )}

                      {/* Atributos preview */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-card)',
                        fontSize: '10px',
                        color: 'var(--text-4)',
                      }}>
                        <div>FUE: {ficha.fuerza || '—'}</div>
                        <div>INT: {ficha.intelecto || '—'}</div>
                        <div>DIS: {ficha.discernimiento || '—'}</div>
                        <div>PRE: {ficha.presencia || '—'}</div>
                      </div>

                      {/* Username (solo para DM) */}
                      {user.role === 'admin' && (
                        <p style={{
                          color: 'var(--text-5)',
                          fontSize: '10px',
                          margin: '8px 0 0 0',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-card)',
                        }}>
                          👤 {ficha.username}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Botones editar/eliminar */}
                {(user.role === 'admin' || user.username === ficha.username) && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => handleEditClick(ficha)}
                      style={{
                        flex: 1,
                        background: 'var(--accent-dim)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ficha.id)}
                      style={{
                        flex: 1,
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {showForm && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
            onClick={() => setShowForm(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 101,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}>
            <h2 style={{
              color: 'var(--text-1)',
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 20px 0',
            }}>
              {editingFicha ? '✏️ Editar Ficha' : '📋 Nueva Ficha'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Imagen */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}>
                  Imagen del Personaje
                </label>
                <div style={{
                  width: '100%',
                  height: '160px',
                  background: 'var(--bg-hover)',
                  border: '2px dashed var(--border-input)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>Selecciona una imagen</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
  <input
    type="file"
    id="image-upload"
    accept="image/*"
    onChange={handleImageChange}
    style={{ display: 'none' }}
  />

  <label
    htmlFor="image-upload"
    style={{
      display: 'inline-block',
      background: 'var(--accent)',
      color: 'white',
      borderRadius: '8px',
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.opacity = '0.9';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.opacity = '1';
    }}
  >
    Seleccionar imagen
  </label>
</div>
              </div>

              {/* Nombre */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}>
                  Nombre del Personaje
                </label>
                <input
                  type="text"
                  value={formData.character_name}
                  onChange={e => setFormData({ ...formData, character_name: e.target.value })}
                  placeholder="Ej: Bocao Nel"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-2)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Nivel */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}>
                  Nivel
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.nivel}
                  onChange={e => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-2)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Caminos */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}>
                  Caminos
                </label>
                <input
                  type="text"
                  value={formData.caminos}
                  onChange={e => setFormData({ ...formData, caminos: e.target.value })}
                  placeholder="Ej: Desgarrador, Explorador"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-2)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Ascendencia */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}>
                  Ascendencia
                </label>
                <input
                  type="text"
                  value={formData.ascendencia}
                  onChange={e => setFormData({ ...formData, ascendencia: e.target.value })}
                  placeholder="Ej: Humano, Parshendi"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-2)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-hover)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {editingFicha ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </WikiLayout>
  );
}