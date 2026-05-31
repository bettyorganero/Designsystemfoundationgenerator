import React from 'react';
import { useDesignSystem, SpacingToken } from '../../context/DesignSystemContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateFigmaSpacingTokens, downloadJSON, copyToClipboard } from '../../utils/figmaTokens';

export function SpacingPanel() {
  const { state, updateSpacing } = useDesignSystem();

  const handleSpacingChange = (index: number, field: keyof SpacingToken, value: string | number) => {
    const updated = [...state.spacing];
    updated[index] = { ...updated[index], [field]: value };
    // Keep pixels in sync with value
    if (field === 'value') {
      const remMatch = (value as string).match(/^([\d.]+)rem$/);
      if (remMatch) {
        updated[index].pixels = parseFloat(remMatch[1]) * 16;
      }
    }
    updateSpacing(updated);
  };

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h2 className="font-semibold text-[15px]">Spacing Scale</h2>
          <p className="text-[11px] text-[#999999] mt-0.5">
            {state.spacing.length} tokens · Base 16px (1rem)
          </p>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-3 space-y-2">
            {state.spacing.map((space, index) => (
              <div
                key={space.name}
                className="p-3 bg-white border border-[#E5E5E5] rounded-lg hover:border-[#0066FF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12">
                    <Label className="text-[10px] text-[#666666]">Name</Label>
                    <Input
                      value={space.name}
                      onChange={(e) => handleSpacingChange(index, 'name', e.target.value)}
                      className="h-7 text-[11px] font-medium mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-[#666666]">Value</Label>
                    <Input
                      value={space.value}
                      onChange={(e) => handleSpacingChange(index, 'value', e.target.value)}
                      className="h-7 text-[11px] font-mono mt-1"
                    />
                  </div>
                  <div className="w-16">
                    <Label className="text-[10px] text-[#666666]">Pixels</Label>
                    <Input
                      value={space.pixels}
                      onChange={(e) => handleSpacingChange(index, 'pixels', parseInt(e.target.value) || 0)}
                      className="h-7 text-[11px] mt-1"
                      type="number"
                    />
                  </div>
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
              Export includes all spacing tokens in Figma Variables format
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const figmaTokens = generateFigmaSpacingTokens(state.spacing);
                const jsonString = JSON.stringify(figmaTokens, null, 2);
                copyToClipboard(jsonString);
                toast.success('Spacing tokens copied to clipboard!');
              }}
              className="h-7 text-[11px]"
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy Figma Tokens
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const figmaTokens = generateFigmaSpacingTokens(state.spacing);
                downloadJSON(figmaTokens, 'Spacing_Tokens.json');
                toast.success('Spacing_Tokens.json downloaded!');
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
            <h3 className="font-semibold text-[13px] mb-1">
              Spacing Scale Preview
              {state.previewMode === 'mobile' && ' - Mobile'}
              {state.previewMode === 'tablet' && ' - Tablet'}
              {state.previewMode === 'desktop' && ' - Desktop'}
            </h3>
            <p className="text-[11px] text-[#666666]">
              {state.previewMode === 'mobile' && 'Compact spacing for mobile screens'}
              {state.previewMode === 'tablet' && 'Optimized spacing for tablet screens'}
              {state.previewMode === 'desktop' && 'Visual representation of spacing tokens'}
            </p>
          </div>

          {/* Device-Specific Preview Container */}
          <div 
            className="mx-auto"
            style={{ 
              maxWidth: state.previewMode === 'mobile' ? '375px' : state.previewMode === 'tablet' ? '768px' : '100%' 
            }}
          >
            {/* Spacing Visualization */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
              <h4 className="text-[11px] font-semibold text-[#666666] mb-4 uppercase tracking-wide">
                Scale Visualization
              </h4>
              <div className="space-y-3">
                {/* Show subset of spacing for mobile/tablet */}
                {(state.previewMode === 'mobile' ? state.spacing.slice(0, 10) : 
                  state.previewMode === 'tablet' ? state.spacing.slice(0, 11) : 
                  state.spacing).map((space) => (
                  <div key={space.name} className="flex items-center gap-4">
                    <div className="w-16 text-right">
                      <span className="text-[11px] font-mono font-medium">{space.name}</span>
                    </div>
                    <div
                      className="h-8 bg-[#0066FF] rounded"
                      style={{ width: Math.min(space.pixels, state.previewMode === 'mobile' ? 200 : 500) }}
                    />
                    <div className="flex gap-3 text-[10px] text-[#666666] font-mono">
                      <span>{space.value}</span>
                      <span>·</span>
                      <span>{space.pixels}px</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Examples */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">
                Practical Examples
              </h4>

              {/* Padding Example */}
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                <p className="text-[11px] text-[#666666] mb-4">Padding Examples</p>
                <div className={state.previewMode === 'mobile' ? 'space-y-3' : 'space-y-3'}>
                  {(state.previewMode === 'mobile' ? [2, 3, 4, 5] : [4, 6, 8, 12]).map((index) => {
                    const space = state.spacing[index];
                    return (
                      <div
                        key={space.name}
                        className="border border-[#0066FF] bg-[#F0F6FF] rounded inline-block"
                      >
                        <div
                          className="bg-white border-2 border-dashed border-[#0066FF]"
                          style={{ padding: space.value }}
                        >
                          <span className="text-[11px]">Padding: {space.name} ({space.value})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gap Example */}
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                <p className="text-[11px] text-[#666666] mb-4">Gap Between Elements</p>
                <div className="space-y-4">
                  {(state.previewMode === 'mobile' ? [1, 2, 3, 4] : [2, 4, 6, 8]).map((index) => {
                    const space = state.spacing[index];
                    return (
                      <div key={space.name}>
                        <p className="text-[10px] text-[#666666] mb-2 font-mono">
                          gap: {space.name} ({space.value})
                        </p>
                        <div
                          className="flex"
                          style={{ gap: space.value }}
                        >
                          {[1, 2, 3, state.previewMode === 'desktop' ? 4 : null].filter(Boolean).map((i) => (
                            <div
                              key={i}
                              className="w-12 h-12 bg-[#0066FF] rounded flex items-center justify-center text-white text-[10px]"
                            >
                              {i}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Margin Example */}
              {state.previewMode !== 'mobile' && (
                <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                  <p className="text-[11px] text-[#666666] mb-4">Vertical Rhythm (Margin)</p>
                  <div className="bg-[#F9FAFB] p-4 rounded">
                    <h3 className="text-[16px] font-semibold">Heading</h3>
                    <p
                      className="text-[13px] text-[#666666]"
                      style={{ marginTop: state.spacing[2].value }}
                    >
                      This paragraph has margin-top of {state.spacing[2].name} ({state.spacing[2].value})
                    </p>
                    <p
                      className="text-[13px] text-[#666666]"
                      style={{ marginTop: state.spacing[4].value }}
                    >
                      This paragraph has margin-top of {state.spacing[4].name} ({state.spacing[4].value})
                    </p>
                    <h4
                      className="text-[14px] font-semibold"
                      style={{ marginTop: state.spacing[6].value }}
                    >
                      Subheading (margin-top: {state.spacing[6].name})
                    </h4>
                    <p
                      className="text-[13px] text-[#666666]"
                      style={{ marginTop: state.spacing[2].value }}
                    >
                      Another paragraph with {state.spacing[2].name} spacing.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid Layout Example */}
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                <p className="text-[11px] text-[#666666] mb-4">Grid Layout with Spacing</p>
                <div
                  className="grid"
                  style={{ 
                    gridTemplateColumns: state.previewMode === 'mobile' ? 'repeat(2, 1fr)' : 
                                        state.previewMode === 'tablet' ? 'repeat(3, 1fr)' : 
                                        'repeat(4, 1fr)',
                    gap: state.spacing[4].value 
                  }}
                >
                  {Array.from({ length: state.previewMode === 'mobile' ? 4 : state.previewMode === 'tablet' ? 6 : 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gradient-to-br from-[#0066FF] to-[#6366F1] rounded-lg flex items-center justify-center text-white text-[11px]"
                    >
                      Item {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#666666] font-mono mt-3">
                  gap: {state.spacing[4].name} ({state.spacing[4].value})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}