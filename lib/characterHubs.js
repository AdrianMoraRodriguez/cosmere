// Character hub pages: instead of rendering content directly, show sub-page cards.
// To add a new character, copy any entry below and update the slug + stories array.
const SUBPAGES_TEMPLATE = [
  {
    key: 'Diario',
    label: 'Diario',
    icon: '📖',
    description: 'Entradas del diario de campaña',
    contentSource: 'parent',
  },
  {
    key: 'Short Stories',
    label: 'Short Stories',
    icon: '✨',
    description: 'Historias cortas y relatos',
    contentSource: 'stories',
    stories: [],
  },
  {
    key: 'About',
    label: 'About',
    icon: '👤',
    description: 'Opiniones y perspectivas del personaje',
    contentSource: 'placeholder',
  },
];

const CHARACTER_HUBS = {
  'Caminapiedras/Party Principal/Yara Elorin': {
    subpages: [
      SUBPAGES_TEMPLATE[0],
      {
        ...SUBPAGES_TEMPLATE[1],
        stories: [
          { key: '1', label: 'Historia 1' },
          { key: '2', label: 'Historia 2' },
          { key: '3', label: 'Historia 3' },
          { key: '4', label: 'Historia 4' },
          { key: '5', label: 'Historia 5' },
          { key: '6', label: 'Historia 6' },
        ],
      },
      SUBPAGES_TEMPLATE[2],
    ],
  },
  'Caminapiedras/Party Principal/Bokao Nel': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Neshor': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Nathur': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Nor Damoi': {
    subpages: SUBPAGES_TEMPLATE,
  },
  "Caminapiedras/Party Principal/Arluno'ratha'tu": {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Calki': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Sidoa Damoi': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Niffty': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Valisha': {
    subpages: SUBPAGES_TEMPLATE,
  },
  'Caminapiedras/Party Principal/Dyr Dyu': {
    subpages: SUBPAGES_TEMPLATE,
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
