import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  ShoppingBag,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  cartItemsCount?: number;
  favoritesCount?: number;
  onMenuToggle?: () => void;
}

export function Header({ 
  cartItemsCount = 0, 
  favoritesCount = 0, 
  onMenuToggle 
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              DealsHub
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Products
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Favorites */}
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {favoritesCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {favoritesCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Shopping Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Admin Panel Link */}
            <Link to="/admin">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}