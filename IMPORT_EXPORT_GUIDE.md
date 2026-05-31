# Import/Export Guide - Design System

Esta guía explica cómo usar las funcionalidades de importación y exportación del Design System.

## Exportación

### Formatos Disponibles

1. **JSON Tokens (Figma Variables)**
   - Formato compatible con Figma Variables
   - Incluye todas las colecciones: Colors, Spacing, Radius, Shadows, Gradients, Layout, Typography
   - Archivo: `design-tokens.json`

2. **CSS Variables**
   - Variables CSS personalizadas listas para usar
   - Archivo: `design-system.css`

3. **Tailwind Config**
   - Configuración de Tailwind CSS
   - Archivo: `tailwind.config.js`

4. **SCSS Variables**
   - Variables SCSS/Sass
   - Archivo: `_variables.scss`

### Exportación Individual por Sección

Cada sección (Colors, Spacing, Radius, etc.) tiene sus propios botones de exportación:
- **Copy Figma Variables**: Copia al portapapeles en formato Figma Variables
- **Download**: Descarga un archivo JSON con el nombre `[Sección]_Tokens.json`

## Importación

### Cómo Importar un Design System

1. Ve a la sección **Export** en la navegación lateral
2. En la parte superior verás el panel **Import Design System**
3. Haz clic en **Choose JSON File**
4. Selecciona tu archivo JSON con formato Figma Variables
5. El sistema actualizará automáticamente todas las secciones con los nuevos valores

### Formato del Archivo JSON

El archivo JSON debe seguir esta estructura:

```json
{
  "meta": {
    "version": "1.0.0",
    "exportedAt": "2026-05-26T12:00:00.000Z"
  },
  "collections": [
    {
      "name": "Colors",
      "modes": ["Light", "Dark"],
      "variableTypes": {
        "colors/primary/500": "COLOR"
      },
      "variables": [
        {
          "name": "colors/primary/500",
          "type": "COLOR",
          "valuesByMode": {
            "Light": "#3B82F6",
            "Dark": "#3B82F6"
          }
        }
      ]
    }
  ]
}
```

### Colecciones Soportadas

- **Colors**: Define colores con escalas y modos Light/Dark
- **Spacing**: Valores de espaciado (FLOAT, se convierten a rem)
- **Radius**: Valores de border-radius (FLOAT, se convierten a px)
- **Shadows**: Valores de box-shadow (STRING)
- **Gradients**: Valores de gradientes CSS (STRING)
- **Layout**: Breakpoints y layout (FLOAT, se convierten a px)
- **Typography**: Familias de fuentes (STRING), tamaños (FLOAT), y pesos (FLOAT)

### Tipos de Variables

- `COLOR`: Valores hexadecimales de color (#RRGGBB)
- `FLOAT`: Valores numéricos (se convertirán a las unidades apropiadas)
- `STRING`: Valores de texto (fuentes, sombras, gradientes)

### Validación

El sistema valida automáticamente:
- Formato JSON válido
- Presencia del array `collections`
- Estructura de cada colección
- Tipos de datos correctos

Si hay un error en la importación, se mostrará un mensaje descriptivo del problema.

## Workflow Recomendado

1. **Crear tu Design System**: Usa la interfaz para crear y ajustar tus tokens
2. **Exportar**: Descarga el archivo `design-tokens.json` desde la sección Export
3. **Compartir**: Comparte este archivo con tu equipo
4. **Importar en Figma**: 
   - Abre Figma
   - Ve al panel de Variables
   - Click derecho → Import variables
   - Selecciona tu archivo JSON
5. **Modificar y Reimportar**: Si haces cambios en Figma, exporta desde Figma y reimporta aquí

## Ejemplo de Archivo

Revisa el archivo `IMPORT_FORMAT_EXAMPLE.json` en la raíz del proyecto para ver un ejemplo completo de todos los formatos soportados.
