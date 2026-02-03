#!/bin/bash

echo "============================================================"
echo "🚀 ACTUALIZANDO Y DESPLEGANDO WIKI DEL COSMERE"
echo "============================================================"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Regenerar wiki
echo -e "\n${BLUE}📝 Paso 1: Regenerando contenido de la wiki...${NC}"
python3 updater.py

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Error al regenerar wiki${NC}"
    exit 1
fi

# Paso 3: Verificar cambios en Git
echo -e "\n${BLUE}🔍 Paso 3: Verificando cambios en Git...${NC}"

# Verificar si hay cambios
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ No hay cambios para commitear${NC}"
    exit 0
fi

# Paso 4: Añadir archivos
echo -e "\n${BLUE}➕ Paso 4: Añadiendo archivos...${NC}"
git add .

# Paso 5: Generar mensaje de commit inteligente
echo -e "\n${BLUE}💬 Paso 5: Generando mensaje de commit...${NC}"

# Obtener estadísticas de cambios
files_changed=$(git diff --cached --name-only | wc -l | tr -d ' ')
insertions=$(git diff --cached --numstat | awk '{added+=$1} END {print added}')
deletions=$(git diff --cached --numstat | awk '{deleted+=$2} END {print deleted}')

# Detectar archivos nuevos, modificados y eliminados
new_files=$(git diff --cached --name-status | grep "^A" | wc -l | tr -d ' ')
modified_files=$(git diff --cached --name-status | grep "^M" | wc -l | tr -d ' ')
deleted_files=$(git diff --cached --name-status | grep "^D" | wc -l | tr -d ' ')

# Detectar qué páginas cambiaron (del JSON)
if [ -f "public/content/pages.json" ]; then
    # Obtener títulos de páginas del JSON (primeras 5)
    changed_pages=$(git diff --cached public/content/pages.json | grep '"title":' | head -5 | sed 's/.*"title": "\(.*\)".*/\1/' | tr '\n' ', ' | sed 's/,$//')
fi

# Construir mensaje de commit
commit_msg="📚 Actualización wiki"

# Agregar detalles de cambios
details=""
[ "$new_files" -gt 0 ] && details="${details}✨ ${new_files} nuevas"
[ "$modified_files" -gt 0 ] && details="${details}${details:+, }📝 ${modified_files} modificadas"
[ "$deleted_files" -gt 0 ] && details="${details}${details:+, }🗑️  ${deleted_files} eliminadas"

if [ -n "$details" ]; then
    commit_msg="${commit_msg}: ${details}"
fi

# Agregar estadísticas
if [ "$insertions" -gt 0 ] || [ "$deletions" -gt 0 ]; then
    commit_msg="${commit_msg} (+${insertions}/-${deletions} líneas)"
fi

# Agregar páginas cambiadas si hay
if [ -n "$changed_pages" ]; then
    commit_msg="${commit_msg}

Páginas: ${changed_pages}"
fi

echo -e "${GREEN}Mensaje: ${commit_msg}${NC}"

# Paso 6: Hacer commit
echo -e "\n${BLUE}💾 Paso 6: Haciendo commit...${NC}"
git commit -m "$commit_msg"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Error al hacer commit${NC}"
    exit 1
fi

# Paso 7: Push a GitHub
echo -e "\n${BLUE}🚀 Paso 7: Subiendo cambios a GitHub...${NC}"
git push

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}============================================================${NC}"
    echo -e "${GREEN}✅ WIKI ACTUALIZADA Y DESPLEGADA CORRECTAMENTE${NC}"
    echo -e "${GREEN}============================================================${NC}"
else
    echo -e "${YELLOW}⚠️  Error al hacer push${NC}"
    exit 1
fi