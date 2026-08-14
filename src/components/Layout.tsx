import type { ReactNode } from 'react';
import { NavBar } from './NavBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-main">{children}</main>
    </div>
  );
}
