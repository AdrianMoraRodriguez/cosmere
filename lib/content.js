import fs from 'fs';
import path from 'path';

const CONTENT_PATH = path.join(process.cwd(), 'public', 'content', 'pages.json');

let cachedPages = null;

export function loadPages() {
  if (cachedPages) return cachedPages;
  
  const fileContent = fs.readFileSync(CONTENT_PATH, 'utf-8');
  cachedPages = JSON.parse(fileContent);
  return cachedPages;
}

export function canUserAccessPage(page, user) {
  if (!user) return false;
  
  // Los admins pueden ver todo
  if (user.role === 'admin') return true;
  
  // Si es público, todos pueden acceder
  if (page.visibility === 'public') return true;
  
  // Si es privado sin allowed_users, solo admins
  if (page.visibility === 'private' && (!page.allowed_users || page.allowed_users.length === 0)) {
    return false;
  }
  
  // Si hay allowed_users, verificar si el usuario está en la lista
  if (page.allowed_users && page.allowed_users.length > 0) {
    return page.allowed_users.includes(user.username);
  }
  
  return false;
}

export function getPageBySlug(slug, user) {
  const pages = loadPages();
  const page = pages.find(p => p.slug === slug);
  
  if (!page) return null;
  
  // Verificar si el usuario puede acceder
  if (!canUserAccessPage(page, user)) {
    return null;
  }
  
  // Seleccionar contenido según rol
  const content = user.role === 'admin' ? page.content_admin : page.content_player;
  
  return {
    ...page,
    content
  };
}

export function getPagesList(user) {
  const pages = loadPages();
  
  return pages
    .filter(page => canUserAccessPage(page, user))
    .map(page => ({
      slug: page.slug,
      title: page.title,
      visibility: page.visibility,
      allowed_users: page.allowed_users,
      spoilers: page.spoilers
    }));
}