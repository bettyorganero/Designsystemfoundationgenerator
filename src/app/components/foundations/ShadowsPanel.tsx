import React from 'react';
import { useDesignSystem, ShadowToken } from '../../context/DesignSystemContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateFigmaShadowTokens, downloadJSON, copyToClipboard } from '../../utils/figmaTokens';

export function ShadowsPanel() {
  const { state, updateShadows } = useDesignSystem();

  const handleShadowChange = (index: number, field: keyof ShadowToken, value: string) => {
    const updated = [...state.shadows];
    updated[index] = { ...updated[index], [field]: value };
    updateShadows(updated);
  };

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h2 className="font-semibold text-[15px]">Elevation & Shadows</h2>
          <p className="text-[11px] text-[#999999] mt-0.5">
            {state.shadows.length} tokens · Depth & elevation
          </p>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-3 space-y-2">
            {state.shadows.map((shadow, index) => (
              <div
                key={shadow.name}
                className="p-3 bg-white border border-[#E5E5E5] rounded-lg hover:border-[#0066FF] transition-colors"
              >
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] text-[#666666]">Name</Label>
                    <Input
                      value={shadow.name}
                      onChange={(e) => handleShadowChange(index, 'name', e.target.value)}
                      className="h-7 text-[11px] font-medium mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-[#666666]">CSS Value</Label>
                    <Textarea
                      value={shadow.value}
                      onChange={(e) => handleShadowChange(index, 'value', e.target.value)}
                      className="text-[10px] font-mono mt-1 min-h-[60px]"
                    />
                  </div>
                  {/* Preview */}
                  <div
                    className="w-full h-16 bg-white rounded-md"
                    style={{ boxShadow: shadow.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Preview Panel */}
      <div className={`flex-1 overflow-auto ${
        state.currentTheme === 'light' ? 'bg-[#FAFAFA]' : 'bg-[#1A1A1A]'
      }`}>
        {/* Export Buttons */}
        <div className={`sticky top-0 z-10 px-6 py-3 border-b flex items-center justify-between ${
          state.currentTheme === 'light' 
            ? 'bg-white border-[#E5E5E5]' 
            : 'bg-[#2A2A2A] border-[#333333]'
        }`}>
          <div>
            <h3 className={`font-semibold text-[13px] ${
              state.currentTheme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
            }`}>
              Preview · {state.currentTheme} mode
            </h3>
            <p className={`text-[10px] mt-0.5 ${
              state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
            }`}>
              Export includes all shadow tokens in Figma Variables format
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const figmaTokens = generateFigmaShadowTokens(state.shadows);
                const jsonString = JSON.stringify(figmaTokens, null, 2);
                copyToClipboard(jsonString);
                toast.success('Shadow tokens copied to clipboard!');
              }}
              className="h-7 text-[11px]"
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy Figma Tokens
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const figmaTokens = generateFigmaShadowTokens(state.shadows);
                downloadJSON(figmaTokens, 'Shadows_Tokens.json');
                toast.success('Shadows_Tokens.json downloaded!');
              }}
              className="h-7 text-[11px]"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Download
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-[13px] mb-1">Shadow Scale Preview</h3>
            <p className="text-[11px] text-[#666666]">Elevation system from subtle to prominent</p>
          </div>

          {/* Shadow Scale Comparison */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
            <h4 className="text-[11px] font-semibold text-[#666666] mb-6 uppercase tracking-wide">
              Elevation Scale
            </h4>
            <div className="grid grid-cols-3 gap-6">
              {state.shadows.map((shadow) => (
                <div key={shadow.name} className="text-center">
                  <div
                    className="w-full h-32 bg-white rounded-lg mb-3 flex items-center justify-center"
                    style={{ boxShadow: shadow.value }}
                  >
                    <span className="text-[13px] font-medium text-[#666666]">{shadow.name}</span>
                  </div>
                  <p className="text-[9px] text-[#666666] font-mono break-all px-2">
                    {shadow.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Examples */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">
              Component Examples
            </h4>

            {/* Cards with Different Elevations */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Card Elevations</p>
              <div className="grid grid-cols-2 gap-4">
                {['sm', 'base', 'md', 'lg'].map((name) => {
                  const shadow = state.shadows.find(s => s.name === name);
                  if (!shadow) return null;
                  return (
                    <div
                      key={name}
                      className="bg-white rounded-lg p-4"
                      style={{ boxShadow: shadow.value }}
                    >
                      <h5 className="font-semibold text-[13px] mb-1">Card with {name} shadow</h5>
                      <p className="text-[11px] text-[#666666]">
                        This card demonstrates the {name} elevation level
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Button States */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Button States with Shadows</p>
              <div className="flex flex-wrap gap-4">
                <button
                  className="px-6 py-3 bg-[#0066FF] text-white rounded-lg text-[13px] font-medium transition-shadow hover:shadow-md"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'sm')?.value }}
                >
                  Default (sm)
                </button>
                <button
                  className="px-6 py-3 bg-[#6366F1] text-white rounded-lg text-[13px] font-medium"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'md')?.value }}
                >
                  Elevated (md)
                </button>
                <button
                  className="px-6 py-3 bg-[#10B981] text-white rounded-lg text-[13px] font-medium"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'lg')?.value }}
                >
                  Prominent (lg)
                </button>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Dropdown Menu</p>
              <div className="inline-block">
                <button className="px-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-[13px] font-medium">
                  Open Menu
                </button>
                <div
                  className="mt-2 bg-white rounded-lg border border-[#E5E5E5] overflow-hidden"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'lg')?.value }}
                >
                  <div className="py-1">
                    <div className="px-4 py-2 text-[13px] hover:bg-[#F9FAFB] cursor-pointer">
                      Menu Item 1
                    </div>
                    <div className="px-4 py-2 text-[13px] hover:bg-[#F9FAFB] cursor-pointer">
                      Menu Item 2
                    </div>
                    <div className="px-4 py-2 text-[13px] hover:bg-[#F9FAFB] cursor-pointer">
                      Menu Item 3
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Example */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Modal Dialog</p>
              <div className="bg-[#00000010] p-8 rounded-lg flex items-center justify-center min-h-[300px]">
                <div
                  className="bg-white rounded-xl p-6 max-w-md w-full"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'xl')?.value }}
                >
                  <h3 className="font-semibold text-[16px] mb-2">Modal Title</h3>
                  <p className="text-[13px] text-[#666666] mb-4">
                    This modal uses the 'xl' shadow for maximum prominence and depth, creating a clear separation from the background.
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-[#0066FF] text-white rounded-lg text-[13px] font-medium">
                      Confirm
                    </button>
                    <button className="flex-1 px-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-[13px] font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Cards */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Product Cards (Hover Effect)</p>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg overflow-hidden border border-[#E5E5E5] transition-shadow hover:shadow-lg cursor-pointer"
                    style={{ boxShadow: state.shadows.find(s => s.name === 'sm')?.value }}
                  >
                    <div className="h-32 bg-gradient-to-br from-[#0066FF] to-[#6366F1]" />
                    <div className="p-3">
                      <h5 className="font-semibold text-[13px] mb-1">Product {i}</h5>
                      <p className="text-[11px] text-[#666666]">$99.00</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Action Button */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Floating Action Button</p>
              <div className="relative h-32 bg-[#F9FAFB] rounded-lg">
                <button
                  className="absolute bottom-4 right-4 w-14 h-14 bg-[#0066FF] text-white rounded-full flex items-center justify-center text-[24px] hover:bg-[#0052CC] transition-all"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'lg')?.value }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Layered Cards */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Layered Content (Z-Index)</p>
              <div className="relative h-64">
                <div
                  className="absolute top-0 left-0 w-64 h-48 bg-white rounded-lg p-4"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'sm')?.value, zIndex: 1 }}
                >
                  <p className="text-[12px] font-medium">Layer 1 (sm shadow)</p>
                </div>
                <div
                  className="absolute top-8 left-8 w-64 h-48 bg-white rounded-lg p-4"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'md')?.value, zIndex: 2 }}
                >
                  <p className="text-[12px] font-medium">Layer 2 (md shadow)</p>
                </div>
                <div
                  className="absolute top-16 left-16 w-64 h-48 bg-white rounded-lg p-4"
                  style={{ boxShadow: state.shadows.find(s => s.name === 'lg')?.value, zIndex: 3 }}
                >
                  <p className="text-[12px] font-medium">Layer 3 (lg shadow)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}