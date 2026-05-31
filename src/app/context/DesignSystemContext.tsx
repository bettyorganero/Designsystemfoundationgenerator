import React, { createContext, useContext, useState, ReactNode } from 'react';

// Color Scale Generation Utilities
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function generateColorScale(baseColor: string): { scale: number; color: string }[] {
  const hsl = hexToHSL(baseColor);
  
  const scales = [
    { scale: 50, lightness: 97 },
    { scale: 100, lightness: 94 },
    { scale: 200, lightness: 86 },
    { scale: 300, lightness: 77 },
    { scale: 400, lightness: 65 },
    { scale: 500, lightness: hsl.l }, // Base color
    { scale: 600, lightness: Math.max(hsl.l - 15, 35) },
    { scale: 700, lightness: Math.max(hsl.l - 25, 28) },
    { scale: 800, lightness: Math.max(hsl.l - 35, 20) },
    { scale: 900, lightness: Math.max(hsl.l - 45, 12) },
    { scale: 950, lightness: Math.max(hsl.l - 52, 7) },
  ];

  return scales.map(({ scale, lightness }) => ({
    scale,
    color: hslToHex(hsl.h, hsl.s, lightness),
  }));
}

// Types
export interface ColorToken {
  name: string;
  light: string;
  dark: string;
  semantic?: string;
}

export interface TypeScale {
  name: string;
  size: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface SpacingToken {
  name: string;
  value: string;
  pixels: number;
}

export interface ShadowToken {
  name: string;
  value: string;
}

export interface RadiusToken {
  name: string;
  value: string;
}

export interface GradientToken {
  name: 'primary' | 'sunset' | 'ocean' | 'purple';
  type: 'linear' | 'radial' | 'conic';
  angle: string;
  stops: {
    color: string; // references a color name from colors array
    position: string;
  }[];
  light: string; // computed CSS value for light theme
  dark: string; // computed CSS value for dark theme
}

export interface BreakpointToken {
  name: string;
  value: string;
  pixels: number;
}

export interface BorderToken {
  name: string;
  width: string;
  style: string;
}

export interface DesignSystemState {
  // Colors
  colors: ColorToken[];
  // Typography
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
    display: string;
  };
  typeScale: TypeScale[];
  fontWeights: { name: string; value: string }[];
  // Spacing
  spacing: SpacingToken[];
  // Radius
  radius: RadiusToken[];
  // Shadows
  shadows: ShadowToken[];
  // Borders
  borders: BorderToken[];
  // Gradients
  gradients: GradientToken[];
  // Layout
  breakpoints: BreakpointToken[];
  gridColumns: number;
  gridGutter: string;
  maxWidth: string;
  // Settings
  currentTheme: 'light' | 'dark';
  previewMode: 'desktop' | 'tablet' | 'mobile';
}

interface DesignSystemContextType {
  state: DesignSystemState;
  updateColors: (colors: ColorToken[]) => void;
  updateFontFamily: (family: Partial<DesignSystemState['fontFamily']>) => void;
  updateTypeScale: (scale: TypeScale[]) => void;
  updateFontWeights: (weights: { name: string; value: string }[]) => void;
  updateSpacing: (spacing: SpacingToken[]) => void;
  updateRadius: (radius: RadiusToken[]) => void;
  updateShadows: (shadows: ShadowToken[]) => void;
  updateBorders: (borders: BorderToken[]) => void;
  updateGradients: (gradients: GradientToken[]) => void;
  updateBreakpoints: (breakpoints: BreakpointToken[]) => void;
  updateGridSettings: (settings: { columns?: number; gutter?: string; maxWidth?: string }) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  addColor: (color: ColorToken) => void;
  removeColor: (name: string) => void;
  exportCSS: () => string;
  exportJSON: () => string;
  importJSON: (jsonString: string) => { success: boolean; error?: string };
}

