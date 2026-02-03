#!/usr/bin/env python3
"""
Vigilante de archivos para la Wiki del Cosmere
Detecta cambios en archivos Markdown y regenera automáticamente
Solo ejecuta después de 10 segundos sin cambios
"""

import time
import os
import subprocess
import sys
import threading
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class WikiUpdateHandler(FileSystemEventHandler):
    """Maneja eventos de cambios en archivos"""
    
    def __init__(self, idle_seconds=10):
        self.idle_seconds = idle_seconds
        self.last_change_time = 0
        self.pending_changes = []
        self.timer = None
        self.lock = threading.Lock()
        
    def on_any_event(self, event):
        """Se ejecuta cuando hay cualquier cambio"""
        # Ignorar eventos de directorios
        if event.is_directory:
            return
        
        # Ignorar archivos temporales de Obsidian y otros
        ignored_patterns = ['.tmp', '.swp', '~', '.DS_Store', '.obsidian']
        if any(pattern in event.src_path for pattern in ignored_patterns):
            return
        
        # Solo procesar archivos .md
        if not event.src_path.endswith('.md'):
            return
        
        with self.lock:
            # Registrar el cambio
            current_time = time.time()
            self.last_change_time = current_time
            
            # Agregar a la lista de cambios pendientes
            filename = os.path.basename(event.src_path)
            event_type = {
                'modified': '📝 Modificado',
                'created': '✨ Creado',
                'deleted': '🗑️  Eliminado',
                'moved': '📦 Movido'
            }.get(event.event_type, '🔄 Cambio')
            
            change_info = f"{event_type}: {filename}"
            
            # Evitar duplicados en la lista
            if change_info not in self.pending_changes:
                self.pending_changes.append(change_info)
                print(f"⏳ {change_info} (esperando más cambios...)")
            
            # Cancelar el timer anterior si existe
            if self.timer is not None:
                self.timer.cancel()
            
            # Crear nuevo timer
            self.timer = threading.Timer(self.idle_seconds, self.on_idle)
            self.timer.start()
    
    def on_idle(self):
        """Se ejecuta cuando han pasado 10 segundos sin cambios"""
        with self.lock:
            if not self.pending_changes:
                return
            
            print("\n" + "=" * 60)
            print(f"✅ {self.idle_seconds} segundos sin cambios. Regenerando wiki...")
            print("=" * 60)
            print("📋 Resumen de cambios:")
            for change in self.pending_changes:
                print(f"  • {change}")
            print("=" * 60)
            
            # Regenerar wiki
            self.regenerate_wiki()
            
            # Limpiar lista de cambios pendientes
            self.pending_changes.clear()
    
    def regenerate_wiki(self):
        """Ejecuta el script de actualización"""
        print("\n🔄 Ejecutando updater.py...")
        
        try:
            # Ejecutar updater.py
            result = subprocess.run(
                ['python3', 'updater.py'],
                capture_output=True,
                text=True,
                check=True
            )
            
            # Mostrar solo las líneas importantes del output
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if '✅' in line or '📄' in line or 'Procesados' in line:
                    print(line)
            
            print("=" * 60)
            print("👁️  Continuando vigilancia...")
            print("=" * 60 + "\n")
            
        except subprocess.CalledProcessError as e:
            print(f"\n❌ Error al regenerar wiki:")
            print(e.stderr)
            print("=" * 60 + "\n")
        except Exception as e:
            print(f"\n❌ Error inesperado: {e}")
            print("=" * 60 + "\n")

def main():
    # Configuración de rutas
    WATCH_PATH = "/Users/adrian/Documents/Obsidian Vault/Repo/Archivo"
    IDLE_SECONDS = 10
    
    print("=" * 60)
    print("👁️  VIGILANTE INTELIGENTE DE WIKI DEL COSMERE")
    print("=" * 60)
    print(f"📁 Vigilando: {WATCH_PATH}")
    print(f"🔍 Detectando cambios en archivos .md")
    print(f"⏱️  Espera de inactividad: {IDLE_SECONDS} segundos")
    print(f"💡 El script se ejecutará {IDLE_SECONDS}s después del último cambio")
    print("\nPresiona Ctrl+C para detener")
    print("=" * 60 + "\n")
    
    # Verificar que el directorio existe
    if not os.path.exists(WATCH_PATH):
        print(f"❌ Error: El directorio {WATCH_PATH} no existe")
        sys.exit(1)
    
    # Crear el observador
    event_handler = WikiUpdateHandler(idle_seconds=IDLE_SECONDS)
    observer = Observer()
    observer.schedule(event_handler, WATCH_PATH, recursive=True)
    
    # Iniciar observación
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Deteniendo vigilante...")
        
        # Cancelar timer pendiente si existe
        with event_handler.lock:
            if event_handler.timer is not None:
                event_handler.timer.cancel()
        
        observer.stop()
    
    observer.join()
    print("✅ Vigilante detenido\n")

if __name__ == "__main__":
    main()