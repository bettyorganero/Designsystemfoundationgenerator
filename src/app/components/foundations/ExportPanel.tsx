import React, { useState, useRef } from 'react';
import { useDesignSystem } from '../../context/DesignSystemContext';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Copy, Check, Download, FileCode, FileJson, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';

export function ExportPanel() {
  const { state, exportCSS, exportJSON, importJSON } = useDesignSystem();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, tab: string) => {
    // Fallback method for clipboard API
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
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    } finally {
      textArea.remove();
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importJSON(content);

      if (result.success) {
        toast.success('Design system imported successfully!');
      } else {
        toast.error(`Import failed: ${result.error}`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input so the same file can be imported again
    event.target.value = '';
  };

  const cssVariables = exportCSS();
  const jsonTokens = exportJSON();

  // Generate Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
${state.colors.map(c => {
  const lightScale = Array.from({ length: 11 }, (_, i) => {
    const scales = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    return `          ${scales[i]}: 'var(--color-${c.name}-${scales[i]})'`;
  }).join(',\n');
  return `        '${c.name}': {\n${lightScale}\n        }`;
}).join(',\n')},
      },
      fontFamily: {
        sans: [${state.fontFamily.sans.split(',').map(f => `'${f.trim()}'`).join(', ')}],
        serif: [${state.fontFamily.serif.split(',').map(f => `'${f.trim()}'`).join(', ')}],
        mono: [${state.fontFamily.mono.split(',').map(f => `'${f.trim()}'`).join(', ')}],
        display: [${state.fontFamily.display.split(',').map(f => `'${f.trim()}'`).join(', ')}],
      },
      fontWeight: {
${state.fontWeights.map(w => `        '${w.name}': '${w.value}',`).join('\n')}
      },
      fontSize: {
${state.typeScale.map(t => `        '${t.name}': ['${t.size}', { lineHeight: '${t.lineHeight}', letterSpacing: '${t.letterSpacing}' }],`).join('\n')}
      },
      spacing: {
${state.spacing.map(s => `        '${s.name}': '${s.value}',`).join('\n')}
      },
      borderRadius: {
${state.radius.map(r => `        '${r.name}': '${r.value}',`).join('\n')}
      },
      boxShadow: {
${state.shadows.map(s => `        '${s.name}': '${s.value}',`).join('\n')}
      },
      backgroundImage: {
${state.gradients.map(g => `        '${g.name}': 'var(--gradient-${g.name})',`).join('\n')}
      },
    },
  },
}`;

  // Generate SCSS variables
  const scssVariables = `// Colors
${state.colors.map(c => `$color-${c.name}: ${state.currentTheme === 'light' ? c.light : c.dark};`).join('\n')}

// Typography
$font-sans: ${state.fontFamily.sans};
$font-serif: ${state.fontFamily.serif};
$font-mono: ${state.fontFamily.mono};

// Type Scale
${state.typeScale.map(t => `$text-${t.name}: ${t.size};`).join('\n')}

// Spacing
${state.spacing.map(s => `$spacing-${s.name}: ${s.value};`).join('\n')}

// Border Radius
${state.radius.map(r => `$radius-${r.name}: ${r.value};`).join('\n')}

