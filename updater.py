import os
import re
import shutil
from pathlib import Path
import yaml
import json

# ============================================================================
# CONFIGURACIÓN - EDITA ESTAS RUTAS SEGÚN TU PROYECTO
# ============================================================================

REPO_DIR = "/Users/adrian/Documents/Obsidian Vault/Repo"              # Carpeta raíz con subcarpetas de campañas
OUTPUT_DIR = "./public/content"              # Carpeta donde se generarán las salidas
IMAGES_DIR = "/Users/adrian/Documents/Obsidian Vault/Repo/Multimedia"       # Carpeta donde buscar imágenes

# Campañas (debe haber carpetas con estos nombres en REPO_DIR)
CAMPAIGNS = ['Archivo', 'Mistborn']

# ============================================================================

class ObsidianWikiGenerator:
    def __init__(self, source_dir, output_dir, images_dir, campaign_name):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir) / campaign_name.lower()
        self.images_dir = Path(images_dir)
        self.campaign_name = campaign_name
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
    
    def parse_allowed_users(self, allowed_users_str):
        """Parsea la cadena de usuarios permitidos"""
        if not allowed_users_str:
            return []

        # Si ya es una lista, devolverla
        if isinstance(allowed_users_str, list):
            return allowed_users_str

        # Eliminar corchetes y espacios
        cleaned = allowed_users_str.strip('[]').strip()

        if not cleaned:
            return []

        # Separar por comas y limpiar cada usuario
        users = [user.strip() for user in cleaned.split(',')]

        # Filtrar usuarios vacíos
        users = [user for user in users if user]

        return users
    
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
      pattern = r'<!--\s*(?:DM\s*)?(.*?)-->'

      def replacer(match):
          dm_content = match.group(1).strip()
          if dm_content:
              return f'<dm-section>{dm_content}</dm-section>'
          return ''

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
            is_index = frontmatter.get('is_index', False)
            
            internal_links = self.extract_internal_links(body)
            body = self.update_image_references(body)
            content_versions = self.generate_content_versions(body, visibility)
            
            rel_path = file_path.relative_to(self.source_dir)
            slug = str(rel_path.with_suffix('')).replace('\\', '/')
            
            page_data = {
                'slug': slug,
                'title': frontmatter.get('title', rel_path.stem),
                'visibility': visibility,
                'allowed_users': self.parse_allowed_users(frontmatter.get('allowed_users', '')),
                'spoilers': frontmatter.get('spoilers', False),
                'is_index': is_index,
                'is_subindex': frontmatter.get('is_subindex', False),
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
        print(f"\n{'='*60}")
        print(f"🎯 CAMPAÑA: {self.campaign_name}")
        print(f"{'='*60}")
        print(f"📁 Directorio fuente:   {self.source_dir.absolute()}")
        print(f"📁 Directorio salida:   {self.output_dir.absolute()}")
        print()
        
        # Verificar que exista el directorio
        if not self.source_dir.exists():
            print(f"❌ Error: El directorio no existe: {self.source_dir}")
            return False
        
        if not self.images_dir.exists():
            print(f"⚠️  Aviso: El directorio de imágenes no existe: {self.images_dir}")
        
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
        print(f"✅ {self.campaign_name.upper()} - GENERACIÓN COMPLETADA")
        print(f"{'='*60}")
        print(f"📄 Archivos procesados: {processed}")
        print(f"📑 Páginas índice:      {index_count}")
        print(f"🖼️  Imágenes copiadas:   {len(self.copied_images)}")
        print(f"{'='*60}")
        
        return True


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌟 GENERADOR DE WIKI DEL COSMERE - MULTIPLES CAMPAÑAS")
    print("="*60)
    
    all_success = True
    
    for campaign in CAMPAIGNS:
        campaign_source = Path(REPO_DIR) / campaign
        
        if not campaign_source.exists():
            print(f"\n⚠️  Carpeta de {campaign} no encontrada en {campaign_source}")
            continue
        
        generator = ObsidianWikiGenerator(
            source_dir=campaign_source,
            output_dir=OUTPUT_DIR,
            images_dir=IMAGES_DIR,
            campaign_name=campaign
        )
        
        if not generator.generate():
            all_success = False
    
    print("\n" + "="*60)
    if all_success:
        print("✅ TODAS LAS CAMPAÑAS GENERADAS EXITOSAMENTE")
    else:
        print("⚠️  ALGUNAS CAMPAÑAS TUVIERON ERRORES")
    print("="*60 + "\n")
    
    if not all_success:
        exit(1)