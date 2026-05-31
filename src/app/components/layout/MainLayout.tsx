import React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  Palette,
  Type,
  Space,
  BoxSelect,
  Sparkles,
  Layout,
  Download,
  Sun,
  Moon,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import { useDesignSystem } from '../../context/DesignSystemContext';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const navigation = [
  { name: 'Colors', href: '/', icon: Palette },
  { name: 'Typography', href: '/typography', icon: Type },
  { name: 'Spacing', href: '/spacing', icon: Space },
  { name: 'Radius', href: '/radius', icon: BoxSelect },
  { name: 'Shadows', href: '/shadows', icon: Sparkles },
  { name: 'Gradients', href: '/gradients', icon: Palette },
  { name: 'Layout & Grid', href: '/layout', icon: Layout },
  { name: 'Export', href: '/export', icon: Download },
];

export function MainLayout() {
  const location = useLocation();
  const { state, setTheme, setPreviewMode } = useDesignSystem();

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <div className="w-[240px] bg-white border-r border-[#E5E5E5] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E5]">
          <h1 className="font-semibold text-[15px] text-[#000000]">Design System</h1>
          <p className="text-[11px] text-[#999999] mt-0.5">Foundation Generator</p>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 overflow-auto">
          <nav className="p-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href}>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? 'bg-[#0066FF] text-white'
                        : 'text-[#333333] hover:bg-[#F0F0F0]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer Controls */}
        <div className="p-3 border-t border-[#E5E5E5] space-y-2">
          {/* Theme Toggle */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={state.currentTheme === 'light' ? 'default' : 'outline'}
              className="flex-1 h-7 text-[11px]"
              onClick={() => setTheme('light')}
            >
              <Sun className="w-3 h-3 mr-1" />
              Light
            </Button>
            <Button
              size="sm"
              variant={state.currentTheme === 'dark' ? 'default' : 'outline'}
              className="flex-1 h-7 text-[11px]"
              onClick={() => setTheme('dark')}
            >
              <Moon className="w-3 h-3 mr-1" />
              Dark
            </Button>
          </div>

          {/* Preview Mode */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={state.previewMode === 'desktop' ? 'default' : 'outline'}
              className="flex-1 h-7 px-1"
              onClick={() => setPreviewMode('desktop')}
              title="Desktop"
            >
              <Monitor className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={state.previewMode === 'tablet' ? 'default' : 'outline'}
              className="flex-1 h-7 px-1"
              onClick={() => setPreviewMode('tablet')}
              title="Tablet"
            >
              <Tablet className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={state.previewMode === 'mobile' ? 'default' : 'outline'}
              className="flex-1 h-7 px-1"
              onClick={() => setPreviewMode('mobile')}
              title="Mobile"
            >
              <Smartphone className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}