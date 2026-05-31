import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { ColorsPanel } from './components/foundations/ColorsPanel';
import { TypographyPanel } from './components/foundations/TypographyPanel';
import { SpacingPanel } from './components/foundations/SpacingPanel';
import { RadiusPanel } from './components/foundations/RadiusPanel';
import { ShadowsPanel } from './components/foundations/ShadowsPanel';
import { GradientsPanel } from './components/foundations/GradientsPanel';
import { LayoutPanel } from './components/foundations/LayoutPanel';
import { ExportPanel } from './components/foundations/ExportPanel';
import { DesignSystemProvider } from './context/DesignSystemContext';

// Wrapper to provide context to MainLayout and its children
function RootWrapper() {
  return (
    <DesignSystemProvider>
      <MainLayout />
    </DesignSystemProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootWrapper,
    children: [
      { index: true, Component: ColorsPanel },
      { path: 'typography', Component: TypographyPanel },
      { path: 'spacing', Component: SpacingPanel },
      { path: 'radius', Component: RadiusPanel },
      { path: 'shadows', Component: ShadowsPanel },
      { path: 'gradients', Component: GradientsPanel },
      { path: 'layout', Component: LayoutPanel },
      { path: 'export', Component: ExportPanel },
      { path: 'motion', element: <Navigate to="/" replace /> },
    ],
  },
]);