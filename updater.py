import os
import re
import shutil
from pathlib import Path
import yaml
import json

# ============================================================================
# CONFIGURACIÓN - EDITA ESTAS RUTAS SEGÚN TU PROYECTO
# ============================================================================

SOURCE_DIR = "/Users/adrian/Documents/Obsidian Vault/Repo/Archivo"      # Carpeta con tus notas .md
OUTPUT_DIR = "./public/content"              # Carpeta donde se generará la salida
IMAGES_DIR = "/Users/adrian/Documents/Obsidian Vault/Repo/Multimedia"       # Carpeta donde buscar imágenes

# ============================================================================

class ObsidianWikiGenerator:
    def __init__(self, source_dir, output_dir, images_dir):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.images_dir = Path(images_dir)
        self.copied_images = set()
        self.pages_index = []
        
    def parse_frontmatter(self, content):
        """Extrae el frontmatter YAML del contenido"""
        if not content.startswith('---'):
            return {}, content
        
        try:
            end_idx = content.find('---', 3)
            if end_idx == -1:
                return {}, content
            
            frontmatter_text = content[3:end_idx].strip()
            remaining_content = content[end_idx + 3:].strip()
            
            frontmatter = yaml.safe_load(frontmatter_text) or {}
            return frontmatter, remaining_content
        except:
            return {}, content
    
    def get_visibility(self, frontmatter):
        """Obtiene la visibilidad del documento"""
        return frontmatter.get('visibility', 'private').lower()
    
    def get_allowed_users(self, frontmatter):
        """Obtiene la lista de usuarios permitidos"""
        allowed = frontmatter.get('allowed_users', [])
        
        if isinstance(allowed, str):
            allowed = [u.strip() for u in allowed.replace('[', '').replace(']', '').split(',')]
        
        if not isinstance(allowed, list):
            allowed = []
        
        allowed = [u.strip() for u in allowed if u.strip()]
        
        return allowed
    
    def extract_internal_links(self, content):
        """Extrae enlaces internos de Obsidian [[Nota]] o [[Nota|Alias]]"""
        links = []
        
        # Patrón para [[Nota]] o [[Nota|Alias]]
        pattern = r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]'
        matches = re.findall(pattern, content)
        
        for match in matches:
            link_target = match[0].strip()
            link_text = match[1].strip() if match[1] else link_target
            links.append({
                'target': link_target,
                'text': link_text
            })
        
        return links
    
    def extract_dm_sections(self, content):
      """Extrae y marca las secciones DM"""
      # Patrón que captura:
      # 1. <!--DM contenido --> 
      # 2. <!-- contenido --> (cualquier comentario HTML)
      # El \s* permite espacios opcionales, \n? permite salto de línea opcional
      pattern = r'<!--\s*(?:DM\s*)?(.*?)-->'

      def replacer(match):
          dm_content = match.group(1).strip()
          # Solo convertir si tiene contenido
          if dm_content:
              return f'<dm-section>{dm_content}</dm-section>'
          return ''  # Eliminar comentarios vacíos

      return re.sub(pattern, replacer, content, flags=re.DOTALL | re.IGNORECASE)
    
    def generate_content_versions(self, body, visibility):
        """Genera versiones del contenido según permisos"""
        body_with_markers = self.extract_dm_sections(body)
        
        versions = {}
        versions['admin'] = body_with_markers
        versions['player'] = re.sub(
            r'<dm-section>.*?</dm-section>', 
            '', 
            body_with_markers, 
            flags=re.DOTALL
        )
        versions['no_access'] = None if visibility == 'private' else versions['player']
        
        return versions
    
    def find_image_file(self, image_ref):
        """Busca el archivo de imagen en el directorio de imágenes"""
        image_ref = image_ref.strip()
        
        for root, dirs, files in os.walk(self.images_dir):
            for file in files:
                if file.lower() == Path(image_ref).name.lower():
                    return Path(root) / file
                full_path = Path(root) / file
                if str(full_path).endswith(image_ref.replace('\\', '/')):
                    return full_path
        
        return None
    
    def copy_image(self, image_path):
        """Copia una imagen al directorio de salida"""
        if not image_path or not image_path.exists():
            return None
        
        try:
            rel_path = image_path.relative_to(self.images_dir)
        except ValueError:
            rel_path = Path('images') / image_path.name
        
        dest_path = self.output_dir / 'public' / rel_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        if not dest_path.exists():
            shutil.copy2(image_path, dest_path)
            self.copied_images.add(str(rel_path))
        
        return '/' + str(rel_path).replace('\\', '/')
    
    def update_image_references(self, content):
        """Actualiza las referencias a imágenes"""
        def replace_obsidian_link(match):
            image_ref = match.group(1)
            image_path = self.find_image_file(image_ref)
            
            if image_path:
                web_path = self.copy_image(image_path)
                if web_path:
                    return f'![]({web_path})'
            
            return match.group(0)
        
        def replace_markdown_link(match):
            alt_text = match.group(1)
            image_ref = match.group(2)
            image_path = self.find_image_file(image_ref)
            
            if image_path:
                web_path = self.copy_image(image_path)
                if web_path:
                    return f'![{alt_text}]({web_path})'
            
            return match.group(0)
        
        content = re.sub(
            r'!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg))\]\]',
            replace_obsidian_link,
            content,
            flags=re.IGNORECASE
        )
        
        content = re.sub(
            r'!\[([^\]]*)\]\(([^\)]+\.(png|jpg|jpeg|gif|webp|svg))\)',
            replace_markdown_link,
            content,
            flags=re.IGNORECASE
        )
        
        return content
    
    def process_file(self, file_path):
        """Procesa un archivo markdown individual"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            frontmatter, body = self.parse_frontmatter(content)
            visibility = self.get_visibility(frontmatter)
            allowed_users = self.get_allowed_users(frontmatter)
            is_index = frontmatter.get('is_index', False)
            
            # Extraer enlaces internos (siempre, se usarán en el frontend)
            internal_links = self.extract_internal_links(body)
            
            # Actualizar referencias a imágenes
            body = self.update_image_references(body)
            
            # Generar versiones del contenido
            content_versions = self.generate_content_versions(body, visibility)
            
            # Calcular slug/ruta
            rel_path = file_path.relative_to(self.source_dir)
            slug = str(rel_path.with_suffix('')).replace('\\', '/')
            
            # Crear entrada para el índice
            page_data = {
                'slug': slug,
                'title': frontmatter.get('title', rel_path.stem),
                'visibility': visibility,
                'allowed_users': allowed_users,
                'spoilers': frontmatter.get('spoilers', False),
                'is_index': is_index,
                'internal_links': internal_links,
                'content_admin': content_versions['admin'],
                'content_player': content_versions['player'],
                'frontmatter': frontmatter
            }
            
            self.pages_index.append(page_data)
            
            return True
            
        except Exception as e:
            print(f"❌ Error procesando {file_path}: {e}")
            return False
    
    def generate(self):
        """Genera la estructura de datos para la web"""
        print("="*60)
        print("🌟 GENERADOR DE WIKI DEL COSMERE")
        print("="*60)
        print(f"📁 Directorio fuente:   {self.source_dir.absolute()}")
        print(f"📁 Directorio imágenes: {self.images_dir.absolute()}")
        print(f"📁 Directorio salida:   {self.output_dir.absolute()}")
        print()
        
        # Verificar que existan los directorios
        if not self.source_dir.exists():
            print(f"❌ Error: El directorio fuente no existe: {self.source_dir}")
            return False
        
        if not self.images_dir.exists():
            print(f"❌ Error: El directorio de imágenes no existe: {self.images_dir}")
            return False
        
        # Limpiar directorio de salida
        if self.output_dir.exists():
            print(f"🗑️  Limpiando directorio de salida...")
            shutil.rmtree(self.output_dir)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / 'public').mkdir(exist_ok=True)
        
        print(f"🔍 Buscando archivos markdown...\n")
        
        processed = 0
        index_count = 0
        
        # Procesar todos los archivos .md
        for root, dirs, files in os.walk(self.source_dir):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.endswith('.md'):
                    file_path = Path(root) / file
                    if self.process_file(file_path):
                        processed += 1
                        rel_path = file_path.relative_to(self.source_dir)
                        
                        # Verificar si es índice
                        page_data = self.pages_index[-1]
                        if page_data['is_index']:
                            index_count += 1
                            print(f"  ✓ [ÍNDICE] {rel_path}")
                        else:
                            print(f"  ✓ {rel_path}")
        
        # Guardar índice de páginas
        print(f"\n💾 Guardando índice de páginas...")
        with open(self.output_dir / 'pages.json', 'w', encoding='utf-8') as f:
            json.dump(self.pages_index, f, ensure_ascii=False, indent=2)
        
        print(f"\n{'='*60}")
        print(f"✅ GENERACIÓN COMPLETADA")
        print(f"{'='*60}")
        print(f"📄 Archivos procesados: {processed}")
        print(f"📑 Páginas índice:      {index_count}")
        print(f"🖼️  Imágenes copiadas:   {len(self.copied_images)}")
        print(f"📦 Salida en:           {self.output_dir.absolute()}")
        print(f"\n💡 Próximo paso:")
        print(f"   Copia el contenido a tu proyecto Next.js:")
        print(f"   cp -r {self.output_dir}/* <tu-proyecto>/public/content/")
        print(f"{'='*60}\n")
        
        return True


if __name__ == "__main__":
    generator = ObsidianWikiGenerator(
        source_dir=SOURCE_DIR,
        output_dir=OUTPUT_DIR,
        images_dir=IMAGES_DIR
    )
    
    success = generator.generate()
    
    if not success:
        print("\n⚠️  La generación falló. Revisa los errores anteriores.")
        exit(1)