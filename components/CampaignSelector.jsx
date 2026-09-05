import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function CampaignSelector() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [currentCampaign, setCurrentCampaign] = useState('archivo');
  const [loading, setLoading] = useState(true);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const campaignRef = useRef(null);

  useEffect(() => {
    // Cargar lista de campañas
    fetch('/content/campaigns.json')
      .then(res => res.json())
      .then(data => {
        setCampaigns(
          data.filter(campaign => campaign.enabled !== false)
        );
        setLoading(false);
      })

      .catch(err => {
        console.error('Error cargando campañas:', err);
        setLoading(false);
      });

    // Cargar campaña guardada en localStorage
    const saved = localStorage.getItem('currentCampaign');
    if (saved) {
      setCurrentCampaign(saved);
    }
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        campaignRef.current &&
        !campaignRef.current.contains(event.target)
      ) {
        setCampaignOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCampaignChange = (campaignId) => {
    setCurrentCampaign(campaignId);
    localStorage.setItem('currentCampaign', campaignId);
    setCampaignOpen(false);

    // Redirigir a la página principal de la wiki
    router.push('/wiki');
  };

  if (loading) {
    return (
      <div style={{
        padding: '8px',
        color: 'var(--text-4)',
      }}>
        Cargando campañas...
      </div>
    );
  }

  const selectedCampaign = campaigns.find(
    campaign => campaign.id === currentCampaign
  );

  return (
    <div
      ref={campaignRef}
      style={{
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Botón principal */}
      <button
        onClick={() => setCampaignOpen(open => !open)}
        title="Cambiar campaña"
        style={{
          height: '33px',
          padding: '0 10px 0 6px',
          borderRadius: '8px',
          background: campaignOpen
            ? 'var(--bg-active)'
            : 'var(--bg-hover)',
          border: '1px solid var(--border-input)',
          color: 'var(--text-2)',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => {
          if (!campaignOpen) {
            e.currentTarget.style.background = 'var(--bg-active)';
          }
        }}
        onMouseLeave={e => {
          if (!campaignOpen) {
            e.currentTarget.style.background = 'var(--bg-hover)';
          }
        }}
      >
        {/* Icono de la campaña actual */}
        {selectedCampaign?.icon && (
          <img
            src={selectedCampaign.icon}
            alt=""
            style={{
              width: '18px',
              height: '18px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        )}

        {/* Nombre */}
        <span style={{
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {selectedCampaign?.name || ''}
        </span>

        {/* Flecha */}
        <svg
          width="10"
          height="7"
          viewBox="0 0 10 7"
          fill="none"
          style={{
            opacity: 0.6,
            transition: 'transform 0.15s',
            transform: campaignOpen
              ? 'rotate(180deg)'
              : 'none',
          }}
        >
          <path
            d="M1 1.5L5 5.5L9 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {campaignOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          width: '240px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          zIndex: 300,
          padding: '4px',
        }}>
          {campaigns.map(campaign => (
            <button
              key={campaign.id}
              onMouseDown={e => {
                e.preventDefault();
                handleCampaignChange(campaign.id);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: currentCampaign === campaign.id
                  ? 'var(--bg-active)'
                  : 'transparent',
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                if (currentCampaign !== campaign.id) {
                  e.currentTarget.style.background =
                    'var(--bg-hover)';
                }
              }}
              onMouseLeave={e => {
                if (currentCampaign !== campaign.id) {
                  e.currentTarget.style.background =
                    'transparent';
                }
              }}
            >
              {/* Icono */}
              <span style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--bg-card)',
                border: currentCampaign === campaign.id
                  ? '2px solid var(--accent-2)'
                  : '2px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img
                  src={campaign.icon}
                  alt=""
                  style={{
                    width: '18px',
                    height: '18px',
                    objectFit: 'contain',
                  }}
                />
              </span>

              {/* Nombre */}
              <span style={{
                color: currentCampaign === campaign.id
                  ? 'var(--text-1)'
                  : 'var(--text-2)',
                fontSize: '13px',
                fontWeight: currentCampaign === campaign.id
                  ? '600'
                  : '400',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {campaign.name}
              </span>

              {/* Check */}
              {currentCampaign === campaign.id && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="var(--accent-2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}