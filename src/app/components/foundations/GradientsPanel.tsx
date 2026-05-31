import React, { useState, useRef } from 'react';
import { useDesignSystem, GradientToken } from '../../context/DesignSystemContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Copy, Check, Plus, Trash2, GripVertical, Save, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateFigmaGradientTokens, downloadJSON, copyToClipboard } from '../../utils/figmaTokens';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Separate component for gradient text to avoid style conflicts
function GradientText({ gradient }: { gradient: string }) {
  return (
    <h2
      className="text-[32px] font-bold"
      style={{
        backgroundImage: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      Gradient Text Effect
    </h2>
  );
}

// Draggable color stop item
interface ColorStopItemProps {
  stop: { color: string; position: string };
  stopIndex: number;
  gradientIndex: number;
  colors: any[];
  currentTheme: 'light' | 'dark';
  onStopChange: (gradientIndex: number, stopIndex: number, field: 'color' | 'position', value: string) => void;
  onDeleteStop: (gradientIndex: number, stopIndex: number) => void;
  onMoveStop: (gradientIndex: number, dragIndex: number, hoverIndex: number) => void;
}

const DND_ITEM_TYPE = 'COLOR_STOP';
const DND_GRADIENT_CARD = 'GRADIENT_CARD';

function ColorStopItem({
  stop,
  stopIndex,
  gradientIndex,
  colors,
  currentTheme,
  onStopChange,
  onDeleteStop,
  onMoveStop,
}: ColorStopItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_ITEM_TYPE,
    item: { stopIndex, gradientIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    hover: (item: { stopIndex: number; gradientIndex: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.stopIndex;
      const hoverIndex = stopIndex;
      const dragGradientIndex = item.gradientIndex;

      // Don't replace items from different gradients
      if (dragGradientIndex !== gradientIndex) {
        return;
      }

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      onMoveStop(gradientIndex, dragIndex, hoverIndex);
      item.stopIndex = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Connect drag and drop to the same ref
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''} ${
        isOver ? 'bg-blue-50 rounded' : ''
      }`}
    >
      <div
        className="cursor-grab active:cursor-grabbing text-[#999999] hover:text-[#666666]"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <Select
          value={stop.color}
          onValueChange={(value) => onStopChange(gradientIndex, stopIndex, 'color', value)}
        >
          <SelectTrigger className="h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {colors.map((color) => (
              <SelectItem key={color.name} value={color.name} className="text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-[#E5E5E5]"
                    style={{ backgroundColor: color[currentTheme] }}
                  />
                  {color.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        value={stop.position}
        onChange={(e) => onStopChange(gradientIndex, stopIndex, 'position', e.target.value)}
        className="h-6 text-[10px] w-16"
        placeholder="0%"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDeleteStop(gradientIndex, stopIndex)}
        className="h-6 w-6 p-0 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
        title="Delete stop"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Draggable gradient card component
interface GradientCardProps {
  gradient: GradientToken;
  gradientIndex: number;
  isEdited: boolean;
  colors: any[];
  currentTheme: 'light' | 'dark';
  copiedGradient: string | null;
  onGradientChange: (index: number, updates: Partial<GradientToken>) => void;
  onStopChange: (gradientIndex: number, stopIndex: number, field: 'color' | 'position', value: string) => void;
  onDeleteStop: (gradientIndex: number, stopIndex: number) => void;
  onMoveStop: (gradientIndex: number, dragIndex: number, hoverIndex: number) => void;
  onAddStop: (gradientIndex: number) => void;
  onDeleteGradient: (index: number) => void;
  onSaveGradient: (index: number) => void;
  onResetGradient: (index: number) => void;
  onCopyToClipboard: (text: string, gradientName: string) => void;
  onMoveCard: (dragIndex: number, hoverIndex: number) => void;
}

function GradientCard({
  gradient,
  gradientIndex,
  isEdited,
  colors,
  currentTheme,
  copiedGradient,
  onGradientChange,
  onStopChange,
  onDeleteStop,
  onMoveStop,
  onAddStop,
  onDeleteGradient,
  onSaveGradient,
  onResetGradient,
  onCopyToClipboard,
  onMoveCard,
}: GradientCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DND_GRADIENT_CARD,
    item: { index: gradientIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DND_GRADIENT_CARD,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = gradientIndex;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMoveCard(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const currentGradientValue = currentTheme === 'light' ? gradient.light : gradient.dark;

  // Connect drag and drop refs
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`p-3 bg-white border rounded-lg hover:border-[#0066FF] transition-colors ${
        isEdited ? 'border-[#FFA500]' : 'border-[#E5E5E5]'
      } ${isDragging ? 'opacity-50' : ''} ${isOver ? 'ring-2 ring-[#0066FF] ring-opacity-50' : ''}`}
      style={{ cursor: 'move' }}
    >
      <div className="space-y-3">
        {/* Drag Handle Indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-0.5 text-[#CCCCCC]">
            <div className="w-8 h-0.5 bg-[#E5E5E5] rounded"></div>
          </div>
        </div>

        {/* Unsaved Changes Badge */}
        {isEdited && (
          <div className="flex items-center gap-1.5 bg-[#FFF3CD] border border-[#FFA500] text-[#856404] rounded px-2 py-1 text-[10px]">
            <span className="w-1.5 h-1.5 bg-[#FFA500] rounded-full animate-pulse"></span>
            Unsaved changes
          </div>
        )}
        
        {/* Header with name and delete */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-[10px] text-[#666666]">Name</Label>
            <Input
              value={gradient.name}
              onChange={(e) => onGradientChange(gradientIndex, { name: e.target.value })}
              className="h-7 text-[11px] font-medium mt-1"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDeleteGradient(gradientIndex)}
            className="h-7 w-7 p-0 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] mt-5"
            title="Delete gradient"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Type and Angle */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-[#666666]">Type</Label>
            <Select
              value={gradient.type}
              onValueChange={(value: 'linear' | 'radial' | 'conic') => 
                onGradientChange(gradientIndex, { type: value })
              }
            >
              <SelectTrigger className="h-7 text-[11px] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear" className="text-[11px]">Linear</SelectItem>
                <SelectItem value="radial" className="text-[11px]">Radial</SelectItem>
                <SelectItem value="conic" className="text-[11px]">Conic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {gradient.type === 'linear' && (
            <div>
              <Label className="text-[10px] text-[#666666]">Direction</Label>
              <Select
                value={gradient.angle}
                onValueChange={(value) => onGradientChange(gradientIndex, { angle: value })}
              >
                <SelectTrigger className="h-7 text-[11px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0deg" className="text-[11px]">↑ To Top (0deg)</SelectItem>
                  <SelectItem value="45deg" className="text-[11px]">↗ To Top Right (45deg)</SelectItem>
                  <SelectItem value="90deg" className="text-[11px]">→ To Right (90deg)</SelectItem>
                  <SelectItem value="135deg" className="text-[11px]">↘ To Bottom Right (135deg)</SelectItem>
                  <SelectItem value="180deg" className="text-[11px]">↓ To Bottom (180deg)</SelectItem>
                  <SelectItem value="225deg" className="text-[11px]">↙ To Bottom Left (225deg)</SelectItem>
                  <SelectItem value="270deg" className="text-[11px]">← To Left (270deg)</SelectItem>
                  <SelectItem value="315deg" className="text-[11px]">↖ To Top Left (315deg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Color Stops */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[10px] text-[#666666]">Color Stops</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddStop(gradientIndex)}
              className="h-5 px-1.5 text-[10px]"
            >
              <Plus className="w-3 h-3 mr-0.5" />
              Add Stop
            </Button>
          </div>
          <div className="space-y-2">
            {gradient.stops.map((stop, stopIndex) => (
              <ColorStopItem
                key={stopIndex}
                stop={stop}
                stopIndex={stopIndex}
                gradientIndex={gradientIndex}
                colors={colors}
                currentTheme={currentTheme}
                onStopChange={onStopChange}
                onDeleteStop={onDeleteStop}
                onMoveStop={onMoveStop}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <Label className="text-[10px] text-[#666666] mb-1 block">Preview</Label>
          <div
            className="w-full h-20 rounded-md border border-[#E5E5E5]"
            style={{ background: currentGradientValue }}
          />
        </div>

        {/* CSS Output */}
        <div>
          <Label className="text-[10px] text-[#666666] mb-1 block">CSS ({currentTheme})</Label>
          <div className="relative">
            <div className="bg-[#F9FAFB] rounded p-2 pr-8 text-[9px] font-mono text-[#666666] break-all">
              {currentGradientValue}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopyToClipboard(currentGradientValue, gradient.name)}
              className="absolute top-1 right-1 h-6 w-6 p-0"
              title="Copy CSS"
            >
              {copiedGradient === gradient.name ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Save and Reset Buttons */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onResetGradient(gradientIndex)}
            className="h-6 px-2 text-[11px] text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
            title="Reset changes"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSaveGradient(gradientIndex)}
            className="h-6 px-2 text-[11px] text-[#0066FF] hover:text-[#0044CC] hover:bg-[#E0F7FA]"
            title="Save changes"
            disabled={!isEdited}
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GradientsPanel() {
  const { state, updateGradients } = useDesignSystem();
  const [copiedGradient, setCopiedGradient] = useState<string | null>(null);
  
  // Local draft state for editing
  const [draftGradients, setDraftGradients] = useState<GradientToken[]>(state.gradients);
  const [editedIndices, setEditedIndices] = useState<Set<number>>(new Set());

  // Sync draft state when global state changes (e.g., from other panels)
  React.useEffect(() => {
    setDraftGradients(state.gradients);
    setEditedIndices(new Set());
  }, [state.gradients]);

  // Function to compute gradient CSS from stops
  const computeGradientCSS = (gradient: GradientToken, theme: 'light' | 'dark'): string => {
    const colorStops = gradient.stops.map(stop => {
      const colorToken = state.colors.find(c => c.name === stop.color);
      const colorValue = colorToken ? (theme === 'light' ? colorToken.light : colorToken.dark) : stop.color;
      return `${colorValue} ${stop.position}`;
    }).join(', ');

    if (gradient.type === 'linear') {
      return `linear-gradient(${gradient.angle}, ${colorStops})`;
    } else if (gradient.type === 'radial') {
      return `radial-gradient(circle, ${colorStops})`;
    } else if (gradient.type === 'conic') {
      return `conic-gradient(from ${gradient.angle}, ${colorStops})`;
    }
    return '';
  };

  const markAsEdited = (index: number) => {
    setEditedIndices(prev => new Set(prev).add(index));
  };

  const handleGradientChange = (index: number, updates: Partial<GradientToken>) => {
    const updated = [...draftGradients];
    updated[index] = { ...updated[index], ...updates };
    
    // Recompute light and dark CSS
    updated[index].light = computeGradientCSS(updated[index], 'light');
    updated[index].dark = computeGradientCSS(updated[index], 'dark');
    
    setDraftGradients(updated);
    markAsEdited(index);
  };

  const handleStopChange = (gradientIndex: number, stopIndex: number, field: 'color' | 'position', value: string) => {
    const updated = [...draftGradients];
    const stops = [...updated[gradientIndex].stops];
    stops[stopIndex] = { ...stops[stopIndex], [field]: value };
    updated[gradientIndex] = { ...updated[gradientIndex], stops };
    
    // Recompute light and dark CSS
    updated[gradientIndex].light = computeGradientCSS(updated[gradientIndex], 'light');
    updated[gradientIndex].dark = computeGradientCSS(updated[gradientIndex], 'dark');
    
    setDraftGradients(updated);
    markAsEdited(gradientIndex);
  };

  const saveGradient = (index: number) => {
    const updated = [...state.gradients];
    updated[index] = draftGradients[index];
    updateGradients(updated);
    
    // Remove from edited set
    setEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    
    toast.success(`${draftGradients[index].name} saved`);
  };

  const resetGradient = (index: number) => {
    const updated = [...draftGradients];
    updated[index] = state.gradients[index];
    setDraftGradients(updated);
    
    // Remove from edited set
    setEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    
    toast.info('Changes discarded');
  };

  const addGradient = () => {
    const newGradient: GradientToken = {
      name: `gradient-${state.gradients.length + 1}`,
      type: 'linear',
      angle: '135deg',
      stops: [
        { color: 'primary', position: '0%' },
        { color: 'secondary', position: '100%' },
      ],
      light: '',
      dark: '',
    };
    
    // Compute light and dark CSS
    newGradient.light = computeGradientCSS(newGradient, 'light');
    newGradient.dark = computeGradientCSS(newGradient, 'dark');
    
    updateGradients([...state.gradients, newGradient]);
    toast.success('Gradient added');
  };

  const deleteGradient = (index: number) => {
    const updated = state.gradients.filter((_, i) => i !== index);
    updateGradients(updated);
    toast.success('Gradient deleted');
  };

  const addStop = (gradientIndex: number) => {
    const updated = [...draftGradients];
    const gradient = { ...updated[gradientIndex] };
    
    // Calculate a good position for the new stop
    const existingPositions = gradient.stops.map(s => parseInt(s.position) || 0).sort((a, b) => a - b);
    const lastPosition = existingPositions[existingPositions.length - 1] || 100;
    const newPosition = lastPosition < 100 ? Math.min(lastPosition + 10, 100) : 50;
    
    gradient.stops = [
      ...gradient.stops,
      { color: 'primary', position: `${newPosition}%` }
    ];
    
    // Recompute light and dark CSS
    gradient.light = computeGradientCSS(gradient, 'light');
    gradient.dark = computeGradientCSS(gradient, 'dark');
    
    updated[gradientIndex] = gradient;
    setDraftGradients(updated);
    markAsEdited(gradientIndex);
    toast.success('Color stop added');
  };

  const deleteStop = (gradientIndex: number, stopIndex: number) => {
    const updated = [...draftGradients];
    const gradient = { ...updated[gradientIndex] };
    
    if (gradient.stops.length <= 2) {
      toast.error('Gradient must have at least 2 color stops');
      return;
    }
    
    gradient.stops = gradient.stops.filter((_, i) => i !== stopIndex);
    
    // Recompute light and dark CSS
    gradient.light = computeGradientCSS(gradient, 'light');
    gradient.dark = computeGradientCSS(gradient, 'dark');
    
    updated[gradientIndex] = gradient;
    setDraftGradients(updated);
    markAsEdited(gradientIndex);
  };

  const moveStop = (gradientIndex: number, dragIndex: number, hoverIndex: number) => {
    const updated = [...draftGradients];
    const gradient = { ...updated[gradientIndex] };
    
    const [draggedStop] = gradient.stops.splice(dragIndex, 1);
    gradient.stops.splice(hoverIndex, 0, draggedStop);
    
    // Recompute light and dark CSS
    gradient.light = computeGradientCSS(gradient, 'light');
    gradient.dark = computeGradientCSS(gradient, 'dark');
    
    updated[gradientIndex] = gradient;
    setDraftGradients(updated);
    markAsEdited(gradientIndex);
  };

  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const updated = [...draftGradients];
    const [draggedGradient] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, draggedGradient);
    setDraftGradients(updated);
    markAsEdited(hoverIndex);
  };

  const copyToClipboard = (text: string, gradientName: string) => {
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
      setCopiedGradient(gradientName);
      setTimeout(() => setCopiedGradient(null), 2000);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    } finally {
      textArea.remove();
    }
  };

  const currentGradientValue = (gradient: GradientToken) => {
    return state.currentTheme === 'light' ? gradient.light : gradient.dark;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        {/* Editor Panel */}
        <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
          <div className="p-4 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-[15px]">Gradients</h2>
              <Button
                size="sm"
                onClick={addGradient}
                className="h-6 px-2 text-[11px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-[11px] text-[#999999]">
              {state.gradients.length} tokens · Color gradients
            </p>
          </div>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-3 space-y-3">
              {draftGradients.map((gradient, gradientIndex) => (
                <GradientCard
                  key={gradientIndex}
                  gradient={gradient}
                  gradientIndex={gradientIndex}
                  isEdited={editedIndices.has(gradientIndex)}
                  colors={state.colors}
                  currentTheme={state.currentTheme}
                  copiedGradient={copiedGradient}
                  onGradientChange={handleGradientChange}
                  onStopChange={handleStopChange}
                  onDeleteStop={deleteStop}
                  onMoveStop={moveStop}
                  onAddStop={addStop}
                  onDeleteGradient={deleteGradient}
                  onSaveGradient={saveGradient}
                  onResetGradient={resetGradient}
                  onCopyToClipboard={copyToClipboard}
                  onMoveCard={moveCard}
                />
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
                Export includes all gradient tokens in Figma Variables format
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const figmaTokens = generateFigmaGradientTokens(state.gradients);
                  const jsonString = JSON.stringify(figmaTokens, null, 2);
                  copyToClipboard(jsonString, 'all-gradients');
                  toast.success('Gradient tokens copied to clipboard!');
                }}
                className="h-7 text-[11px]"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Copy Figma Tokens
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const figmaTokens = generateFigmaGradientTokens(state.gradients);
                  downloadJSON(figmaTokens, 'Gradients_Tokens.json');
                  toast.success('Gradients_Tokens.json downloaded!');
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
                Gradient Preview
              </h3>
              <p className={`text-[11px] ${
                state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
              }`}>
                {state.currentTheme === 'light' ? 'Light theme' : 'Dark theme'} · Click to copy CSS
              </p>
            </div>

            {/* Gradient Library */}
            <div className={`rounded-lg border p-6 mb-6 ${
              state.currentTheme === 'light' 
                ? 'bg-white border-[#E5E5E5]' 
                : 'bg-[#2A2A2A] border-[#333333]'
            }`}>
              <h4 className={`text-[11px] font-semibold uppercase tracking-wide mb-4 ${
                state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
              }`}>
                Gradient Library
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {state.gradients.map((gradient, index) => (
                  <div
                    key={index}
                    className="group cursor-pointer"
                    onClick={() => copyToClipboard(currentGradientValue(gradient), gradient.name)}
                  >
                    <div
                      className="w-full h-32 rounded-lg mb-2 relative overflow-hidden border border-[#E5E5E5]"
                      style={{ background: currentGradientValue(gradient) }}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        {copiedGradient === gradient.name ? (
                          <Check className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <Copy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                    <p className={`text-[11px] font-medium ${
                      state.currentTheme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
                    }`}>
                      {gradient.name}
                    </p>
                    <p className={`text-[9px] ${
                      state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                    }`}>
                      {gradient.type}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Examples */}
            <div className="space-y-4">
              <h4 className={`text-[11px] font-semibold uppercase tracking-wide ${
                state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
              }`}>
                Usage Examples
              </h4>

              {/* Hero Sections */}
              <div className={`rounded-lg border p-6 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <p className={`text-[11px] mb-4 ${
                  state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>Hero Sections</p>
                <div className="space-y-4">
                  {state.gradients.slice(0, 2).map((gradient, index) => (
                    <div
                      key={index}
                      className="rounded-xl p-8 text-white min-h-[200px] flex flex-col justify-center"
                      style={{ background: currentGradientValue(gradient) }}
                    >
                      <h2 className="text-[28px] font-bold mb-2">Welcome to Our Platform</h2>
                      <p className="text-[14px] opacity-90 mb-4">
                        Hero section with {gradient.name} gradient background
                      </p>
                      <div>
                        <button className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-[13px] font-medium hover:bg-white/30 transition-colors">
                          Get Started
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className={`rounded-lg border p-6 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <p className={`text-[11px] mb-4 ${
                  state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>Gradient Buttons</p>
                <div className="flex flex-wrap gap-3">
                  {state.gradients.map((gradient, index) => (
                    <button
                      key={index}
                      className="px-6 py-3 text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity"
                      style={{ background: currentGradientValue(gradient) }}
                    >
                      {gradient.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards */}
              <div className={`rounded-lg border p-6 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <p className={`text-[11px] mb-4 ${
                  state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>Gradient Cards</p>
                <div className="grid grid-cols-2 gap-4">
                  {state.gradients.map((gradient, index) => (
                    <div
                      key={index}
                      className="rounded-lg overflow-hidden"
                    >
                      <div
                        className="h-32 p-4 flex items-end"
                        style={{ background: currentGradientValue(gradient) }}
                      >
                        <h5 className="text-white font-semibold text-[14px]">
                          {gradient.name}
                        </h5>
                      </div>
                      <div className="bg-white p-3 border border-t-0 border-[#E5E5E5]">
                        <p className="text-[11px] text-[#666666]">
                          Card with gradient header
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Gradients */}
              <div className={`rounded-lg border p-6 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <p className={`text-[11px] mb-4 ${
                  state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>Text Gradients</p>
                <div className="space-y-3">
                  {state.gradients.map((gradient, index) => (
                    <GradientText key={index} gradient={currentGradientValue(gradient)} />
                  ))}
                </div>
              </div>

              {/* Borders */}
              <div className={`rounded-lg border p-6 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <p className={`text-[11px] mb-4 ${
                  state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>Gradient Borders</p>
                <div className="grid grid-cols-2 gap-4">
                  {state.gradients.map((gradient, index) => (
                    <div
                      key={index}
                      className="p-[2px] rounded-lg"
                      style={{ background: currentGradientValue(gradient) }}
                    >
                      <div className="bg-white rounded-[6px] p-4">
                        <h5 className="font-semibold text-[13px] mb-1">{gradient.name} border</h5>
                        <p className="text-[11px] text-[#666666]">
                          Card with gradient border effect
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Icons & Shapes */}
              <div className={`rounded-lg border p-6 ${
                state.currentTheme === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <p className={`text-[11px] mb-4 ${
                  state.currentTheme === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>Icons & Shapes</p>
                <div className="flex flex-wrap gap-4">
                  {state.gradients.map((gradient, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="w-16 h-16 rounded-full mb-2 flex items-center justify-center text-white text-[24px] font-bold"
                        style={{ background: currentGradientValue(gradient) }}
                      >
                        A
                      </div>
                      <p className="text-[9px] text-[#666666]">{gradient.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}