import React, { useState, useRef } from 'react';
import { useDesignSystem, ColorToken } from '../../context/DesignSystemContext';
import { Plus, X, AlertCircle, Copy, Check, Trash2, Download, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { generateFigmaColorTokens, generateColorScale, downloadJSON, copyToClipboard as utilCopyToClipboard } from '../../utils/figmaTokens';

// WCAG AA Contrast Checker
function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string) => {
    const rgb = parseInt(color.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Draggable Color Token Component
interface DraggableColorTokenProps {
  color: ColorToken;
  index: number;
  currentTheme: 'light' | 'dark';
  backgroundColor: string;
  moveColor: (dragIndex: number, hoverIndex: number) => void;
  handleColorChange: (index: number, field: keyof ColorToken, value: string) => void;
  handleDeleteColor: (colorName: string) => void;
}

const DraggableColorToken: React.FC<DraggableColorTokenProps> = ({
  color,
  index,
  currentTheme,
  backgroundColor,
  moveColor,
  handleColorChange,
  handleDeleteColor,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'COLOR_TOKEN',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveColor(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'COLOR_TOKEN',
    item: () => {
      return { index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(ref));

  const currentColor = currentTheme === 'light' ? color.light : color.dark;
  const contrastRatio = getContrastRatio(currentColor, backgroundColor);
  const passesAA = contrastRatio >= 4.5;
  const passesAALarge = contrastRatio >= 3;

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`p-3 bg-white border border-[#E5E5E5] rounded-lg hover:border-[#0066FF] transition-colors ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          ref={drag}
          className="cursor-move flex-shrink-0 text-[#999999] hover:text-[#666666] transition-colors pt-1"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={color.name}
              onChange={(e) => handleColorChange(index, 'name', e.target.value)}
              className="h-6 text-[12px] font-medium flex-1"
              placeholder="Token name"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteColor(color.name)}
              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete color token"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px] text-[#666666] uppercase tracking-wide">
                Light
              </Label>
              <div className="flex gap-1 mt-1">
                <input
                  type="color"
                  value={color.light}
                  onChange={(e) => handleColorChange(index, 'light', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-[#E5E5E5]"
                />
                <Input
                  value={color.light}
                  onChange={(e) => handleColorChange(index, 'light', e.target.value)}
                  className="h-6 text-[10px] font-mono flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-[9px] text-[#666666] uppercase tracking-wide">
                Dark
              </Label>
              <div className="flex gap-1 mt-1">
                <input
                  type="color"
                  value={color.dark}
                  onChange={(e) => handleColorChange(index, 'dark', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-[#E5E5E5]"
                />
                <Input
                  value={color.dark}
                  onChange={(e) => handleColorChange(index, 'dark', e.target.value)}
                  className="h-6 text-[10px] font-mono flex-1"
                />
              </div>
            </div>
          </div>

          {color.semantic && (
            <p className="text-[10px] text-[#666666] italic">{color.semantic}</p>
          )}

          {/* Accessibility Check */}
          {color.name.includes('text') && (
            <div className="flex items-center gap-1 pt-1">
              {passesAA ? (
                <div className="flex items-center gap-1 text-[10px] text-[#10B981]">
                  <Check className="w-3 h-3" />
                  WCAG AA ({contrastRatio.toFixed(2)}:1)
                </div>
              ) : passesAALarge ? (
                <div className="flex items-center gap-1 text-[10px] text-[#F59E0B]">
                  <AlertCircle className="w-3 h-3" />
                  AA Large only ({contrastRatio.toFixed(2)}:1)
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-[#EF4444]">
                  <AlertCircle className="w-3 h-3" />
                  Fails WCAG AA ({contrastRatio.toFixed(2)}:1)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function ColorsPanel() {
  const { state, updateColors, addColor, removeColor } = useDesignSystem();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColor, setNewColor] = useState<ColorToken>({
    name: '',
    light: '#000000',
    dark: '#FFFFFF',
    semantic: '',
  });

  const handleColorChange = (index: number, field: keyof ColorToken, value: string) => {
    const updated = [...state.colors];
    updated[index] = { ...updated[index], [field]: value };
    updateColors(updated);
  };

  const handleAddColor = () => {
    if (newColor.name && newColor.light && newColor.dark) {
      addColor(newColor);
      setNewColor({ name: '', light: '#000000', dark: '#FFFFFF', semantic: '' });
      setShowAddColor(false);
      toast.success('Color token added');
    }
  };

  const handleDeleteColor = (colorName: string) => {
    removeColor(colorName);
    toast.success('Color token deleted');
  };

  const moveColor = (dragIndex: number, hoverIndex: number) => {
    const updated = [...state.colors];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    updateColors(updated);
  };

  const copyColorValue = (text: string, colorName: string) => {
    utilCopyToClipboard(text);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
    toast.success('Copied to clipboard');
  };

  const getBackgroundColor = state.colors.find(c => c.name === 'background');
  const backgroundColor = getBackgroundColor
    ? state.currentTheme === 'light'
      ? getBackgroundColor.light
      : getBackgroundColor.dark
    : '#FFFFFF';

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        {/* Editor Panel */}
        <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
        <div className="p-4 border-b border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[15px]">Color Tokens</h2>
              <p className="text-[11px] text-[#999999] mt-0.5">
                {state.colors.length} tokens · {state.currentTheme} theme
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddColor(!showAddColor)}
              className="h-7 px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>

          {/* Add Color Form */}
          {showAddColor && (
            <div className="mt-3 p-3 bg-[#F9FAFB] rounded-lg space-y-2">
              <Input
                placeholder="Token name (e.g., accent)"
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                className="h-7 text-[12px]"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-[#666666]">Light</Label>
                  <div className="flex gap-1 mt-1">
                    <input
                      type="color"
                      value={newColor.light}
                      onChange={(e) => setNewColor({ ...newColor, light: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer"
                    />
                    <Input
                      value={newColor.light}
                      onChange={(e) => setNewColor({ ...newColor, light: e.target.value })}
                      className="h-7 text-[11px] font-mono"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-[#666666]">Dark</Label>
                  <div className="flex gap-1 mt-1">
                    <input
                      type="color"
                      value={newColor.dark}
                      onChange={(e) => setNewColor({ ...newColor, dark: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer"
                    />
                    <Input
                      value={newColor.dark}
                      onChange={(e) => setNewColor({ ...newColor, dark: e.target.value })}
                      className="h-7 text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleAddColor}
                  className="flex-1 h-6 text-[11px]"
                >
                  Add Token
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddColor(false)}
                  className="flex-1 h-6 text-[11px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-3 space-y-2">
            {state.colors.map((color, index) => (
              <DraggableColorToken
                key={color.name}
                color={color}
                index={index}
                currentTheme={state.currentTheme}
                backgroundColor={backgroundColor}
                moveColor={moveColor}
                handleColorChange={handleColorChange}
                handleDeleteColor={handleDeleteColor}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Preview Panel */}
      <div className={`flex-1 overflow-auto ${
        state.currentTheme === 'light' ? 'bg-[#FAFAFA]' : 'bg-[#1A1A1A]'
      }`}>
        {/* Export Actions Bar */}
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
              Click any color to copy · Import to Figma Variables
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const figmaTokens = generateFigmaColorTokens(state.colors);
                const jsonString = JSON.stringify(figmaTokens, null, 2);
                utilCopyToClipboard(jsonString);
                toast.info('Paste in Figma: Right-click Variables panel → Import variables', { duration: 4000 });
              }}
              className="h-7 text-[11px]"
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy Figma Variables
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const figmaTokens = generateFigmaColorTokens(state.colors);
                downloadJSON(figmaTokens, 'Colors_Tokens.json');
                toast.success('Downloaded Figma Variables JSON');
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
            <h3 className={`font-semibold text-[13px] mb-1 ${
              state.currentTheme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
            }`}>
              Color Scale Palettes
            </h3>
            <p className={`text-[11px] ${
              state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
            }`}>
              Generated scale for each token · {state.currentTheme} mode
            </p>
          </div>

          {/* Color Scale Palettes */}
          <div className="space-y-6 mb-8">
            {state.colors.map((color) => {
              const baseColor = state.currentTheme === 'light' ? color.light : color.dark;
              const colorScale = generateColorScale(baseColor);
              
              return (
                <div key={color.name} className={`rounded-lg border p-5 ${
                  state.currentTheme === 'light' 
                    ? 'bg-white border-[#E5E5E5]' 
                    : 'bg-[#2A2A2A] border-[#333333]'
                }`}>
                  <h4 className={`text-[18px] font-semibold mb-4 capitalize ${
                    state.currentTheme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
                  }`}>
                    {color.name}
                  </h4>
                  
                  {/* Color Scale Row */}
                  <div className="flex gap-2 mb-2">
                    {colorScale.map((item) => (
                      <div
                        key={item.scale}
                        className="flex-1 flex flex-col items-center group cursor-pointer"
                        onClick={() => {
                          copyColorValue(item.color, `${color.name}-${item.scale}`);
                        }}
                      >
                        <div
                          className={`w-full aspect-square rounded-lg border mb-2 transition-all group-hover:scale-105 ${ 
                            item.scale === 500 
                              ? 'border-[#0066FF] border-2 ring-2 ring-[#0066FF] ring-opacity-30' 
                              : state.currentTheme === 'light' ? 'border-[#E5E5E5]' : 'border-[#333333]'
                          }`}
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="text-center">
                          <p className={`text-[11px] font-semibold mb-0.5 ${
                            item.scale === 500 ? 'text-[#0066FF]' : state.currentTheme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
                          }`}>
                            {item.scale}
                            {item.scale === 500 && (
                              <span className="ml-1 text-[12px] font-normal">★</span>
                            )}
                          </p>
                          <p className={`text-[9px] font-mono ${
                            state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                          }`}>
                            {item.color}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-[10px] text-[#0066FF] mt-3">
                    Base color marked with ★ at scale 500
                  </p>
                </div>
              );
            })}
          </div>

          {/* UI Examples */}
          <div className="space-y-4">
            <h3 className={`font-semibold text-[13px] ${
              state.currentTheme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
            }`}>
              Component Examples
            </h3>

            {/* Button Examples */}
            <div className={`rounded-lg border p-4 ${
              state.currentTheme === 'light' 
                ? 'bg-white border-[#E5E5E5]' 
                : 'bg-[#2A2A2A] border-[#333333]'
            }`}>
              <p className={`text-[11px] mb-3 ${
                state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
              }`}>
                Buttons
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 rounded-md text-[13px] font-medium"
                  style={{
                    backgroundColor: state.colors.find(c => c.name === 'primary')?.[state.currentTheme],
                    color: '#FFFFFF',
                  }}
                >
                  Primary
                </button>
                <button
                  className="px-4 py-2 rounded-md text-[13px] font-medium"
                  style={{
                    backgroundColor: state.colors.find(c => c.name === 'secondary')?.[state.currentTheme],
                    color: '#FFFFFF',
                  }}
                >
                  Secondary
                </button>
                <button
                  className="px-4 py-2 rounded-md text-[13px] font-medium"
                  style={{
                    backgroundColor: state.colors.find(c => c.name === 'success')?.[state.currentTheme],
                    color: '#FFFFFF',
                  }}
                >
                  Success
                </button>
                <button
                  className="px-4 py-2 rounded-md text-[13px] font-medium"
                  style={{
                    backgroundColor: state.colors.find(c => c.name === 'error')?.[state.currentTheme],
                    color: '#FFFFFF',
                  }}
                >
                  Error
                </button>
              </div>
            </div>

            {/* Card Example */}
            <div
              className={`rounded-lg border p-4 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}
              style={{
                backgroundColor: state.colors.find(c => c.name === 'surface')?.[state.currentTheme],
                borderColor: state.colors.find(c => c.name === 'border')?.[state.currentTheme],
              }}
            >
              <h4
                className="font-semibold text-[14px] mb-2"
                style={{ color: state.colors.find(c => c.name === 'text-primary')?.[state.currentTheme] }}
              >
                Card Component
              </h4>
              <p
                className="text-[12px]"
                style={{ color: state.colors.find(c => c.name === 'text-secondary')?.[state.currentTheme] }}
              >
                This is an example card showing how your color tokens work together in a real
                component. The surface, border, and text colors all come from your design system.
              </p>
            </div>

            {/* Alert Examples */}
            <div className="grid grid-cols-2 gap-3">
              {['success', 'warning', 'error'].map((type) => {
                const color = state.colors.find(c => c.name === type);
                if (!color) return null;
                return (
                  <div
                    key={type}
                    className="p-3 rounded-lg border-l-4"
                    style={{
                      backgroundColor: `${color[state.currentTheme]}15`,
                      borderColor: color[state.currentTheme],
                    }}
                  >
                    <p className="text-[11px] font-medium capitalize" style={{ color: color[state.currentTheme] }}>
                      {type} Alert
                    </p>
                    <p className={`text-[10px] mt-1 ${
                      state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                    }`}>
                      Example message
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
    </DndProvider>
  );
}