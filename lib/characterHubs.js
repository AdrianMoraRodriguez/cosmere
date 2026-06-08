// Character hub pages: instead of rendering content directly, show sub-page cards.
// Add more entries here when new characters need the same treatment.
const CHARACTER_HUBS = {
  'Caminapiedras/Party Principal/Yara Elorin': {
    subpages: [
      {
        key: 'Diario',
        label: 'Diario',
        icon: '📖',
        description: 'Entradas del diario de campaña',
        contentSource: 'parent',   // reuse the parent page's content
      },
      {
        key: 'Short Stories',
        label: 'Short Stories',
        icon: '✨',
        description: 'Historias cortas y relatos',
        contentSource: 'stories',
        stories: [
          { key: '1', label: 'Historia 1' },
          { key: '2', label: 'Historia 2' },
          { key: '3', label: 'Historia 3' },
          { key: '4', label: 'Historia 4' },
          { key: '5', label: 'Historia 5' },
          { key: '6', label: 'Historia 6' },
        ],
      },
      {
        key: 'About',
        label: 'About',
        icon: '👤',
        description: 'Opiniones y perspectivas del personaje',
        contentSource: 'placeholder',
      },
    ],
  },
};

/** Returns the hub config for a given slug, or null. */
export function getHubConfig(slug) {
  return CHARACTER_HUBS[slug] ?? null;
}

/**
 * If `slug` matches a virtual sub-page (e.g. "…/Yara Elorin/Diario"),
 * returns { hubSlug, hub, subpage }. Otherwise returns null.
 */
export function getVirtualSubpage(slug) {
  for (const [hubSlug, hub] of Object.entries(CHARACTER_HUBS)) {
    for (const sub of hub.subpages) {
      if (slug === `${hubSlug}/${sub.key}`) {
        return { hubSlug, hub, subpage: sub };
      }
    }
  }
  return null;
}
