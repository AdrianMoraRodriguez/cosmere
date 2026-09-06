import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import WikiLayout from '../../components/WikiLayout';
import { supabase } from '../../lib/supabase';

const SKILLS_DATA = {
  physical: [
    { nombre: 'Agilidad', base: 'VEL' },
    { nombre: 'Armamento Ligero', base: 'VEL' },
    { nombre: 'Armamento Pesado', base: 'FUE' },
    { nombre: 'Atletismo', base: 'VEL' },
    { nombre: 'Hurto', base: 'VEL' },
    { nombre: 'Sigilo', base: 'VEL' },
  ],
  cognitive: [
    { nombre: 'Deducción', base: 'INT' },
    { nombre: 'Disciplina', base: 'VOL' },
    { nombre: 'Intimidación', base: 'VOL' },
    { nombre: 'Manufactura', base: 'INT' },
    { nombre: 'Medicina', base: 'INT' },
    { nombre: 'Saber', base: 'INT' },
  ],
  spiritual: [
    { nombre: 'Engaño', base: 'PRE' },
    { nombre: 'Liderazgo', base: 'PRE' },
    { nombre: 'Percepción', base: 'DIS' },
    { nombre: 'Perspicacia', base: 'DIS' },
    { nombre: 'Persuasión', base: 'PRE' },
    { nombre: 'Supervivencia', base: 'DIS' },
  ],
};

const POTENCIAS_DATA = [
  { nombre: 'Abrasión', base: 'VEL' },
  { nombre: 'Velocidad', base: 'VEL' },
  { nombre: 'Adhesión', base: 'PRE' },
  { nombre: 'Presencia', base: 'PRE' },
  { nombre: 'Cohesión', base: 'VOL' },
  { nombre: 'Voluntad', base: 'VOL' },
  { nombre: 'División', base: 'INT' },
  { nombre: 'Intelecto', base: 'INT' },
  { nombre: 'Gravitación', base: 'DIS' },
  { nombre: 'Discernimiento', base: 'DIS' },
  { nombre: 'Iluminación', base: 'PRE' },
  { nombre: 'Progresión', base: 'DIS' },
  { nombre: 'Tensión', base: 'FUE' },
  { nombre: 'Fuerza', base: 'FUE' },
  { nombre: 'Transformación', base: 'VOL' },
  { nombre: 'Transportación', base: 'INT' },
];