const defaultState: DesignSystemState = {
  colors: [
    { name: 'primary', light: '#0066FF', dark: '#4D94FF', semantic: 'Primary actions, links, focus states' },
    { name: 'secondary', light: '#6366F1', dark: '#818CF8', semantic: 'Secondary actions, accents' },
    { name: 'success', light: '#10B981', dark: '#34D399', semantic: 'Success states, confirmations' },
    { name: 'warning', light: '#F59E0B', dark: '#FBBF24', semantic: 'Warning states, cautions' },
    { name: 'error', light: '#EF4444', dark: '#F87171', semantic: 'Error states, destructive actions' },
    { name: 'pink', light: '#EC4899', dark: '#F472B6', semantic: 'Accent color' },
    { name: 'background', light: '#FFFFFF', dark: '#0A0A0A', semantic: 'Main background' },
    { name: 'surface', light: '#F9FAFB', dark: '#171717', semantic: 'Card backgrounds, elevated surfaces' },
    { name: 'text-primary', light: '#111827', dark: '#F9FAFB', semantic: 'Primary text content' },
    { name: 'text-secondary', light: '#6B7280', dark: '#9CA3AF', semantic: 'Secondary text, labels' },
    { name: 'border', light: '#E5E7EB', dark: '#374151', semantic: 'Borders, dividers' },
  ],
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", serif',
    mono: '"Fira Code", "Courier New", monospace',
    display: 'Inter, system-ui, sans-serif',
  },
  typeScale: [
    { name: 'xs', size: '0.75rem', lineHeight: '1rem', letterSpacing: '0' },
    { name: 'sm', size: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0' },
    { name: 'base', size: '1rem', lineHeight: '1.5rem', letterSpacing: '0' },
    { name: 'lg', size: '1.125rem', lineHeight: '1.75rem', letterSpacing: '0' },
    { name: 'xl', size: '1.25rem', lineHeight: '1.75rem', letterSpacing: '0' },
    { name: '2xl', size: '1.5rem', lineHeight: '2rem', letterSpacing: '-0.01em' },
    { name: '3xl', size: '1.875rem', lineHeight: '2.25rem', letterSpacing: '-0.02em' },
    { name: '4xl', size: '2.25rem', lineHeight: '2.5rem', letterSpacing: '-0.02em' },
    { name: '5xl', size: '3rem', lineHeight: '1', letterSpacing: '-0.02em' },
    { name: '6xl', size: '3.75rem', lineHeight: '1', letterSpacing: '-0.03em' },
  ],
  fontWeights: [
    { name: 'regular', value: '400' },
    { name: 'medium', value: '500' },
    { name: 'semibold', value: '600' },
    { name: 'bold', value: '700' },
  ],
  spacing: [
    { name: '0', value: '0', pixels: 0 },
    { name: '1', value: '0.25rem', pixels: 4 },
    { name: '2', value: '0.5rem', pixels: 8 },
    { name: '3', value: '0.75rem', pixels: 12 },
    { name: '4', value: '1rem', pixels: 16 },
    { name: '5', value: '1.25rem', pixels: 20 },
    { name: '6', value: '1.5rem', pixels: 24 },
    { name: '8', value: '2rem', pixels: 32 },
    { name: '10', value: '2.5rem', pixels: 40 },
    { name: '12', value: '3rem', pixels: 48 },
    { name: '16', value: '4rem', pixels: 64 },
    { name: '20', value: '5rem', pixels: 80 },
    { name: '24', value: '6rem', pixels: 96 },
  ],
  radius: [
    { name: 'none', value: '0' },
    { name: 'sm', value: '0.25rem' },
    { name: 'base', value: '0.5rem' },
    { name: 'md', value: '0.75rem' },
    { name: 'lg', value: '1rem' },
    { name: 'xl', value: '1.5rem' },
    { name: '2xl', value: '2rem' },
    { name: 'full', value: '9999px' },
  ],
  shadows: [
    { name: 'xs', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
    { name: 'sm', value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
    { name: 'base', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
    { name: 'md', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
    { name: 'lg', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
    { name: 'xl', value: '0 25px 50px -12px rgb(0 0 0 / 0.25)' },
  ],
  borders: [
    { name: 'thin', width: '1px', style: 'solid' },
    { name: 'base', width: '2px', style: 'solid' },
    { name: 'thick', width: '4px', style: 'solid' },
  ],
  gradients: [
    { name: 'primary', type: 'linear', angle: '135deg', stops: [{ color: 'primary', position: '0%' }, { color: 'secondary', position: '100%' }], light: 'linear-gradient(135deg, #0066FF 0%, #6366F1 100%)', dark: 'linear-gradient(135deg, #4D94FF 0%, #818CF8 100%)' },
    { name: 'sunset', type: 'linear', angle: '135deg', stops: [{ color: 'warning', position: '0%' }, { color: 'error', position: '100%' }], light: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', dark: 'linear-gradient(135deg, #FBBF24 0%, #F87171 100%)' },
    { name: 'ocean', type: 'linear', angle: '135deg', stops: [{ color: 'primary', position: '0%' }, { color: 'success', position: '100%' }], light: 'linear-gradient(135deg, #0066FF 0%, #10B981 100%)', dark: 'linear-gradient(135deg, #4D94FF 0%, #34D399 100%)' },
    { name: 'purple', type: 'linear', angle: '135deg', stops: [{ color: 'secondary', position: '0%' }, { color: 'pink', position: '100%' }], light: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)', dark: 'linear-gradient(135deg, #818CF8 0%, #F472B6 100%)' },
  ],
  breakpoints: [
    { name: 'sm', value: '640px', pixels: 640 },
    { name: 'md', value: '768px', pixels: 768 },
    { name: 'lg', value: '1024px', pixels: 1024 },
    { name: 'xl', value: '1280px', pixels: 1280 },
    { name: '2xl', value: '1536px', pixels: 1536 },
  ],
  gridColumns: 12,
  gridGutter: '1.5rem',
  maxWidth: '1280px',
  currentTheme: 'light',
  previewMode: 'desktop',
};

const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined);

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DesignSystemState>(defaultState);

  const updateColors = (colors: ColorToken[]) => {
    setState(prev => ({ ...prev, colors }));
  };

  const updateFontFamily = (family: Partial<DesignSystemState['fontFamily']>) => {
    setState(prev => ({ ...prev, fontFamily: { ...prev.fontFamily, ...family } }));
  };

  const updateTypeScale = (scale: TypeScale[]) => {
    setState(prev => ({ ...prev, typeScale: scale }));
  };

  const updateFontWeights = (weights: { name: string; value: string }[]) => {
    setState(prev => ({ ...prev, fontWeights: weights }));
  };

  const updateSpacing = (spacing: SpacingToken[]) => {
    setState(prev => ({ ...prev, spacing }));
  };

  const updateRadius = (radius: RadiusToken[]) => {
    setState(prev => ({ ...prev, radius }));
  };

  const updateShadows = (shadows: ShadowToken[]) => {
    setState(prev => ({ ...prev, shadows }));
  };

  const updateBorders = (borders: BorderToken[]) => {
    setState(prev => ({ ...prev, borders }));
  };

  const updateGradients = (gradients: GradientToken[]) => {
    setState(prev => ({ ...prev, gradients }));
  };

  const updateBreakpoints = (breakpoints: BreakpointToken[]) => {
    setState(prev => ({ ...prev, breakpoints }));
  };

  const updateGridSettings = (settings: { columns?: number; gutter?: string; maxWidth?: string }) => {
    setState(prev => ({
      ...prev,
      gridColumns: settings.columns ?? prev.gridColumns,
      gridGutter: settings.gutter ?? prev.gridGutter,
      maxWidth: settings.maxWidth ?? prev.maxWidth,
    }));
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, currentTheme: theme }));
  };

  const setPreviewMode = (mode: 'desktop' | 'tablet' | 'mobile') => {
    setState(prev => ({ ...prev, previewMode: mode }));
  };

  const addColor = (color: ColorToken) => {
    setState(prev => ({ ...prev, colors: [...prev.colors, color] }));
  };

  const removeColor = (name: string) => {
    setState(prev => ({ ...prev, colors: prev.colors.filter(c => c.name !== name) }));
  };

  const exportCSS = () => {
    const theme = state.currentTheme;
    let css = ':root {\n';
    
    // Colors with scale variants
    css += `  /* Colors */\n`;
    state.colors.forEach(color => {
      const baseColor = theme === 'light' ? color.light : color.dark;
      const colorScale = generateColorScale(baseColor);
      
      // Generate scale variants
      colorScale.forEach(({ scale, color: scaleColor }) => {
        css += `  --color-${color.name}-${scale}: ${scaleColor};\n`;
      });
      
      // Add base color reference (points to 500)
      css += `  --color-${color.name}: var(--color-${color.name}-500);\n\n`;
    });
    
    // Typography
    css += `  /* Typography */\n`;
    css += `  --font-sans: ${state.fontFamily.sans};\n`;
    css += `  --font-serif: ${state.fontFamily.serif};\n`;
    css += `  --font-mono: ${state.fontFamily.mono};\n`;
    css += `  --font-display: ${state.fontFamily.display};\n\n`;
    
    // Font Weights
    state.fontWeights.forEach(weight => {
      css += `  --font-${weight.name}: ${weight.value};\n`;
    });
    css += '\n';
    
    // Type Scale
    state.typeScale.forEach(scale => {
      css += `  --text-${scale.name}: ${scale.size};\n`;
      css += `  --leading-${scale.name}: ${scale.lineHeight};\n`;
      css += `  --tracking-${scale.name}: ${scale.letterSpacing};\n`;
    });
    
    // Spacing
    css += `\n  /* Spacing */\n`;
    state.spacing.forEach(space => {
      css += `  --spacing-${space.name}: ${space.value};\n`;
    });
    
    // Radius
    css += `\n  /* Border Radius */\n`;
    state.radius.forEach(r => {
      css += `  --radius-${r.name}: ${r.value};\n`;
    });
    
    // Shadows
    css += `\n  /* Shadows */\n`;
    state.shadows.forEach(shadow => {
      css += `  --shadow-${shadow.name}: ${shadow.value};\n`;
    });
    
    // Borders
    css += `\n  /* Borders */\n`;
    state.borders.forEach(border => {
      css += `  --border-${border.name}: ${border.width} ${border.style};\n`;
    });
    
    // Gradients
    css += `\n  /* Gradients */\n`;
    state.gradients.forEach(gradient => {
      css += `  --gradient-${gradient.name}: ${theme === 'light' ? gradient.light : gradient.dark};\n`;
    });
    
    // Breakpoints
    css += `\n  /* Breakpoints */\n`;
    state.breakpoints.forEach(breakpoint => {
      css += `  --breakpoint-${breakpoint.name}: ${breakpoint.value};\n`;
    });
    
    // Layout
    css += `\n  /* Layout */\n`;
    css += `  --grid-columns: ${state.gridColumns};\n`;
    css += `  --grid-gutter: ${state.gridGutter};\n`;
    css += `  --max-width: ${state.maxWidth};\n`;

    css += '}\n';
    return css;
  };

  const exportJSON = () => {
    const collections: any[] = [];

    // Colors Collection
    const colorVariableTypes: Record<string, string> = {};
    const colorVariables: any[] = [];

    state.colors.forEach(color => {
      const lightScale = generateColorScale(color.light);
      const darkScale = generateColorScale(color.dark);

      lightScale.forEach(({ scale }) => {
        const varName = `colors/${color.name}/${scale}`;
        colorVariableTypes[varName] = 'COLOR';

        colorVariables.push({
          name: varName,
          type: 'COLOR',
          valuesByMode: {
            Light: lightScale.find(s => s.scale === scale)?.color || color.light,
            Dark: darkScale.find(s => s.scale === scale)?.color || color.dark,
          },
        });
      });
    });

    collections.push({
      name: 'Colors',
      modes: ['Light', 'Dark'],
      variableTypes: colorVariableTypes,
      variables: colorVariables,
    });

    // Spacing Collection
    const spacingVariableTypes: Record<string, string> = {};
    const spacingVariables: any[] = [];

    state.spacing.forEach(space => {
      const varName = `spacing/${space.name}`;
      spacingVariableTypes[varName] = 'FLOAT';

      spacingVariables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(space.value) || 0,
        },
      });
    });

    collections.push({
      name: 'Spacing',
      modes: ['Default'],
      variableTypes: spacingVariableTypes,
      variables: spacingVariables,
    });

    // Radius Collection
    const radiusVariableTypes: Record<string, string> = {};
    const radiusVariables: any[] = [];

    state.radius.forEach(rad => {
      const varName = `radius/${rad.name}`;
      radiusVariableTypes[varName] = 'FLOAT';

      radiusVariables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(rad.value) || 0,
        },
      });
    });

    collections.push({
      name: 'Radius',
      modes: ['Default'],
      variableTypes: radiusVariableTypes,
      variables: radiusVariables,
    });

    // Shadows Collection
    const shadowVariableTypes: Record<string, string> = {};
    const shadowVariables: any[] = [];

    state.shadows.forEach(shadow => {
      const varName = `shadows/${shadow.name}`;
      shadowVariableTypes[varName] = 'STRING';

      shadowVariables.push({
        name: varName,
        type: 'STRING',
        valuesByMode: {
          Default: shadow.value,
        },
      });
    });

    collections.push({
      name: 'Shadows',
      modes: ['Default'],
      variableTypes: shadowVariableTypes,
      variables: shadowVariables,
    });

    // Gradients Collection
    const gradientVariableTypes: Record<string, string> = {};
    const gradientVariables: any[] = [];

    state.gradients.forEach(gradient => {
      const varName = `gradients/${gradient.name}`;
      gradientVariableTypes[varName] = 'STRING';

      gradientVariables.push({
        name: varName,
        type: 'STRING',
        valuesByMode: {
          Default: gradient.value,
        },
      });
    });

    collections.push({
      name: 'Gradients',
      modes: ['Default'],
      variableTypes: gradientVariableTypes,
      variables: gradientVariables,
    });

    // Layout Collection
    const layoutVariableTypes: Record<string, string> = {};
    const layoutVariables: any[] = [];

    state.breakpoints.forEach(breakpoint => {
      const varName = `layout/${breakpoint.name}`;
      layoutVariableTypes[varName] = 'FLOAT';

      layoutVariables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(breakpoint.value) || 0,
        },
      });
    });

    collections.push({
      name: 'Layout',
      modes: ['Default'],
      variableTypes: layoutVariableTypes,
      variables: layoutVariables,
    });

    // Typography Collection
    const typographyVariableTypes: Record<string, string> = {};
    const typographyVariables: any[] = [];

    // Font families
    Object.entries(state.fontFamily).forEach(([key, value]) => {
      const varName = `typography/fontFamilies/${key}`;
      typographyVariableTypes[varName] = 'STRING';
      typographyVariables.push({
        name: varName,
        type: 'STRING',
        valuesByMode: {
          Default: value,
        },
      });
    });

    // Type scale (font sizes)
    state.typeScale.forEach(scale => {
      const varName = `typography/fontSizes/${scale.name}`;
      typographyVariableTypes[varName] = 'FLOAT';
      typographyVariables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(scale.size) || 0,
        },
      });
    });

    // Font weights
    state.fontWeights.forEach(weight => {
      const varName = `typography/fontWeights/${weight.name}`;
      typographyVariableTypes[varName] = 'FLOAT';
      typographyVariables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(weight.value) || parseInt(weight.value) || 400,
        },
      });
    });

    collections.push({
      name: 'Typography',
      modes: ['Default'],
      variableTypes: typographyVariableTypes,
      variables: typographyVariables,
    });

    return JSON.stringify({
      meta: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
      },
      collections,
    }, null, 2);
  };

  const importJSON = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonString);

      // Validate format
      if (!data.collections || !Array.isArray(data.collections)) {
        return { success: false, error: 'Invalid JSON format: missing collections array' };
      }

      const newState: Partial<DesignSystemState> = {};

      // Process each collection
      data.collections.forEach((collection: any) => {
        const { name, variables } = collection;

        switch (name) {
          case 'Colors': {
            // Extract unique color names and build color tokens
            const colorMap = new Map<string, { light: string; dark: string; semantic?: string }>();

            variables.forEach((variable: any) => {
              // Parse variable name: "colors/primary/500"
              const parts = variable.name.split('/');
              if (parts[0] === 'colors' && parts.length === 3) {
                const colorName = parts[1];
                const scale = parts[2];

                // Use the base color (scale 500) as the primary color value
                // This is the middle value that we use to generate the full scale
                if (scale === '500') {
                  if (!colorMap.has(colorName)) {
                    colorMap.set(colorName, {
                      light: variable.valuesByMode.Light || '#000000',
                      dark: variable.valuesByMode.Dark || '#FFFFFF',
                      semantic: '',
                    });
                  }
                }
              }
            });

            // If no colors found, keep existing colors
            if (colorMap.size > 0) {
              newState.colors = Array.from(colorMap.entries()).map(([name, values]) => ({
                name,
                light: values.light,
                dark: values.dark,
                semantic: values.semantic || '',
              }));
            }
            break;
          }

          case 'Spacing': {
            newState.spacing = variables.map((variable: any) => {
              const name = variable.name.split('/').pop() || '';
              const value = variable.valuesByMode.Default || 0;
              return {
                name,
                value: `${value}rem`,
                pixels: Math.round(value * 16),
              };
            });
            break;
          }

          case 'Radius': {
            newState.radius = variables.map((variable: any) => {
              const name = variable.name.split('/').pop() || '';
              const value = variable.valuesByMode.Default || 0;
              return {
                name,
                value: `${value}px`,
              };
            });
            break;
          }

          case 'Shadows': {
            newState.shadows = variables.map((variable: any) => {
              const name = variable.name.split('/').pop() || '';
              return {
                name,
                value: variable.valuesByMode.Default || '',
              };
            });
            break;
          }

          case 'Gradients': {
            newState.gradients = variables.map((variable: any) => {
              const name = variable.name.split('/').pop() || '';
              return {
                name,
                value: variable.valuesByMode.Default || '',
              };
            });
            break;
          }

          case 'Layout': {
            newState.breakpoints = variables.map((variable: any) => {
              const name = variable.name.split('/').pop() || '';
              const value = variable.valuesByMode.Default || 0;
              return {
                name,
                value: `${value}px`,
              };
            });
            break;
          }

          case 'Typography': {
            const fontFamilies: any = {};
            const fontSizes: any[] = [];
            const fontWeights: any[] = [];

            variables.forEach((variable: any) => {
              const parts = variable.name.split('/');

              if (parts[1] === 'fontFamilies' && parts[2]) {
                fontFamilies[parts[2]] = variable.valuesByMode.Default || '';
              } else if (parts[1] === 'fontSizes' && parts[2]) {
                fontSizes.push({
                  name: parts[2],
                  size: `${variable.valuesByMode.Default}rem`,
                  lineHeight: '1.5',
                  letterSpacing: '0',
                });
              } else if (parts[1] === 'fontWeights' && parts[2]) {
                fontWeights.push({
                  name: parts[2],
                  value: String(variable.valuesByMode.Default || 400),
                });
              }
            });

            if (Object.keys(fontFamilies).length > 0) {
              newState.fontFamily = fontFamilies;
            }
            if (fontSizes.length > 0) {
              newState.typeScale = fontSizes;
            }
            if (fontWeights.length > 0) {
              newState.fontWeights = fontWeights;
            }
            break;
          }
        }
      });

      // Update state with imported data
      setState(prevState => ({
        ...prevState,
        ...newState,
      }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse JSON'
      };
    }
  };

  return (
    <DesignSystemContext.Provider
      value={{
        state,
        updateColors,
        updateFontFamily,
        updateTypeScale,
        updateFontWeights,
        updateSpacing,
        updateRadius,
        updateShadows,
        updateBorders,
        updateGradients,
        updateBreakpoints,
        updateGridSettings,
        setTheme,
        setPreviewMode,
        addColor,
        removeColor,
        exportCSS,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within DesignSystemProvider');
  }
  return context;
}