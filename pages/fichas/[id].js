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
      
      // Si no tiene habilidades, crear todas automáticamente
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

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.habilidades];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setFormData({ ...formData, habilidades: newSkills });
  };

  const handleAddPotencia = () => {
    const newPotencias = [...(formData.potencias || [])];
    newPotencias.push({ nombre: '', base: '', puntos: 0 });
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

        {/* Atributos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <Section title="Atributos Físicos">
            <AttributeRow label="Fuerza" value={formData.fuerza} onChange={(v) => handleFieldChange('fuerza', v)} editMode={editMode} />
            <AttributeRow label="Defensa Física" value={formData.defensa_fisica} onChange={(v) => handleFieldChange('defensa_fisica', v)} editMode={editMode} />
            <AttributeRow label="Velocidad" value={formData.velocidad} onChange={(v) => handleFieldChange('velocidad', v)} editMode={editMode} />
            <AttributeRow label="Salud Máxima" value={formData.salud_maxima} onChange={(v) => handleFieldChange('salud_maxima', v)} editMode={editMode} />
            <AttributeRow label="Desvío" value={formData.desvio} onChange={(v) => handleFieldChange('desvio', v)} editMode={editMode} />
          </Section>

          <Section title="Atributos Cognitivos">
            <AttributeRow label="Intelecto" value={formData.intelecto} onChange={(v) => handleFieldChange('intelecto', v)} editMode={editMode} />
            <AttributeRow label="Defensa Cognitiva" value={formData.defensa_cognitiva} onChange={(v) => handleFieldChange('defensa_cognitiva', v)} editMode={editMode} />
            <AttributeRow label="Voluntad" value={formData.voluntad} onChange={(v) => handleFieldChange('voluntad', v)} editMode={editMode} />
            <AttributeRow label="Concentración Máxima" value={formData.concentracion_maxima} onChange={(v) => handleFieldChange('concentracion_maxima', v)} editMode={editMode} />
          </Section>

          <Section title="Atributos Espirituales">
            <AttributeRow label="Discernimiento" value={formData.discernimiento} onChange={(v) => handleFieldChange('discernimiento', v)} editMode={editMode} />
            <AttributeRow label="Defensa Espiritual" value={formData.defensa_espiritual} onChange={(v) => handleFieldChange('defensa_espiritual', v)} editMode={editMode} />
            <AttributeRow label="Presencia" value={formData.presencia} onChange={(v) => handleFieldChange('presencia', v)} editMode={editMode} />
            <AttributeRow label="Investidura Máxima" value={formData.investidura_maxima} onChange={(v) => handleFieldChange('investidura_maxima', v)} editMode={editMode} />
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
            />
          </Section>

          <Section title="Habilidades Cognitivas">
            <SkillsList
              items={cognitiveSkills}
              onChange={(i, k, v) => handleSkillChange(formData.habilidades.indexOf(cognitiveSkills[i]), k, v)}
              editMode={editMode}
            />
          </Section>

          <Section title="Habilidades Espirituales">
            <SkillsList
              items={spiritualSkills}
              onChange={(i, k, v) => handleSkillChange(formData.habilidades.indexOf(spiritualSkills[i]), k, v)}
              editMode={editMode}
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
            />
          </Section>
        </div>

        {/* Listas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>

          <DynamicListSection
            title="Armas"
            items={formData.armas || []}
            onAdd={() => handleAddItem('armas')}
            onRemove={(i) => handleRemoveItem('armas', i)}
            onChange={(i, k, v) => handleItemChange('armas', i, k, v)}
            editMode={editMode}
            fields={['Nombre', 'Descripción']}
          />

          <DynamicListSection
            title="Pericias"
            items={formData.pericias || []}
            onAdd={() => handleAddItem('pericias')}
            onRemove={(i) => handleRemoveItem('pericias', i)}
            onChange={(i, k, v) => handleItemChange('pericias', i, k, v)}
            editMode={editMode}
            fields={['Nombre', 'Nivel']}
            fieldTypes={{ nivel: 'number' }}
          />

        </div>

        <DynamicListSection
            title="Talentos"
            items={formData.talentos || []}
            onAdd={() => handleAddItem('talentos')}
            onRemove={(i) => handleRemoveItem('talentos', i)}
            onChange={(i, k, v) => handleItemChange('talentos', i, k, v)}
            editMode={editMode}
            fields={['Nombre', 'Descripción']}
            style={{ marginTop: '16px',
            marginBottom: '32px'
            }}
          />

        <DynamicListSection
            title="Metas"
            items={formData.metas || []}
            onAdd={() => handleAddItem('metas')}
            onRemove={(i) => handleRemoveItem('metas', i)}
            onChange={(i, k, v) => handleItemChange('metas', i, k, v)}
            editMode={editMode}
            fields={['Descripción', 'Completada']}
            fieldTypes={{ completada: 'checkbox' }}
            style={{ marginTop: '16px',
            marginBottom: '32px'
            }}
          />

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

function SkillsList({ items, onChange, editMode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => (
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
          <div style={{ color: 'var(--text-2)', fontWeight: '700', fontSize: '13px' }}>
            {item.nombre} ({item.base})
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-4)', fontSize: '12px' }}>Puntos:</span>
            {editMode ? (
              <input
                type="number"
                min="0"
                value={item.puntos || 0}
                onChange={(e) => onChange(index, 'puntos', parseInt(e.target.value) || 0)}
                style={{
                  width: '60px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                }}
              />
            ) : (
              <span style={{ color: 'var(--text-1)', fontWeight: '700' }}>
                {item.puntos || 0}
              </span>
            )}
            <span style={{ color: 'var(--text-4)', fontSize: '12px', marginLeft: 'auto' }}>
              ⭐ +{item.puntos || 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PotenciasList({ items, onAdd, onRemove, onChange, editMode, availablePotencias }) {
  const usedPotencias = items.map(p => p.nombre);
  const availableToAdd = availablePotencias.filter(p => !usedPotencias.includes(p.nombre));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => (
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
            <div style={{ color: 'var(--text-2)', fontWeight: '700', fontSize: '13px' }}>
              {item.nombre} ({item.base})
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
                }}
              >
                🗑️
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-4)', fontSize: '12px' }}>Puntos:</span>
            {editMode ? (
              <input
                type="number"
                min="0"
                value={item.puntos || 0}
                onChange={(e) => onChange(index, 'puntos', parseInt(e.target.value) || 0)}
                style={{
                  width: '60px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'var(--text-2)',
                  fontSize: '13px',
                }}
              />
            ) : (
              <span style={{ color: 'var(--text-1)', fontWeight: '700' }}>
                {item.puntos || 0}
              </span>
            )}
            <span style={{ color: 'var(--text-4)', fontSize: '12px', marginLeft: 'auto' }}>
              ⭐ +{item.puntos || 0}
            </span>
          </div>
        </div>
      ))}

      {editMode && availableToAdd.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              const selected = availablePotencias.find(p => p.nombre === e.target.value);
              onAdd();
              onChange(items.length, 'nombre', selected.nombre);
              onChange(items.length, 'base', selected.base);
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
      marginBottom: '32px',
      marginTop: '16px',
      
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