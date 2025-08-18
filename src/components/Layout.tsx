import { useState } from "react";
import { Header } from "@/components/Header";
import { MobileSidebar } from "@/components/MobileSidebar";

interface LayoutProps {
  children: React.ReactNode;
  favoritesCount?: number;
}

export function Layout({ children, favoritesCount = 0 }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        favoritesCount={favoritesCount}
        onMenuToggle={handleMenuToggle}
      />
      
      <MobileSidebar
        favoritesCount={favoritesCount}
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />
      
      <main>
        {children}
      </main>
    </div>
  );
}