export default function FichaDetalladaPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (id) loadFicha();
  }, [id]);

  const loadFicha = async () => {
    try {
      const { data, error } = await supabase
        .from('character_sheets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      let fichaData = data;
      if (!fichaData.habilidades || fichaData.habilidades.length === 0) {
        const allSkills = [
          ...SKILLS_DATA.physical,
          ...SKILLS_DATA.cognitive,
          ...SKILLS_DATA.spiritual,
        ].map(s => ({ ...s, puntos: 0 }));
        fichaData.habilidades = allSkills;
      }
      
      setFicha(fichaData);
      setFormData(fichaData);
    } catch (err) {
      console.error('Error:', err);
      alert('Ficha no encontrada');
      router.push('/fichas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('character_sheets')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      setFicha(formData);
      setEditMode(false);
      alert('Ficha guardada');
    } catch (err) {
      console.error('Error:', err);
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleQuickSave = async (field, value) => {
    try {
      const updateData = { ...formData, [field]: value };
      const { error } = await supabase
        .from('character_sheets')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      setFormData(updateData);
    } catch (err) {
      console.error('Error:', err);
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.habilidades];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setFormData({ ...formData, habilidades: newSkills });
  };

  const handleAddPotencia = (nombre = '', base = '') => {
    const newPotencias = [...(formData.potencias || [])];
    newPotencias.push({ nombre, base, puntos: 0 });
    setFormData({ ...formData, potencias: newPotencias });
  };

  const handleRemovePotencia = (index) => {
    const newPotencias = formData.potencias.filter((_, i) => i !== index);
    setFormData({ ...formData, potencias: newPotencias });
  };

  const handlePotenciaChange = (index, field, value) => {
    const newPotencias = [...formData.potencias];
    newPotencias[index] = { ...newPotencias[index], [field]: value };
    setFormData({ ...formData, potencias: newPotencias });
  };

  const handleAddItem = (field) => {
    const newItems = [...(formData[field] || [])];
    if (field === 'talentos' || field === 'armas') {
      newItems.push({ nombre: '', descripcion: '' });
    } else if (field === 'pericias') {
      newItems.push({ nombre: '', nivel: 1 });
    } else if (field === 'metas') {
      newItems.push({ descripcion: '', completada: false });
    }
    setFormData({ ...formData, [field]: newItems });
  };

  const handleRemoveItem = (field, index) => {
    const newItems = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newItems });
  };

  const handleItemChange = (field, index, key, value) => {
    const newItems = [...formData[field]];
    newItems[index] = { ...newItems[index], [key]: value };
    setFormData({ ...formData, [field]: newItems });
  };

  if (!user || loading) return null;

  const canEdit = user.role === 'admin' || user.username === ficha?.username;
  
  const physicalSkills = formData.habilidades?.filter(h => 
    ['Agilidad', 'Armamento Ligero', 'Armamento Pesado', 'Atletismo', 'Hurto', 'Sigilo'].includes(h.nombre)
  ) || [];
  
  const cognitiveSkills = formData.habilidades?.filter(h =>
    ['Deducción', 'Disciplina', 'Intimidación', 'Manufactura', 'Medicina', 'Saber'].includes(h.nombre)
  ) || [];
  
  const spiritualSkills = formData.habilidades?.filter(h =>
    ['Engaño', 'Liderazgo', 'Percepción', 'Perspicacia', 'Persuasión', 'Supervivencia'].includes(h.nombre)
  ) || [];

  return (
    <WikiLayout user={user} onLogout={() => { localStorage.removeItem('user'); router.push('/login'); }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'var(--text-1)', fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>
              {formData.character_name}
            </h1>
            <p style={{ color: 'var(--text-4)', fontSize: '14px', margin: 0 }}>
              {editMode ? (
                <>
                  Nivel <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.nivel || 1}
                    onChange={(e) => handleFieldChange('nivel', parseInt(e.target.value))}
                    style={{
                      width: '50px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: 'var(--text-2)',
                      fontSize: '14px',
                    }}
                  /> • {formData.caminos} • {formData.ascendencia}
                </>
              ) : (
                <>Nivel {formData.nivel} • {formData.caminos} • {formData.ascendencia}</>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {canEdit && (
              <>
                {editMode ? (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData(ficha);
                      }}
                      style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      💾 Guardar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      background: 'var(--accent-dim)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    ✏️ Editar
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => router.push('/fichas')}
              style={{
                background: 'var(--bg-hover)',
                color: 'var(--text-2)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Atributos Base */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <Section title="Atributos Físicos">
            <AttributeRow label="Fuerza" value={formData.fuerza} onChange={(v) => handleFieldChange('fuerza', v)} editMode={editMode} />
            <AttributeRow label="Velocidad" value={formData.velocidad} onChange={(v) => handleFieldChange('velocidad', v)} editMode={editMode} />
          </Section>

          <Section title="Atributos Cognitivos">
            <AttributeRow label="Intelecto" value={formData.intelecto} onChange={(v) => handleFieldChange('intelecto', v)} editMode={editMode} />
            <AttributeRow label="Voluntad" value={formData.voluntad} onChange={(v) => handleFieldChange('voluntad', v)} editMode={editMode} />
          </Section>

          <Section title="Atributos Espirituales">
            <AttributeRow label="Discernimiento" value={formData.discernimiento} onChange={(v) => handleFieldChange('discernimiento', v)} editMode={editMode} />
            <AttributeRow label="Presencia" value={formData.presencia} onChange={(v) => handleFieldChange('presencia', v)} editMode={editMode} />
          </Section>
        </div>

        {/* Defensas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <Section title="🛡️ Defensas">
            <AttributeRow label="Defensa Física" value={formData.defensa_fisica} onChange={(v) => handleFieldChange('defensa_fisica', v)} editMode={editMode} />
            <AttributeRow label="Defensa Cognitiva" value={formData.defensa_cognitiva} onChange={(v) => handleFieldChange('defensa_cognitiva', v)} editMode={editMode} />
            <AttributeRow label="Defensa Espiritual" value={formData.defensa_espiritual} onChange={(v) => handleFieldChange('defensa_espiritual', v)} editMode={editMode} />
          </Section>

          <Section title="💚 Salud">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Máxima</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.salud_maxima || ''}
                      onChange={(e) => handleFieldChange('salud_maxima', e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-input)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'var(--text-2)',
                        fontSize: '13px',
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '14px' }}>{formData.salud_maxima || '—'}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Actual</label>
                  <input
                    type="number"
                    value={formData.salud_actual || 0}
                    onChange={(e) => handleQuickSave('salud_actual', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: 'var(--text-2)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="🧠 Concentración">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Máxima</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.concentracion_maxima || ''}
                      onChange={(e) => handleFieldChange('concentracion_maxima', e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-input)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'var(--text-2)',
                        fontSize: '13px',
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '14px' }}>{formData.concentracion_maxima || '—'}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Actual</label>
                  <input
                    type="number"
                    value={formData.concentracion_actual || 0}
                    onChange={(e) => handleQuickSave('concentracion_actual', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: 'var(--text-2)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Desvío e Investidura */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <Section title="↩️ Desvío">
            <AttributeRow label="Desvío" value={formData.desvio} onChange={(v) => handleFieldChange('desvio', v)} editMode={editMode} />
          </Section>

          <Section title="✨ Investidura">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Máxima</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.investidura_maxima || ''}
                      onChange={(e) => handleFieldChange('investidura_maxima', e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-input)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'var(--text-2)',
                        fontSize: '13px',
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '14px' }}>{formData.investidura_maxima || '—'}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Actual</label>
                  <input
                    type="number"
                    value={formData.investidura_actual || 0}
                    onChange={(e) => handleQuickSave('investidura_actual', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: 'var(--text-2)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Currency */}
        <div style={{ marginBottom: '32px' }}>
          <Section title="Recursos">
            <div>
              <label style={{ display: 'block', color: 'var(--text-2)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                💰 Monedas/Esferas
              </label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.currency || 0}
                  onChange={(e) => handleFieldChange('currency', parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-2)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <span style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '24px' }}>
                  {formData.currency || 0}
                </span>
              )}
            </div>
          </Section>
        </div>

        {/* Skills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <Section title="Habilidades Físicas">
            <SkillsList
              items={physicalSkills}
              onChange={(i, k, v) => handleSkillChange(formData.habilidades.indexOf(physicalSkills[i]), k, v)}
              editMode={editMode}
              formData={formData}
            />
          </Section>

          <Section title="Habilidades Cognitivas">
            <SkillsList
              items={cognitiveSkills}
              onChange={(i, k, v) => handleSkillChange(formData.habilidades.indexOf(cognitiveSkills[i]), k, v)}
              editMode={editMode}
              formData={formData}
            />
          </Section>

          <Section title="Habilidades Espirituales">
            <SkillsList
              items={spiritualSkills}
              onChange={(i, k, v) => handleSkillChange(formData.habilidades.indexOf(spiritualSkills[i]), k, v)}
              editMode={editMode}
              formData={formData}
            />
          </Section>
        </div>

        {/* Potencias */}
        <div style={{ marginBottom: '32px' }}>
          <Section title="✨ Potencias (Investiduras)">
            <PotenciasList
              items={formData.potencias || []}
              onAdd={handleAddPotencia}
              onRemove={handleRemovePotencia}
              onChange={handlePotenciaChange}
              editMode={editMode}
              availablePotencias={POTENCIAS_DATA}
              formData={formData}
            />
          </Section>
        </div>

        {/* Listas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <DynamicListSection
            title="Talentos"
            items={formData.talentos || []}
            onAdd={() => handleAddItem('talentos')}
            onRemove={(i) => handleRemoveItem('talentos', i)}
            onChange={(i, k, v) => handleItemChange('talentos', i, k, v)}
            editMode={editMode}
            fields={['nombre', 'descripcion']}
          />

          <DynamicListSection
            title="Armas"
            items={formData.armas || []}
            onAdd={() => handleAddItem('armas')}
            onRemove={(i) => handleRemoveItem('armas', i)}
            onChange={(i, k, v) => handleItemChange('armas', i, k, v)}
            editMode={editMode}
            fields={['nombre', 'descripcion']}
          />

          <DynamicListSection
            title="Pericias"
            items={formData.pericias || []}
            onAdd={() => handleAddItem('pericias')}
            onRemove={(i) => handleRemoveItem('pericias', i)}
            onChange={(i, k, v) => handleItemChange('pericias', i, k, v)}
            editMode={editMode}
            fields={['nombre', 'nivel']}
            fieldTypes={{ nivel: 'number' }}
          />

          <DynamicListSection
            title="Metas"
            items={formData.metas || []}
            onAdd={() => handleAddItem('metas')}
            onRemove={(i) => handleRemoveItem('metas', i)}
            onChange={(i, k, v) => handleItemChange('metas', i, k, v)}
            editMode={editMode}
            fields={['descripcion', 'completada']}
            fieldTypes={{ completada: 'checkbox' }}
          />
        </div>

        {/* Notas */}
        <Section title="Notas y Conexiones">
          <TextAreaField
            label="Aspecto del Personaje"
            value={formData.aspecto_personaje || ''}
            onChange={(v) => handleFieldChange('aspecto_personaje', v)}
            editMode={editMode}
          />
          <TextAreaField
            label="Notas"
            value={formData.notas || ''}
            onChange={(v) => handleFieldChange('notas', v)}
            editMode={editMode}
            style={{ marginTop: '16px' }}
          />
          <TextAreaField
            label="Conexiones"
            value={formData.conexiones || ''}
            onChange={(v) => handleFieldChange('conexiones', v)}
            editMode={editMode}
            style={{ marginTop: '16px' }}
          />
        </Section>
      </div>
    </WikiLayout>
  );
}

// Componentes
function Section({ title, children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '10px',
      padding: '20px',
      ...style,
    }}>
      <h3 style={{ color: 'var(--text-1)', fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function AttributeRow({ label, value, onChange, editMode }) {
  return (
    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: '500' }}>{label}</label>
      {editMode ? (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            width: '80px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '6px',
            padding: '6px 10px',
            color: 'var(--text-2)',
            fontSize: '13px',
          }}
        />
      ) : (
        <span style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '14px' }}>{value || '—'}</span>
      )}
    </div>
  );
}

function TextAreaField({ label, value, onChange, editMode, style }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', color: 'var(--text-2)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
        {label}
      </label>
      {editMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: 'var(--text-2)',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{
          color: 'var(--text-3)',
          fontSize: '13px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          background: 'var(--bg-hover)',
          padding: '12px',
          borderRadius: '6px',
          minHeight: '60px',
        }}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}

function SkillsList({ items, onChange, editMode, formData }) {
  const getAttributeValue = (baseAttr) => {
    const attrMap = {
      'FUE': formData.fuerza || 0,
      'VEL': formData.velocidad || 0,
      'INT': formData.intelecto || 0,
      'VOL': formData.voluntad || 0,
      'DIS': formData.discernimiento || 0,
      'PRE': formData.presencia || 0,
    };
    return attrMap[baseAttr] || 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => {
        const baseValue = getAttributeValue(item.base);
        const totalValue = baseValue + (item.puntos || 0);

        return (
          <div
            key={index}
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-card)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-2)', fontWeight: '700', fontSize: '13px' }}>
                  {item.nombre}
                </div>
                <div style={{ color: 'var(--text-4)', fontSize: '11px', marginTop: '2px' }}>
                  {item.base}: {baseValue}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '16px' }}>
                  {totalValue}
                </div>
                <div style={{ color: 'var(--text-4)', fontSize: '11px' }}>
                  Total
                </div>
              </div>
            </div>

            {/* Checkboxes - SOLO EN MODO EDICIÓN */}
            {editMode && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map((checkIndex) => (
                  <label
                    key={checkIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(item.puntos || 0) > checkIndex}
                      onChange={(e) => {
                        const newPoints = e.target.checked ? checkIndex + 1 : checkIndex;
                        onChange(index, 'puntos', newPoints);
                      }}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                      }}
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Círculos - SOLO EN MODO LECTURA */}
            {!editMode && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map((circleIndex) => {
                  const isMarked = (item.puntos || 0) > circleIndex;
                  return (
                    <span
                      key={circleIndex}
                      style={{
                        fontSize: '18px',
                        color: isMarked ? '#22c55e' : 'var(--text-4)',
                      }}
                    >
                      {isMarked ? '●' : '○'}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PotenciasList({ items, onAdd, onRemove, onChange, editMode, availablePotencias, formData }) {
  const getAttributeValue = (baseAttr) => {
    const attrMap = {
      'FUE': formData.fuerza || 0,
      'VEL': formData.velocidad || 0,
      'INT': formData.intelecto || 0,
      'VOL': formData.voluntad || 0,
      'DIS': formData.discernimiento || 0,
      'PRE': formData.presencia || 0,
    };
    return attrMap[baseAttr] || 0;
  };

  const usedPotencias = items.map(p => p.nombre);
  const availableToAdd = availablePotencias.filter(p => !usedPotencias.includes(p.nombre));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => {
        const baseValue = getAttributeValue(item.base);
        const totalValue = baseValue + (item.puntos || 0);

        return (
          <div
            key={index}
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-card)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <div style={{ color: 'var(--text-2)', fontWeight: '700', fontSize: '13px' }}>
                    {item.nombre}
                  </div>
                  <div style={{ color: 'var(--text-4)', fontSize: '11px', marginTop: '2px' }}>
                    {item.base}: {baseValue}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-1)', fontWeight: '700', fontSize: '16px' }}>
                    {totalValue}
                  </div>
                  <div style={{ color: 'var(--text-4)', fontSize: '11px' }}>
                    Total
                  </div>
                </div>
              </div>
              {editMode && (
                <button
                  onClick={() => onRemove(index)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  🗑️
                </button>
              )}
            </div>

            {/* Checkboxes - SOLO EN MODO EDICIÓN */}
            {editMode && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map((checkIndex) => (
                  <label
                    key={checkIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(item.puntos || 0) > checkIndex}
                      onChange={(e) => {
                        const newPoints = e.target.checked ? checkIndex + 1 : checkIndex;
                        onChange(index, 'puntos', newPoints);
                      }}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                      }}
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Círculos - SOLO EN MODO LECTURA */}
            {!editMode && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map((circleIndex) => {
                  const isMarked = (item.puntos || 0) > circleIndex;
                  return (
                    <span
                      key={circleIndex}
                      style={{
                        fontSize: '18px',
                        color: isMarked ? '#22c55e' : 'var(--text-4)',
                      }}
                    >
                      {isMarked ? '●' : '○'}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {editMode && availableToAdd.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              const selected = availablePotencias.find(p => p.nombre === e.target.value);
              // Usar el handler que recibe nombre y base
              onAdd(selected.nombre, selected.base);
            }
            e.target.value = '';
          }}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '6px',
            padding: '8px 10px',
            color: 'var(--text-2)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="">+ Agregar Potencia</option>
          {availableToAdd.map(potencia => (
            <option key={potencia.nombre} value={potencia.nombre}>
              {potencia.nombre} ({potencia.base})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function DynamicListSection({ title, items, onAdd, onRemove, onChange, editMode, fields, fieldTypes = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '10px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-1)', fontSize: '16px', fontWeight: '700', margin: 0 }}>
          {title}
        </h3>
        {editMode && (
          <button
            onClick={onAdd}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Agregar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-5)', fontSize: '13px', margin: 0 }}>Sin elementos</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '8px',
                alignItems: editMode ? 'flex-start' : 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                {fields.map(field => (
                  <div key={field} style={{ marginBottom: field === fields[fields.length - 1] ? 0 : '8px' }}>
                    {editMode ? (
                      fieldTypes[field] === 'checkbox' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-2)', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={item[field] || false}
                            onChange={(e) => onChange(index, field, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          {field}
                        </label>
                      ) : fieldTypes[field] === 'number' ? (
                        <input
                          type="number"
                          value={item[field] || ''}
                          onChange={(e) => onChange(index, field, e.target.value ? parseInt(e.target.value) : '')}
                          placeholder={field}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-input)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: 'var(--text-2)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={item[field] || ''}
                          onChange={(e) => onChange(index, field, e.target.value)}
                          placeholder={field}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-input)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: 'var(--text-2)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      )
                    ) : (
                      <div style={{ color: 'var(--text-2)', fontSize: '13px' }}>
                        <strong>{field}:</strong> {item[field] || '—'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editMode && (
                <button
                  onClick={() => onRemove(index)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}