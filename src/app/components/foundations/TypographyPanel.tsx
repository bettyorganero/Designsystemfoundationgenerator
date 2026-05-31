import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDesignSystem, TypeScale } from '../../context/DesignSystemContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Plus, Trash2, Save, RotateCcw, Download, GripVertical, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { generateFigmaTypographyTokens, downloadJSON, copyToClipboard } from '../../utils/figmaTokens';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Common system and web fonts
const AVAILABLE_FONTS = {
  'Sans Serif': [
    { label: 'Inter', value: 'Inter, system-ui, -apple-system, sans-serif' },
    { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'Lato', value: 'Lato, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Poppins', value: 'Poppins, sans-serif' },
  ],
  'Serif': [
    { label: 'Georgia', value: 'Georgia, Cambria, "Times New Roman", serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Garamond', value: 'Garamond, "Adobe Garamond Pro", serif' },
    { label: 'Merriweather', value: 'Merriweather, serif' },
    { label: 'Playfair Display', value: '"Playfair Display", serif' },
  ],
  'Monospace': [
    { label: 'Fira Code', value: '"Fira Code", "Courier New", monospace' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
    { label: 'Consolas', value: 'Consolas, Monaco, monospace' },
    { label: 'Source Code Pro', value: '"Source Code Pro", monospace' },
    { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  ],
  'Display': [
    { label: 'Inter Display', value: 'Inter, system-ui, sans-serif' },
    { label: 'Playfair Display', value: '"Playfair Display", serif' },
    { label: 'Bebas Neue', value: '"Bebas Neue", cursive' },
    { label: 'Oswald', value: 'Oswald, sans-serif' },
    { label: 'Raleway', value: 'Raleway, sans-serif' },
  ],
};

// Heading style interface with responsive sizes
interface HeadingStyle {
  name: string;
  desktop: string;  // Type scale name
  tablet: string;   // Type scale name
  mobile: string;   // Type scale name
  fontWeight: string;
}

// Draggable Font Weight Row Component
interface DraggableFontWeightProps {
  weight: { name: string; value: string };
  index: number;
  moveWeight: (dragIndex: number, hoverIndex: number) => void;
  onNameChange: (index: number, value: string) => void;
  onValueChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}

const DraggableFontWeight: React.FC<DraggableFontWeightProps> = ({
  weight,
  index,
  moveWeight,
  onNameChange,
  onValueChange,
  onDelete,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'FONT_WEIGHT',
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

      moveWeight(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'FONT_WEIGHT',
    item: () => {
      return { index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`flex items-center gap-2 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div
        ref={drag}
        className="cursor-move flex-shrink-0 text-[#999999] hover:text-[#666666] transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <Input
        value={weight.name}
        onChange={(e) => onNameChange(index, e.target.value)}
        className="h-6 text-[10px] flex-1"
        placeholder="Name"
      />
      <Input
        value={weight.value}
        onChange={(e) => onValueChange(index, e.target.value)}
        className="h-6 text-[10px] w-18"
        type="number"
        min="100"
        max="900"
        step="100"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(index)}
        className="h-6 w-6 p-0 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

export function TypographyPanel() {
  const { state, updateFontFamily, updateTypeScale, updateFontWeights } = useDesignSystem();
  
  // SECTION 1: Font Family State
  const [selectedFontType, setSelectedFontType] = useState<'Sans Serif' | 'Serif' | 'Monospace' | 'Display'>('Sans Serif');
  const [customFontName, setCustomFontName] = useState('');
  const [loadedCustomFonts, setLoadedCustomFonts] = useState<string[]>([]);
  const [draftFontFamily, setDraftFontFamily] = useState(state.fontFamily);
  const [fontFamilyEdited, setFontFamilyEdited] = useState(false);
  const [draftFontWeights, setDraftFontWeights] = useState(state.fontWeights);
  const [fontWeightsEdited, setFontWeightsEdited] = useState(false);

  // SECTION 2: Type Scale State
  const [draftTypeScale, setDraftTypeScale] = useState<TypeScale[]>(state.typeScale);
  const [typeScaleEditedIndices, setTypeScaleEditedIndices] = useState<Set<number>>(new Set());

  // SECTION 3: Heading Styles State
  const [headingVersion, setHeadingVersion] = useState<'product' | 'marketing'>('product');
  const [headingPreviewText, setHeadingPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [productHeadings, setProductHeadings] = useState<HeadingStyle[]>([
    { name: 'H1', desktop: '4xl', tablet: '3xl', mobile: '2xl', fontWeight: '700' },
    { name: 'H2', desktop: '3xl', tablet: '2xl', mobile: 'xl', fontWeight: '700' },
    { name: 'H3', desktop: '2xl', tablet: 'xl', mobile: 'lg', fontWeight: '600' },
    { name: 'Paragraph', desktop: 'base', tablet: 'base', mobile: 'sm', fontWeight: '400' },
    { name: 'Small', desktop: 'sm', tablet: 'sm', mobile: 'xs', fontWeight: '400' },
    { name: 'XSmall', desktop: 'xs', tablet: 'xs', mobile: 'xs', fontWeight: '400' },
  ]);
  const [marketingHeadings, setMarketingHeadings] = useState<HeadingStyle[]>([
    { name: 'H1', desktop: '6xl', tablet: '5xl', mobile: '4xl', fontWeight: '800' },
    { name: 'H2', desktop: '5xl', tablet: '4xl', mobile: '3xl', fontWeight: '700' },
    { name: 'H3', desktop: '4xl', tablet: '3xl', mobile: '2xl', fontWeight: '600' },
    { name: 'Paragraph', desktop: 'lg', tablet: 'base', mobile: 'base', fontWeight: '400' },
    { name: 'Small', desktop: 'base', tablet: 'sm', mobile: 'sm', fontWeight: '400' },
    { name: 'XSmall', desktop: 'sm', tablet: 'xs', mobile: 'xs', fontWeight: '400' },
  ]);
  const [savedProductHeadings, setSavedProductHeadings] = useState(productHeadings);
  const [savedMarketingHeadings, setSavedMarketingHeadings] = useState(marketingHeadings);
  const [headingEditedIndices, setHeadingEditedIndices] = useState<Set<number>>(new Set());

  // Sync with global state changes
  useEffect(() => {
    setDraftFontFamily(state.fontFamily);
    setDraftFontWeights(state.fontWeights);
    setDraftTypeScale(state.typeScale);
    setFontFamilyEdited(false);
    setFontWeightsEdited(false);
    setTypeScaleEditedIndices(new Set());
  }, [state.fontFamily, state.fontWeights, state.typeScale]);

  // ============ SECTION 1: FONT FAMILY FUNCTIONS ============
  
  // Load Google Font
  const loadGoogleFont = () => {
    if (!customFontName.trim()) {
      toast.error('Please enter a font name');
      return;
    }

    if (loadedCustomFonts.includes(customFontName)) {
      toast.info('Font already loaded');
      return;
    }

    const fontName = customFontName.trim();
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    
    const existingLink = document.querySelector(`link[href*="${fontName.replace(/ /g, '+')}"]`);
    if (existingLink) {
      toast.success(`${fontName} is already loaded`);
      setLoadedCustomFonts([...loadedCustomFonts, fontName]);
      return;
    }

    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    
    link.onload = () => {
      setLoadedCustomFonts([...loadedCustomFonts, fontName]);
      
      const fontTypeMap: { [key: string]: keyof typeof state.fontFamily } = {
        'Sans Serif': 'sans',
        'Serif': 'serif',
        'Monospace': 'mono',
        'Display': 'display'
      };
      
      const fontKey = fontTypeMap[selectedFontType];
      const newFontValue = `"${fontName}", ${selectedFontType.toLowerCase()}`;
      setDraftFontFamily({ ...draftFontFamily, [fontKey]: newFontValue });
      setFontFamilyEdited(true);
      
      toast.success(`${fontName} loaded successfully!`);
      setCustomFontName('');
    };
    
    link.onerror = () => {
      toast.error(`Failed to load ${fontName}. Check the font name.`);
    };
    
    document.head.appendChild(link);
  };

  const getCurrentFontFamily = () => {
    const fontMap: { [key: string]: string } = {
      'Sans Serif': draftFontFamily.sans,
      'Serif': draftFontFamily.serif,
      'Monospace': draftFontFamily.mono,
      'Display': draftFontFamily.display,
    };
    return fontMap[selectedFontType] || draftFontFamily.sans;
  };

  const handleFontSelection = (fontValue: string) => {
    const fontTypeMap: { [key: string]: keyof typeof state.fontFamily } = {
      'Sans Serif': 'sans',
      'Serif': 'serif',
      'Monospace': 'mono',
      'Display': 'display'
    };
    
    const fontKey = fontTypeMap[selectedFontType];
    setDraftFontFamily({ ...draftFontFamily, [fontKey]: fontValue });
    setFontFamilyEdited(true);
  };

  const handleWeightChange = (index: number, value: string) => {
    const updated = [...draftFontWeights];
    updated[index] = { ...updated[index], value };
    setDraftFontWeights(updated);
    setFontWeightsEdited(true);
  };

  const addFontWeight = () => {
    const newWeight = { name: `custom-${draftFontWeights.length + 1}`, value: '400' };
    setDraftFontWeights([...draftFontWeights, newWeight]);
    setFontWeightsEdited(true);
    toast.success('Font weight added');
  };

  const deleteFontWeight = (index: number) => {
    if (draftFontWeights.length <= 1) {
      toast.error('Must have at least one font weight');
      return;
    }
    const updated = draftFontWeights.filter((_, i) => i !== index);
    setDraftFontWeights(updated);
    setFontWeightsEdited(true);
    toast.success('Font weight deleted');
  };

  const handleWeightNameChange = (index: number, value: string) => {
    const updated = [...draftFontWeights];
    updated[index] = { ...updated[index], name: value };
    setDraftFontWeights(updated);
    setFontWeightsEdited(true);
  };

  const saveFontFamilySection = () => {
    updateFontFamily(draftFontFamily);
    updateFontWeights(draftFontWeights);
    setFontFamilyEdited(false);
    setFontWeightsEdited(false);
    toast.success('Font families and weights saved');
  };

  const resetFontFamilySection = () => {
    setDraftFontFamily(state.fontFamily);
    setDraftFontWeights(state.fontWeights);
    setFontFamilyEdited(false);
    setFontWeightsEdited(false);
    toast.info('Font changes discarded');
  };

  // ============ SECTION 2: TYPE SCALE FUNCTIONS ============

  const handleScaleChange = (index: number, field: keyof TypeScale, value: string) => {
    const updated = [...draftTypeScale];
    updated[index] = { ...updated[index], [field]: value };
    setDraftTypeScale(updated);
    setTypeScaleEditedIndices(prev => new Set(prev).add(index));
  };

  const saveTypeScale = (index: number) => {
    const updated = [...state.typeScale];
    updated[index] = draftTypeScale[index];
    updateTypeScale(updated);
    
    setTypeScaleEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast.success(`${draftTypeScale[index].name} saved`);
  };

  const resetTypeScale = (index: number) => {
    const updated = [...draftTypeScale];
    updated[index] = state.typeScale[index];
    setDraftTypeScale(updated);
    
    setTypeScaleEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast.info('Changes discarded');
  };

  const deleteTypeScale = (index: number) => {
    if (draftTypeScale.length <= 1) {
      toast.error('Must have at least one type scale');
      return;
    }
    const updated = draftTypeScale.filter((_, i) => i !== index);
    setDraftTypeScale(updated);
    updateTypeScale(updated);
    toast.success('Type scale deleted');
  };

  const addTypeScale = () => {
    const newScale: TypeScale = {
      name: `custom-${draftTypeScale.length + 1}`,
      size: '1rem',
      lineHeight: '1.5rem',
      letterSpacing: '0',
    };
    const updated = [...draftTypeScale, newScale];
    setDraftTypeScale(updated);
    updateTypeScale(updated);
    toast.success('Type scale added');
  };

  const saveAllTypeScales = () => {
    updateTypeScale(draftTypeScale);
    setTypeScaleEditedIndices(new Set());
    toast.success('All type scales saved');
  };

  const resetAllTypeScales = () => {
    setDraftTypeScale(state.typeScale);
    setTypeScaleEditedIndices(new Set());
    toast.info('All changes discarded');
  };

  // ============ SECTION 3: HEADING STYLES FUNCTIONS ============

  const currentHeadings = headingVersion === 'product' ? productHeadings : marketingHeadings;
  const savedHeadings = headingVersion === 'product' ? savedProductHeadings : savedMarketingHeadings;

  const handleHeadingChange = (index: number, field: keyof HeadingStyle, value: string) => {
    const updated = [...currentHeadings];
    updated[index] = { ...updated[index], [field]: value };
    
    if (headingVersion === 'product') {
      setProductHeadings(updated);
    } else {
      setMarketingHeadings(updated);
    }
    setHeadingEditedIndices(prev => new Set(prev).add(index));
  };

  const saveHeading = (index: number) => {
    const currentHeadings = headingVersion === 'product' ? productHeadings : marketingHeadings;
    
    if (headingVersion === 'product') {
      const updated = [...savedProductHeadings];
      updated[index] = currentHeadings[index];
      setSavedProductHeadings(updated);
    } else {
      const updated = [...savedMarketingHeadings];
      updated[index] = currentHeadings[index];
      setSavedMarketingHeadings(updated);
    }
    
    setHeadingEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast.success(`${currentHeadings[index].name} saved`);
  };

  const resetHeading = (index: number) => {
    const saved = headingVersion === 'product' ? savedProductHeadings : savedMarketingHeadings;
    
    if (headingVersion === 'product') {
      const updated = [...productHeadings];
      updated[index] = saved[index];
      setProductHeadings(updated);
    } else {
      const updated = [...marketingHeadings];
      updated[index] = saved[index];
      setMarketingHeadings(updated);
    }
    
    setHeadingEditedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast.info('Changes discarded');
  };

  const deleteHeading = (index: number) => {
    const currentHeadings = headingVersion === 'product' ? productHeadings : marketingHeadings;
    if (currentHeadings.length <= 1) {
      toast.error('Must have at least one heading');
      return;
    }
    
    const updated = currentHeadings.filter((_, i) => i !== index);
    if (headingVersion === 'product') {
      setProductHeadings(updated);
      setSavedProductHeadings(updated);
    } else {
      setMarketingHeadings(updated);
      setSavedMarketingHeadings(updated);
    }
    toast.success('Heading deleted');
  };

  const addHeading = () => {
    const currentHeadings = headingVersion === 'product' ? productHeadings : marketingHeadings;
    const newHeading: HeadingStyle = {
      name: `Custom ${currentHeadings.length + 1}`,
      desktop: 'base',
      tablet: 'base',
      mobile: 'sm',
      fontWeight: '400',
    };
    
    if (headingVersion === 'product') {
      setProductHeadings([...currentHeadings, newHeading]);
      setSavedProductHeadings([...currentHeadings, newHeading]);
    } else {
      setMarketingHeadings([...currentHeadings, newHeading]);
      setSavedMarketingHeadings([...currentHeadings, newHeading]);
    }
    toast.success('Heading style added');
  };

  const saveAllHeadings = () => {
    if (headingVersion === 'product') {
      setSavedProductHeadings(productHeadings);
    } else {
      setSavedMarketingHeadings(marketingHeadings);
    }
    setHeadingEditedIndices(new Set());
    toast.success(`All ${headingVersion} headings saved`);
  };

  const resetAllHeadings = () => {
    if (headingVersion === 'product') {
      setProductHeadings(savedProductHeadings);
    } else {
      setMarketingHeadings(savedMarketingHeadings);
    }
    setHeadingEditedIndices(new Set());
    toast.info('All changes discarded');
  };

  // Get type scale details by name
  const getTypeScaleByName = (name: string): TypeScale | undefined => {
    return draftTypeScale.find(scale => scale.name === name);
  };

  // Get device-specific preview settings
  const getDeviceSettings = () => {
    switch (state.previewMode) {
      case 'mobile':
        return {
          maxWidth: '375px',
          label: 'Mobile Typography',
          description: 'Optimized for mobile devices (< 640px)',
        };
      case 'tablet':
        return {
          maxWidth: '768px',
          label: 'Tablet Typography',
          description: 'Optimized for tablet devices (640px - 1024px)',
        };
      case 'desktop':
      default:
        return {
          maxWidth: '100%',
          label: 'Desktop Typography',
          description: 'Optimized for desktop devices (> 1024px)',
        };
    }
  };

  const deviceSettings = getDeviceSettings();
  const viewMode = state.currentTheme;
  const isFontSectionEdited = fontFamilyEdited || fontWeightsEdited;
  const hasAnyTypeScaleEdits = typeScaleEditedIndices.size > 0;
  const hasAnyHeadingEdits = headingEditedIndices.size > 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        {/* Editor Panel */}
        <div className="w-[380px] border-r border-[#E5E5E5] bg-white flex flex-col">
          <div className="p-4 border-b border-[#E5E5E5]">
            <h2 className="font-semibold text-[15px]">Typography</h2>
            <p className="text-[11px] text-[#999999] mt-0.5">
              Font families, weights, scales, and headings
            </p>
          </div>

          <ScrollArea className="flex-1 h-full overflow-auto">
            <div className="p-4 space-y-6 pb-20">
              
              {/* ============ SECTION 1: FONT FAMILIES ============ */}
              <div className={`rounded-lg border p-4 ${
                isFontSectionEdited ? 'border-[#FFA500] bg-[#FFFBF0]' : 'border-[#E5E5E5] bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[12px] font-semibold">Font Families</Label>
                  {isFontSectionEdited && (
                    <div className="flex items-center gap-1 bg-[#FFF3CD] border border-[#FFA500] text-[#856404] rounded px-2 py-0.5 text-[9px]">
                      <span className="w-1.5 h-1.5 bg-[#FFA500] rounded-full animate-pulse"></span>
                      Unsaved
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Font Type Selector */}
                  <div>
                    <Label className="text-[10px] text-[#666666]">Type</Label>
                    <Select
                      value={selectedFontType}
                      onValueChange={(value: any) => setSelectedFontType(value)}
                    >
                      <SelectTrigger className="h-7 text-[11px] mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sans Serif" className="text-[11px]">Sans Serif</SelectItem>
                        <SelectItem value="Serif" className="text-[11px]">Serif</SelectItem>
                        <SelectItem value="Monospace" className="text-[11px]">Monospace</SelectItem>
                        <SelectItem value="Display" className="text-[11px]">Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Selector based on Type */}
                  <div>
                    <Label className="text-[10px] text-[#666666]">Font</Label>
                    <Select
                      value={getCurrentFontFamily()}
                      onValueChange={handleFontSelection}
                    >
                      <SelectTrigger className="h-7 text-[11px] mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FONTS[selectedFontType].map((font) => (
                          <SelectItem key={font.value} value={font.value} className="text-[11px]">
                            {font.label}
                          </SelectItem>
                        ))}
                        {loadedCustomFonts.map((fontName) => (
                          <SelectItem 
                            key={fontName} 
                            value={`"${fontName}", ${selectedFontType.toLowerCase()}`} 
                            className="text-[11px]"
                          >
                            {fontName} (Custom)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Google Font Loader */}
                  <div className="p-3 bg-white rounded border border-[#E5E5E5]">
                    <Label className="text-[10px] text-[#666666] mb-2 block">Add Google Font</Label>
                    <div className="flex gap-2">
                      <Input
                        value={customFontName}
                        onChange={(e) => setCustomFontName(e.target.value)}
                        placeholder="e.g. 'Geist'"
                        className="h-7 text-[11px] flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            loadGoogleFont();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={loadGoogleFont}
                        className="h-7 px-3 text-[10px]"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Load
                      </Button>
                    </div>
                    <p className="text-[9px] text-[#999999] mt-1.5">
                      Type exact Google Font name
                    </p>
                  </div>

                  {/* Font Weights */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] text-[#666666]">Font Weights</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={addFontWeight}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {draftFontWeights.map((weight, index) => (
                        <DraggableFontWeight
                          key={index}
                          weight={weight}
                          index={index}
                          moveWeight={(dragIndex, hoverIndex) => {
                            const updated = [...draftFontWeights];
                            const [removed] = updated.splice(dragIndex, 1);
                            updated.splice(hoverIndex, 0, removed);
                            setDraftFontWeights(updated);
                            setFontWeightsEdited(true);
                          }}
                          onNameChange={handleWeightNameChange}
                          onValueChange={handleWeightChange}
                          onDelete={deleteFontWeight}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section Save/Reset */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5E5E5]">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetFontFamilySection}
                    className="h-6 px-2 text-[11px] text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                    disabled={!isFontSectionEdited}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={saveFontFamilySection}
                    className="h-6 px-2 text-[11px] text-[#0066FF] hover:text-[#0044CC] hover:bg-[#E0F7FA]"
                    disabled={!isFontSectionEdited}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              {/* ============ SECTION 2: TYPE SCALE ============ */}
              <div className={`rounded-lg border p-4 ${
                hasAnyTypeScaleEdits ? 'border-[#FFA500] bg-[#FFFBF0]' : 'border-[#E5E5E5] bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[12px] font-semibold">Type Scale</Label>
                  <Button
                    size="sm"
                    onClick={addTypeScale}
                    className="h-6 px-2 text-[10px]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>

                {hasAnyTypeScaleEdits && (
                  <div className="flex items-center gap-1.5 bg-[#FFF3CD] border border-[#FFA500] text-[#856404] rounded px-2 py-1 text-[10px] mb-3">
                    <span className="w-1.5 h-1.5 bg-[#FFA500] rounded-full animate-pulse"></span>
                    {typeScaleEditedIndices.size} item(s) have unsaved changes
                  </div>
                )}

                <div className="space-y-3">
                  {draftTypeScale.map((scale, index) => (
                    <div key={index} className={`p-3 bg-white rounded-lg border ${
                      typeScaleEditedIndices.has(index) ? 'border-[#FFA500]' : 'border-[#E5E5E5]'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={scale.name}
                          onChange={(e) => handleScaleChange(index, 'name', e.target.value)}
                          className="h-6 text-[11px] font-medium w-28"
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetTypeScale(index)}
                            className="h-6 w-6 p-0 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                            title="Reset"
                            disabled={!typeScaleEditedIndices.has(index)}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveTypeScale(index)}
                            className="h-6 w-6 p-0 text-[#0066FF] hover:text-[#0044CC] hover:bg-[#E0F7FA]"
                            title="Save"
                            disabled={!typeScaleEditedIndices.has(index)}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTypeScale(index)}
                            className="h-6 w-6 p-0 text-[#999999] hover:text-[#666666] hover:bg-[#F0F0F0]"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[9px] text-[#666666]">Size</Label>
                          <Input
                            value={scale.size}
                            onChange={(e) => handleScaleChange(index, 'size', e.target.value)}
                            className="h-6 text-[10px] mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] text-[#666666]">Line Height</Label>
                          <Input
                            value={scale.lineHeight}
                            onChange={(e) => handleScaleChange(index, 'lineHeight', e.target.value)}
                            className="h-6 text-[10px] mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] text-[#666666]">Tracking</Label>
                          <Input
                            value={scale.letterSpacing}
                            onChange={(e) => handleScaleChange(index, 'letterSpacing', e.target.value)}
                            className="h-6 text-[10px] mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Save/Reset */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5E5E5]">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetAllTypeScales}
                    className="h-6 px-2 text-[11px] text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                    disabled={!hasAnyTypeScaleEdits}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={saveAllTypeScales}
                    className="h-6 px-2 text-[11px] text-[#0066FF] hover:text-[#0044CC] hover:bg-[#E0F7FA]"
                    disabled={!hasAnyTypeScaleEdits}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save All
                  </Button>
                </div>
              </div>

              <Separator />

              {/* ============ SECTION 3: HEADING STYLES ============ */}
              <div className={`rounded-lg border p-4 ${
                hasAnyHeadingEdits ? 'border-[#FFA500] bg-[#FFFBF0]' : 'border-[#E5E5E5] bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[12px] font-semibold">Heading Styles</Label>
                  <Button
                    size="sm"
                    onClick={addHeading}
                    className="h-6 px-2 text-[10px]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Product/Marketing Tabs */}
                <div className="flex gap-1 p-1 bg-[#F9FAFB] rounded-lg mb-3">
                  <button
                    onClick={() => setHeadingVersion('product')}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-medium rounded transition-colors ${
                      headingVersion === 'product'
                        ? 'bg-white text-[#0066FF] shadow-sm'
                        : 'text-[#666666] hover:text-[#000000]'
                    }`}
                  >
                    Product
                  </button>
                  <button
                    onClick={() => setHeadingVersion('marketing')}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-medium rounded transition-colors ${
                      headingVersion === 'marketing'
                        ? 'bg-white text-[#0066FF] shadow-sm'
                        : 'text-[#666666] hover:text-[#000000]'
                    }`}
                  >
                    Marketing
                  </button>
                </div>

                {/* Preview Text Input */}
                <div className="mb-3">
                  <Label className="text-[10px] text-[#666666] mb-1 block">Preview Text</Label>
                  <Input
                    value={headingPreviewText}
                    onChange={(e) => setHeadingPreviewText(e.target.value)}
                    placeholder="Enter preview text..."
                    className="h-7 text-[11px]"
                  />
                </div>

                {hasAnyHeadingEdits && (
                  <div className="flex items-center gap-1.5 bg-[#FFF3CD] border border-[#FFA500] text-[#856404] rounded px-2 py-1 text-[10px] mb-3">
                    <span className="w-1.5 h-1.5 bg-[#FFA500] rounded-full animate-pulse"></span>
                    {headingEditedIndices.size} item(s) have unsaved changes
                  </div>
                )}

                <div className="space-y-3">
                  {currentHeadings.map((heading, index) => (
                    <div key={index} className={`p-3 bg-white rounded-lg border ${
                      headingEditedIndices.has(index) ? 'border-[#FFA500]' : 'border-[#E5E5E5]'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={heading.name}
                          onChange={(e) => handleHeadingChange(index, 'name', e.target.value)}
                          className="h-6 text-[11px] font-medium w-28"
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetHeading(index)}
                            className="h-6 w-6 p-0 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                            title="Reset"
                            disabled={!headingEditedIndices.has(index)}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveHeading(index)}
                            className="h-6 w-6 p-0 text-[#0066FF] hover:text-[#0044CC] hover:bg-[#E0F7FA]"
                            title="Save"
                            disabled={!headingEditedIndices.has(index)}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteHeading(index)}
                            className="h-6 w-6 p-0 text-[#999999] hover:text-[#666666] hover:bg-[#F0F0F0]"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Responsive Size Selectors */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <Label className="text-[9px] text-[#666666]">Desktop</Label>
                          <Select
                            value={heading.desktop}
                            onValueChange={(value) => handleHeadingChange(index, 'desktop', value)}
                          >
                            <SelectTrigger className="h-6 text-[10px] mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {draftTypeScale.map((scale) => (
                                <SelectItem key={scale.name} value={scale.name} className="text-[10px]">
                                  {scale.name} ({scale.size})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-[#666666]">Tablet</Label>
                          <Select
                            value={heading.tablet}
                            onValueChange={(value) => handleHeadingChange(index, 'tablet', value)}
                          >
                            <SelectTrigger className="h-6 text-[10px] mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {draftTypeScale.map((scale) => (
                                <SelectItem key={scale.name} value={scale.name} className="text-[10px]">
                                  {scale.name} ({scale.size})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-[#666666]">Mobile</Label>
                          <Select
                            value={heading.mobile}
                            onValueChange={(value) => handleHeadingChange(index, 'mobile', value)}
                          >
                            <SelectTrigger className="h-6 text-[10px] mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {draftTypeScale.map((scale) => (
                                <SelectItem key={scale.name} value={scale.name} className="text-[10px]">
                                  {scale.name} ({scale.size})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Font Weight */}
                      <div>
                        <Label className="text-[9px] text-[#666666]">Weight</Label>
                        <Select
                          value={heading.fontWeight}
                          onValueChange={(value) => handleHeadingChange(index, 'fontWeight', value)}
                        >
                          <SelectTrigger className="h-6 text-[10px] mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100" className="text-[10px]">Thin (100)</SelectItem>
                            <SelectItem value="200" className="text-[10px]">Extra Light (200)</SelectItem>
                            <SelectItem value="300" className="text-[10px]">Light (300)</SelectItem>
                            <SelectItem value="400" className="text-[10px]">Regular (400)</SelectItem>
                            <SelectItem value="500" className="text-[10px]">Medium (500)</SelectItem>
                            <SelectItem value="600" className="text-[10px]">Semibold (600)</SelectItem>
                            <SelectItem value="700" className="text-[10px]">Bold (700)</SelectItem>
                            <SelectItem value="800" className="text-[10px]">Extra Bold (800)</SelectItem>
                            <SelectItem value="900" className="text-[10px]">Black (900)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Save/Reset */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5E5E5]">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetAllHeadings}
                    className="h-6 px-2 text-[11px] text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                    disabled={!hasAnyHeadingEdits}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={saveAllHeadings}
                    className="h-6 px-2 text-[11px] text-[#0066FF] hover:text-[#0044CC] hover:bg-[#E0F7FA]"
                    disabled={!hasAnyHeadingEdits}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save All
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className={`flex-1 overflow-auto ${
          viewMode === 'light' ? 'bg-[#FAFAFA]' : 'bg-[#1A1A1A]'
        }`}>
          {/* Export Buttons */}
          <div className={`sticky top-0 z-10 px-6 py-3 border-b flex items-center justify-between ${
            viewMode === 'light' 
              ? 'bg-white border-[#E5E5E5]' 
              : 'bg-[#2A2A2A] border-[#333333]'
          }`}>
            <div>
              <h3 className={`font-semibold text-[13px] ${
                viewMode === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
              }`}>
                Preview · {viewMode} mode
              </h3>
              <p className={`text-[10px] mt-0.5 ${
                viewMode === 'light' ? 'text-[#666666]' : 'text-[#999999]'
              }`}>
                Export includes all typography tokens in Figma Variables format
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const typographyData = {
                    fontFamilies: Object.entries(state.fontFamily).map(([name, value]) => ({ name, value })),
                    fontSizes: state.typeScale.map(scale => ({ name: scale.name, value: scale.size })),
                    fontWeights: state.fontWeights,
                    lineHeights: state.typeScale.map(scale => ({ name: scale.name, value: scale.lineHeight }))
                  };
                  const figmaTokens = generateFigmaTypographyTokens(typographyData);
                  const jsonString = JSON.stringify(figmaTokens, null, 2);
                  copyToClipboard(jsonString);
                  toast.success('Typography tokens copied to clipboard!');
                }}
                className="h-7 text-[11px]"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Copy Figma Tokens
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const typographyData = {
                    fontFamilies: Object.entries(state.fontFamily).map(([name, value]) => ({ name, value })),
                    fontSizes: state.typeScale.map(scale => ({ name: scale.name, value: scale.size })),
                    fontWeights: state.fontWeights,
                    lineHeights: state.typeScale.map(scale => ({ name: scale.name, value: scale.lineHeight }))
                  };
                  const figmaTokens = generateFigmaTypographyTokens(typographyData);
                  downloadJSON(figmaTokens, 'Typography_Tokens.json');
                  toast.success('Typography_Tokens.json downloaded!');
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
                viewMode === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'
              }`}>
                {deviceSettings.label}
              </h3>
              <p className={`text-[11px] ${
                viewMode === 'light' ? 'text-[#666666]' : 'text-[#999999]'
              }`}>
                {deviceSettings.description}
              </p>
            </div>

            {/* Device-Specific Preview Container */}
            <div className="mx-auto" style={{ maxWidth: deviceSettings.maxWidth }}>
              {/* Responsive Heading Styles Preview */}
              <div className={`rounded-lg border p-6 mb-6 ${
                viewMode === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <h4 className={`text-[11px] font-semibold uppercase tracking-wide mb-4 ${
                  viewMode === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>
                  {headingVersion === 'product' ? 'Product' : 'Marketing'} Heading Styles
                </h4>
                
                {/* Device-based Preview */}
                <div>
                  <p className={`text-[9px] font-semibold uppercase tracking-wide mb-3 ${
                    viewMode === 'light' ? 'text-[#999999]' : 'text-[#666666]'
                  }`}>
                    {state.previewMode.charAt(0).toUpperCase() + state.previewMode.slice(1)} Preview
                  </p>
                  <div className="space-y-4">
                    {currentHeadings.map((heading, index) => {
                      // Get the appropriate type scale based on preview mode
                      const deviceKey = state.previewMode as 'desktop' | 'tablet' | 'mobile';
                      const typeScale = getTypeScaleByName(heading[deviceKey]);
                      if (!typeScale) return null;
                      
                      return (
                        <div key={index} className="space-y-2">
                          {/* Heading Name Label - Bold Gray 16px */}
                          <div
                            className={`font-bold`}
                            style={{
                              fontSize: '16px',
                              color: viewMode === 'light' ? '#666666' : '#999999',
                            }}
                          >
                            {heading.name}
                          </div>
                          {/* Preview Text */}
                          <div
                            style={{
                              fontSize: typeScale.size,
                              fontWeight: heading.fontWeight,
                              lineHeight: typeScale.lineHeight,
                              letterSpacing: typeScale.letterSpacing,
                              fontFamily: getCurrentFontFamily(),
                              color: viewMode === 'light' ? '#000000' : '#FFFFFF',
                            }}
                          >
                            {headingPreviewText}
                          </div>
                          <p className={`text-[9px] font-mono ${
                            viewMode === 'light' ? 'text-[#999999]' : 'text-[#666666]'
                          }`}>
                            {heading[deviceKey]} · {typeScale.size} · {heading.fontWeight}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Type Scale Preview */}
              <div className={`rounded-lg border p-6 mb-6 ${
                viewMode === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <h4 className={`text-[11px] font-semibold uppercase tracking-wide mb-4 ${
                  viewMode === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>
                  Type Scale
                </h4>
                <div className="space-y-4">
                  {[...draftTypeScale].reverse().map((scale, index) => (
                    <div key={index} className={`border-b pb-4 last:border-0 ${
                      viewMode === 'light' ? 'border-[#F0F0F0]' : 'border-[#333333]'
                    }`}>
                      <div
                        style={{
                          fontSize: scale.size,
                          lineHeight: scale.lineHeight,
                          letterSpacing: scale.letterSpacing,
                          fontFamily: getCurrentFontFamily(),
                          color: viewMode === 'light' ? '#000000' : '#FFFFFF',
                        }}
                      >
                        The quick brown fox jumps
                      </div>
                      <p className={`text-[10px] font-mono mt-1 ${
                        viewMode === 'light' ? 'text-[#999999]' : 'text-[#666666]'
                      }`}>
                        {scale.name} · {scale.size} · LH: {scale.lineHeight} · LS: {scale.letterSpacing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Weights Preview */}
              <div className={`rounded-lg border p-6 mb-6 ${
                viewMode === 'light' 
                  ? 'bg-white border-[#E5E5E5]' 
                  : 'bg-[#2A2A2A] border-[#333333]'
              }`}>
                <h4 className={`text-[11px] font-semibold uppercase tracking-wide mb-4 ${
                  viewMode === 'light' ? 'text-[#666666]' : 'text-[#999999]'
                }`}>
                  Font Weights
                </h4>
                <div className="space-y-3">
                  {draftFontWeights.map((weight) => (
                    <div key={weight.name} className="space-y-1">
                      <span
                        className="text-[18px]"
                        style={{
                          fontWeight: weight.value,
                          fontFamily: getCurrentFontFamily(),
                          color: viewMode === 'light' ? '#000000' : '#FFFFFF',
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </span>
                      <p className={`text-[10px] font-mono ${
                        viewMode === 'light' ? 'text-[#999999]' : 'text-[#666666]'
                      }`}>
                        {weight.name} ({weight.value})
                      </p>
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