// Shadows
${state.shadows.map(s => `$shadow-${s.name}: ${s.value};`).join('\n')}`;

  return (
    <div className="flex h-full">
      {/* Export Options */}
      <div className="w-[320px] border-r border-[#E5E5E5] bg-white p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-[15px]">Export & Import Tokens</h2>
          <p className="text-[11px] text-[#999999] mt-0.5">
            Export or import your design system
          </p>
        </div>

        {/* Import Section */}
        <div className="mb-4 p-3 bg-[#F0F9FF] rounded-lg border border-[#0EA5E9]">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-[#0EA5E9]" />
            <h3 className="font-semibold text-[13px]">Import Design System</h3>
          </div>
          <p className="text-[10px] text-[#0369A1] mb-3">
            Upload a Figma Variables JSON file to update your entire design system
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={handleImportClick}
            className="w-full h-7 text-[11px] bg-[#0EA5E9] hover:bg-[#0284C7]"
          >
            <Upload className="w-3 h-3 mr-1" />
            Choose JSON File
          </Button>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-[13px] text-[#666666]">Export Formats</h3>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-[#0066FF]" />
              <h3 className="font-semibold text-[13px]">CSS Variables</h3>
            </div>
            <p className="text-[10px] text-[#666666] mb-3">
              Export as CSS custom properties for use in any project
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(cssVariables, 'css')}
                className="flex-1 h-7 text-[11px]"
              >
                {copiedTab === 'css' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => downloadFile(cssVariables, 'design-system.css')}
                className="flex-1 h-7 text-[11px]"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="w-4 h-4 text-[#6366F1]" />
              <h3 className="font-semibold text-[13px]">JSON Tokens</h3>
            </div>
            <p className="text-[10px] text-[#666666] mb-3">
              Export as JSON for Style Dictionary or other tools
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(jsonTokens, 'json')}
                className="flex-1 h-7 text-[11px]"
              >
                {copiedTab === 'json' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => downloadFile(jsonTokens, 'design-tokens.json')}
                className="flex-1 h-7 text-[11px]"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-[#10B981]" />
              <h3 className="font-semibold text-[13px]">Tailwind Config</h3>
            </div>
            <p className="text-[10px] text-[#666666] mb-3">
              Export as Tailwind CSS configuration file
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(tailwindConfig, 'tailwind')}
                className="flex-1 h-7 text-[11px]"
              >
                {copiedTab === 'tailwind' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => downloadFile(tailwindConfig, 'tailwind.config.js')}
                className="flex-1 h-7 text-[11px]"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-[#EC4899]" />
              <h3 className="font-semibold text-[13px]">SCSS Variables</h3>
            </div>
            <p className="text-[10px] text-[#666666] mb-3">
              Export as SCSS/Sass variables
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(scssVariables, 'scss')}
                className="flex-1 h-7 text-[11px]"
              >
                {copiedTab === 'scss' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => downloadFile(scssVariables, '_variables.scss')}
                className="flex-1 h-7 text-[11px]"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
          <p className="text-[10px] text-[#1E40AF] leading-relaxed">
            <strong>Pro Tip:</strong> Export your tokens and integrate them with your development workflow using tools like Style Dictionary, Figma Tokens, or directly in your CSS/JS files.
          </p>
        </div>
      </div>

      {/* Code Preview */}
      <div className="flex-1 bg-[#FAFAFA] overflow-auto">
        <Tabs defaultValue="css" className="h-full flex flex-col">
          <div className="border-b border-[#E5E5E5] bg-white px-4">
            <TabsList className="bg-transparent">
              <TabsTrigger value="css" className="text-[12px]">CSS Variables</TabsTrigger>
              <TabsTrigger value="json" className="text-[12px]">JSON</TabsTrigger>
              <TabsTrigger value="tailwind" className="text-[12px]">Tailwind</TabsTrigger>
              <TabsTrigger value="scss" className="text-[12px]">SCSS</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="css" className="flex-1 m-0 p-4">
            <div className="bg-[#1E1E1E] rounded-lg p-4 h-full overflow-auto">
              <ScrollArea className="h-full overflow-auto">
                <pre className="text-[11px] text-[#D4D4D4] font-mono leading-relaxed">
                  <code>{cssVariables}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="json" className="flex-1 m-0 p-4">
            <div className="bg-[#1E1E1E] rounded-lg p-4 h-full overflow-auto">
              <ScrollArea className="h-full overflow-auto">
                <pre className="text-[11px] text-[#D4D4D4] font-mono leading-relaxed">
                  <code>{jsonTokens}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="tailwind" className="flex-1 m-0 p-4">
            <div className="bg-[#1E1E1E] rounded-lg p-4 h-full overflow-auto">
              <ScrollArea className="h-full">
                <pre className="text-[11px] text-[#D4D4D4] font-mono leading-relaxed">
                  <code>{tailwindConfig}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="scss" className="flex-1 m-0 p-4">
            <div className="bg-[#1E1E1E] rounded-lg p-4 h-full overflow-auto">
              <ScrollArea className="h-full overflow-auto">
                <pre className="text-[11px] text-[#D4D4D4] font-mono leading-relaxed">
                  <code>{scssVariables}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}