import React from 'react';
import { useDesignSystem, RadiusToken } from '../../context/DesignSystemContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateFigmaRadiusTokens, downloadJSON, copyToClipboard } from '../../utils/figmaTokens';

export function RadiusPanel() {
  const { state, updateRadius } = useDesignSystem();

  const handleRadiusChange = (index: number, field: keyof RadiusToken, value: string) => {
    const updated = [...state.radius];
    updated[index] = { ...updated[index], [field]: value };
    updateRadius(updated);
  };

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h2 className="font-semibold text-[15px]">Border Radius</h2>
          <p className="text-[11px] text-[#999999] mt-0.5">
            {state.radius.length} tokens · Rounded corners
          </p>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-3 space-y-2">
            {state.radius.map((radius, index) => (
              <div
                key={radius.name}
                className="p-3 bg-white border border-[#E5E5E5] rounded-lg hover:border-[#0066FF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] text-[#666666]">Name</Label>
                    <Input
                      value={radius.name}
                      onChange={(e) => handleRadiusChange(index, 'name', e.target.value)}
                      className="h-7 text-[11px] font-medium mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-[#666666]">Value</Label>
                    <Input
                      value={radius.value}
                      onChange={(e) => handleRadiusChange(index, 'value', e.target.value)}
                      className="h-7 text-[11px] font-mono mt-1"
                    />
                  </div>
                  <div
                    className="w-12 h-12 bg-[#0066FF] border-2 border-white shadow-sm"
                    style={{ borderRadius: radius.value }}
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
              Export includes all radius tokens in Figma Variables format
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const figmaTokens = generateFigmaRadiusTokens(state.radius);
                const jsonString = JSON.stringify(figmaTokens, null, 2);
                copyToClipboard(jsonString);
                toast.success('Radius tokens copied to clipboard!');
              }}
              className="h-7 text-[11px]"
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy Figma Tokens
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const figmaTokens = generateFigmaRadiusTokens(state.radius);
                downloadJSON(figmaTokens, 'Radius_Tokens.json');
                toast.success('Radius_Tokens.json downloaded!');
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
            <h3 className="font-semibold text-[13px] mb-1">Border Radius Preview</h3>
            <p className="text-[11px] text-[#666666]">Visual examples of rounded corners</p>
          </div>

          {/* Size Comparison */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
            <h4 className="text-[11px] font-semibold text-[#666666] mb-4 uppercase tracking-wide">
              Scale Comparison
            </h4>
            <div className="flex flex-wrap gap-4">
              {state.radius.map((radius) => (
                <div key={radius.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-24 h-24 bg-gradient-to-br from-[#0066FF] to-[#6366F1] shadow-lg"
                    style={{ borderRadius: radius.value }}
                  />
                  <div className="text-center">
                    <p className="text-[11px] font-medium">{radius.name}</p>
                    <p className="text-[9px] text-[#666666] font-mono">{radius.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component Examples */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">
              Component Examples
            </h4>

            {/* Buttons */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Buttons</p>
              <div className="flex flex-wrap gap-3">
                {state.radius.filter(r => !['none', 'full'].includes(r.name)).map((radius) => (
                  <button
                    key={radius.name}
                    className="px-4 py-2 bg-[#0066FF] text-white text-[13px] font-medium hover:bg-[#0052CC] transition-colors"
                    style={{ borderRadius: radius.value }}
                  >
                    {radius.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Cards</p>
              <div className="grid grid-cols-2 gap-4">
                {state.radius.filter(r => ['sm', 'base', 'md', 'lg', 'xl'].includes(r.name)).map((radius) => (
                  <div
                    key={radius.name}
                    className="border border-[#E5E5E5] p-4 bg-white shadow-sm"
                    style={{ borderRadius: radius.value }}
                  >
                    <h5 className="font-semibold text-[13px] mb-1">Card Title</h5>
                    <p className="text-[11px] text-[#666666]">
                      Border radius: {radius.name} ({radius.value})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Input Fields</p>
              <div className="space-y-3 max-w-md">
                {state.radius.filter(r => ['sm', 'base', 'md', 'lg'].includes(r.name)).map((radius) => (
                  <input
                    key={radius.name}
                    type="text"
                    placeholder={`${radius.name} (${radius.value})`}
                    className="w-full px-3 py-2 border border-[#E5E5E5] text-[13px] outline-none focus:border-[#0066FF] transition-colors"
                    style={{ borderRadius: radius.value }}
                  />
                ))}
              </div>
            </div>

            {/* Badges & Pills */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Badges & Pills</p>
              <div className="flex flex-wrap gap-3">
                <span
                  className="px-3 py-1 bg-[#10B981] text-white text-[11px] font-medium"
                  style={{ borderRadius: state.radius.find(r => r.name === 'sm')?.value }}
                >
                  Small
                </span>
                <span
                  className="px-3 py-1 bg-[#6366F1] text-white text-[11px] font-medium"
                  style={{ borderRadius: state.radius.find(r => r.name === 'base')?.value }}
                >
                  Base
                </span>
                <span
                  className="px-3 py-1 bg-[#F59E0B] text-white text-[11px] font-medium"
                  style={{ borderRadius: state.radius.find(r => r.name === 'md')?.value }}
                >
                  Medium
                </span>
                <span
                  className="px-3 py-1 bg-[#EF4444] text-white text-[11px] font-medium"
                  style={{ borderRadius: state.radius.find(r => r.name === 'full')?.value }}
                >
                  Full (Pill)
                </span>
              </div>
            </div>

            {/* Images & Avatars */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Images & Avatars</p>
              <div className="flex items-center gap-4">
                {['base', 'md', 'lg', 'xl', 'full'].map((name) => {
                  const radius = state.radius.find(r => r.name === name);
                  if (!radius) return null;
                  return (
                    <div key={name} className="text-center">
                      <div
                        className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#EF4444] mb-2"
                        style={{ borderRadius: radius.value }}
                      />
                      <p className="text-[9px] text-[#666666]">{name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mixed Radius Example */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <p className="text-[11px] text-[#666666] mb-4">Product Card Example</p>
              <div
                className="max-w-sm border border-[#E5E5E5] overflow-hidden shadow-md"
                style={{ borderRadius: state.radius.find(r => r.name === 'lg')?.value }}
              >
                <div className="h-48 bg-gradient-to-br from-[#6366F1] to-[#EC4899]" />
                <div className="p-4">
                  <h3 className="font-semibold text-[15px] mb-2">Product Title</h3>
                  <p className="text-[12px] text-[#666666] mb-3">
                    This card uses {state.radius.find(r => r.name === 'lg')?.name} radius for the container
                  </p>
                  <button
                    className="w-full py-2 bg-[#0066FF] text-white text-[13px] font-medium hover:bg-[#0052CC] transition-colors"
                    style={{ borderRadius: state.radius.find(r => r.name === 'md')?.value }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}