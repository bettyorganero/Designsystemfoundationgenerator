import React from 'react';
import { useDesignSystem, BreakpointToken } from '../../context/DesignSystemContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateFigmaLayoutTokens, downloadJSON, copyToClipboard } from '../../utils/figmaTokens';

export function LayoutPanel() {
  const { state, updateBreakpoints, updateGridSettings } = useDesignSystem();

  const handleBreakpointChange = (index: number, field: keyof BreakpointToken, value: string | number) => {
    const updated = [...state.breakpoints];
    updated[index] = { ...updated[index], [field]: value };
    // Keep pixels in sync with value
    if (field === 'value') {
      const pxMatch = (value as string).match(/^(\d+)px$/);
      if (pxMatch) {
        updated[index].pixels = parseInt(pxMatch[1]);
      }
    }
    updateBreakpoints(updated);
  };

  // Get device-specific settings
  const getDeviceSettings = () => {
    switch (state.previewMode) {
      case 'mobile':
        return {
          maxWidth: '375px',
          columns: 4,
          label: 'Mobile Layout',
          description: 'Optimized for mobile devices (< 640px)',
        };
      case 'tablet':
        return {
          maxWidth: '768px',
          columns: 8,
          label: 'Tablet Layout',
          description: 'Optimized for tablet devices (640px - 1024px)',
        };
      case 'desktop':
      default:
        return {
          maxWidth: state.maxWidth,
          columns: state.gridColumns,
          label: 'Desktop Layout',
          description: 'Optimized for desktop devices (> 1024px)',
        };
    }
  };

  const deviceSettings = getDeviceSettings();

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h2 className="font-semibold text-[15px]">Layout & Grid</h2>
          <p className="text-[11px] text-[#999999] mt-0.5">
            Breakpoints, grid, and container settings
          </p>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Grid Settings */}
            <div>
              <Label className="text-[11px] font-semibold mb-3 block">Grid System</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-[#666666]">Columns</Label>
                  <Input
                    value={state.gridColumns}
                    onChange={(e) => updateGridSettings({ columns: parseInt(e.target.value) || 12 })}
                    className="h-7 text-[11px] mt-1"
                    type="number"
                    min="1"
                    max="24"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#666666]">Gutter</Label>
                  <Input
                    value={state.gridGutter}
                    onChange={(e) => updateGridSettings({ gutter: e.target.value })}
                    className="h-7 text-[11px] font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#666666]">Max Width</Label>
                  <Input
                    value={state.maxWidth}
                    onChange={(e) => updateGridSettings({ maxWidth: e.target.value })}
                    className="h-7 text-[11px] font-mono mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Breakpoints */}
            <div>
              <Label className="text-[11px] font-semibold mb-3 block">Breakpoints</Label>
              <div className="space-y-2">
                {state.breakpoints.map((breakpoint, index) => (
                  <div
                    key={breakpoint.name}
                    className="p-3 bg-[#F9FAFB] rounded-lg"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[9px] text-[#666666]">Name</Label>
                        <Input
                          value={breakpoint.name}
                          onChange={(e) => handleBreakpointChange(index, 'name', e.target.value)}
                          className="h-6 text-[10px] font-medium mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-[#666666]">Value</Label>
                        <Input
                          value={breakpoint.value}
                          onChange={(e) => handleBreakpointChange(index, 'value', e.target.value)}
                          className="h-6 text-[10px] font-mono mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-[#666666]">Pixels</Label>
                        <Input
                          value={breakpoint.pixels}
                          onChange={(e) => handleBreakpointChange(index, 'pixels', parseInt(e.target.value) || 0)}
                          className="h-6 text-[10px] mt-1"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              Preview · {deviceSettings.label}
            </h3>
            <p className={`text-[10px] mt-0.5 ${
              state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
            }`}>
              Export includes all layout & breakpoint tokens in Figma Variables format
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const figmaTokens = generateFigmaLayoutTokens(state.breakpoints);
                const jsonString = JSON.stringify(figmaTokens, null, 2);
                copyToClipboard(jsonString);
                toast.success('Layout tokens copied to clipboard!');
              }}
              className="h-7 text-[11px]"
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy Figma Tokens
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const figmaTokens = generateFigmaLayoutTokens(state.breakpoints);
                downloadJSON(figmaTokens, 'Layout_Tokens.json');
                toast.success('Layout_Tokens.json downloaded!');
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
            <h3 className="font-semibold text-[13px] mb-1">{deviceSettings.label}</h3>
            <p className="text-[11px] text-[#666666]">{deviceSettings.description}</p>
          </div>

          {/* Device-Specific Preview Container */}
          <div className="mx-auto" style={{ maxWidth: deviceSettings.maxWidth }}>
            {/* Breakpoint Visualization */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
              <h4 className="text-[11px] font-semibold text-[#666666] mb-4 uppercase tracking-wide">
                Breakpoint Scale
              </h4>
              <div className="space-y-4">
                {state.breakpoints.map((breakpoint) => (
                  <div key={breakpoint.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium">{breakpoint.name}</span>
                      <span className="text-[10px] text-[#666666] font-mono">
                        {breakpoint.pixels}px ({breakpoint.value})
                      </span>
                    </div>
                    <div className="relative h-6 bg-[#F0F0F0] rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0066FF] to-[#6366F1] rounded"
                        style={{
                          width: `${Math.min((breakpoint.pixels / 1536) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid System */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
              <h4 className="text-[11px] font-semibold text-[#666666] mb-4 uppercase tracking-wide">
                {deviceSettings.columns}-Column Grid System
              </h4>
              <div
                className="grid bg-[#F9FAFB] p-4 rounded-lg"
                style={{
                  gridTemplateColumns: `repeat(${deviceSettings.columns}, 1fr)`,
                  gap: state.gridGutter,
                }}
              >
                {Array.from({ length: deviceSettings.columns }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#0066FF]/20 border border-[#0066FF]/40 rounded h-16 flex items-center justify-center text-[10px] text-[#0066FF] font-medium"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#666666] font-mono mt-3">
                gap: {state.gridGutter}
              </p>
            </div>

            {/* Container Example */}
            {state.previewMode === 'desktop' && (
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
                <h4 className="text-[11px] font-semibold text-[#666666] mb-4 uppercase tracking-wide">
                  Container Max Width
                </h4>
                <div className="bg-[#F9FAFB] p-4 rounded-lg flex justify-center">
                  <div
                    className="bg-white border-2 border-dashed border-[#0066FF] rounded-lg p-6 w-full"
                    style={{ maxWidth: state.maxWidth }}
                  >
                    <p className="text-[12px] text-center text-[#666666]">
                      Container with max-width: {state.maxWidth}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Layout Examples */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">
                Layout Examples
              </h4>

              {/* Mobile Layout */}
              {state.previewMode === 'mobile' && (
                <>
                  {/* Single Column Layout */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Single Column Layout</p>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: '1fr', gap: state.gridGutter }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#F0F6FF] border border-[#0066FF] rounded p-4 text-[11px]">
                          Item {i}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stacked Cards */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Card Stack</p>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
                          <div className="h-32 bg-gradient-to-br from-[#0066FF] to-[#6366F1]" />
                          <div className="p-4">
                            <p className="text-[13px] font-medium mb-1">Card {i}</p>
                            <p className="text-[11px] text-[#666666]">Full-width mobile card</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Mobile Navigation</p>
                    <div className="space-y-2">
                      {['Home', 'Products', 'About', 'Contact'].map((item) => (
                        <div key={item} className="bg-[#F9FAFB] border border-[#E5E5E5] rounded p-3">
                          <p className="text-[12px]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tablet Layout */}
              {state.previewMode === 'tablet' && (
                <>
                  {/* Two Column Layout */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Two Column Layout</p>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: state.gridGutter }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#F0F6FF] border border-[#0066FF] rounded p-4 text-[11px]">
                          Column {i}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Grid (2 columns) */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Card Grid</p>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: state.gridGutter }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
                          <div className="h-24 bg-gradient-to-br from-[#0066FF] to-[#6366F1]" />
                          <div className="p-3">
                            <p className="text-[11px] font-medium">Card {i}</p>
                            <p className="text-[9px] text-[#666666]">2-column grid</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Layout */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Sidebar Layout</p>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: '200px 1fr',
                        gap: state.gridGutter,
                      }}
                    >
                      <div className="bg-[#F9FAFB] border border-[#E5E5E5] rounded p-4 h-48">
                        <p className="text-[11px] font-medium mb-2">Sidebar</p>
                        <p className="text-[10px] text-[#666666]">200px wide</p>
                      </div>
                      <div className="bg-[#F9FAFB] border border-[#E5E5E5] rounded p-4 h-48">
                        <p className="text-[11px] font-medium mb-2">Main Content</p>
                        <p className="text-[10px] text-[#666666]">Flexible width</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Desktop Layout */}
              {state.previewMode === 'desktop' && (
                <>
                  {/* Four Column Layout */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Four Column Layout</p>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: state.gridGutter }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#F0F6FF] border border-[#0066FF] rounded p-4 text-[11px]">
                          Column {i}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Layout */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Sidebar Layout</p>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: '250px 1fr',
                        gap: state.gridGutter,
                      }}
                    >
                      <div className="bg-[#F9FAFB] border border-[#E5E5E5] rounded p-4 h-48">
                        <p className="text-[11px] font-medium mb-2">Sidebar</p>
                        <p className="text-[10px] text-[#666666]">250px wide</p>
                      </div>
                      <div className="bg-[#F9FAFB] border border-[#E5E5E5] rounded p-4 h-48">
                        <p className="text-[11px] font-medium mb-2">Main Content</p>
                        <p className="text-[10px] text-[#666666]">Flexible width</p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Grid */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Dashboard Layout</p>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gap: state.gridGutter,
                      }}
                    >
                      <div className="col-span-12 bg-[#F0F6FF] border border-[#0066FF] rounded p-4">
                        <p className="text-[11px]">Header (12 columns)</p>
                      </div>
                      <div className="col-span-3 bg-[#F0F6FF] border border-[#0066FF] rounded p-4">
                        <p className="text-[11px]">Sidebar (3 columns)</p>
                      </div>
                      <div className="col-span-6 bg-[#F0F6FF] border border-[#0066FF] rounded p-4">
                        <p className="text-[11px]">Main (6 columns)</p>
                      </div>
                      <div className="col-span-3 bg-[#F0F6FF] border border-[#0066FF] rounded p-4">
                        <p className="text-[11px]">Aside (3 columns)</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Grid */}
                  <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                    <p className="text-[11px] text-[#666666] mb-4">Card Grid</p>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: state.gridGutter,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
                          <div className="h-24 bg-gradient-to-br from-[#0066FF] to-[#6366F1]" />
                          <div className="p-3">
                            <p className="text-[11px] font-medium">Card {i}</p>
                            <p className="text-[9px] text-[#666666]">Auto-fit layout</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}