import { getPageBySlug } from '../../lib/content';

export default function handler(req, res) {
  const { slug } = req.query;
  
  // En producción, obtén el usuario de la sesión/JWT
  // Por ahora asumimos que viene en el header
  const userRole = req.headers['x-user-role'] || 'player';
  
  const page = getPageBySlug(slug, userRole);
  
  if (!page) {
    return res.status(404).json({ message: 'Página no encontrada' });
  }
  
  res.status(200).json(page);
}