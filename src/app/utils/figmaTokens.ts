import { ColorToken, SpacingToken, RadiusToken, ShadowToken, GradientToken, BreakpointToken } from '../context/DesignSystemContext';

// Helper function to copy text to clipboard
export const copyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy:', err);
  } finally {
    document.body.removeChild(textArea);
  }
};

// Helper function to download JSON file
export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Generate Figma-compatible color tokens with color scales
export const generateFigmaColorTokens = (colors: ColorToken[]) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  colors.forEach(color => {
    // Generate color scale for this color
    const lightScale = generateColorScale(color.light);
    const darkScale = generateColorScale(color.dark);

    // Add each scale value as a variable
    lightScale.forEach(({ scale }) => {
      const varName = `colors/${color.name}/${scale}`;
      variableTypes[varName] = 'COLOR';

      variables.push({
        name: varName,
        type: 'COLOR',
        valuesByMode: {
          Light: lightScale.find(s => s.scale === scale)?.color || color.light,
          Dark: darkScale.find(s => s.scale === scale)?.color || color.dark,
        },
      });
    });
  });

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Colors',
        modes: ['Light', 'Dark'],
        variableTypes,
        variables,
      },
    ],
  };
};

// Color Scale Generator (moved from ColorsPanel)
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

export function generateColorScale(baseColor: string): { scale: number; color: string }[] {
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

// Generate Figma-compatible spacing tokens
export const generateFigmaSpacingTokens = (spacing: SpacingToken[]) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  spacing.forEach(space => {
    const varName = `spacing/${space.name}`;
    variableTypes[varName] = 'FLOAT';

    variables.push({
      name: varName,
      type: 'FLOAT',
      valuesByMode: {
        Default: parseFloat(space.value) || 0,
      },
    });
  });

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Spacing',
        modes: ['Default'],
        variableTypes,
        variables,
      },
    ],
  };
};

// Generate Figma-compatible radius tokens
export const generateFigmaRadiusTokens = (radius: RadiusToken[]) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  radius.forEach(rad => {
    const varName = `radius/${rad.name}`;
    variableTypes[varName] = 'FLOAT';

    variables.push({
      name: varName,
      type: 'FLOAT',
      valuesByMode: {
        Default: parseFloat(rad.value) || 0,
      },
    });
  });

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Radius',
        modes: ['Default'],
        variableTypes,
        variables,
      },
    ],
  };
};

// Generate Figma-compatible shadow tokens
export const generateFigmaShadowTokens = (shadows: ShadowToken[]) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  shadows.forEach(shadow => {
    const varName = `shadows/${shadow.name}`;
    variableTypes[varName] = 'STRING';

    variables.push({
      name: varName,
      type: 'STRING',
      valuesByMode: {
        Default: shadow.value,
      },
    });
  });

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Shadows',
        modes: ['Default'],
        variableTypes,
        variables,
      },
    ],
  };
};

// Generate Figma-compatible gradient tokens
export const generateFigmaGradientTokens = (gradients: GradientToken[]) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  gradients.forEach(gradient => {
    const varName = `gradients/${gradient.name}`;
    variableTypes[varName] = 'STRING';

    variables.push({
      name: varName,
      type: 'STRING',
      valuesByMode: {
        Default: gradient.value,
      },
    });
  });

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Gradients',
        modes: ['Default'],
        variableTypes,
        variables,
      },
    ],
  };
};

// Generate Figma-compatible layout/breakpoint tokens
export const generateFigmaLayoutTokens = (breakpoints: BreakpointToken[]) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  breakpoints.forEach(breakpoint => {
    const varName = `layout/${breakpoint.name}`;
    variableTypes[varName] = 'FLOAT';

    variables.push({
      name: varName,
      type: 'FLOAT',
      valuesByMode: {
        Default: parseFloat(breakpoint.value) || 0,
      },
    });
  });

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Layout',
        modes: ['Default'],
        variableTypes,
        variables,
      },
    ],
  };
};

// Generate Figma-compatible typography tokens
export const generateFigmaTypographyTokens = (typography: any) => {
  const variableTypes: Record<string, string> = {};
  const variables: any[] = [];

  // Add font families
  if (typography.fontFamilies) {
    typography.fontFamilies.forEach((font: any) => {
      const varName = `typography/fontFamilies/${font.name}`;
      variableTypes[varName] = 'STRING';
      variables.push({
        name: varName,
        type: 'STRING',
        valuesByMode: {
          Default: font.value,
        },
      });
    });
  }

  // Add font sizes
  if (typography.fontSizes) {
    typography.fontSizes.forEach((size: any) => {
      const varName = `typography/fontSizes/${size.name}`;
      variableTypes[varName] = 'FLOAT';
      variables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(size.value) || 0,
        },
      });
    });
  }

  // Add font weights
  if (typography.fontWeights) {
    typography.fontWeights.forEach((weight: any) => {
      const varName = `typography/fontWeights/${weight.name}`;
      variableTypes[varName] = 'FLOAT';
      variables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(weight.value) || parseInt(weight.value) || 400,
        },
      });
    });
  }

  // Add line heights
  if (typography.lineHeights) {
    typography.lineHeights.forEach((lineHeight: any) => {
      const varName = `typography/lineHeights/${lineHeight.name}`;
      variableTypes[varName] = 'FLOAT';
      variables.push({
        name: varName,
        type: 'FLOAT',
        valuesByMode: {
          Default: parseFloat(lineHeight.value) || 1,
        },
      });
    });
  }

  return {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    collections: [
      {
        name: 'Typography',
        modes: ['Default'],
        variableTypes,
        variables,
      },
    ],
  };
};
