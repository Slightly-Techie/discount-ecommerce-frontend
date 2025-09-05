import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  ShoppingBag,
  Settings,
  LogOut,
  UserCircle,
  List,
  Home,
  Package,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useIsAuthenticated, useLogout } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cartStore";

interface MobileSidebarProps {
  favoritesCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({
  favoritesCount = 0,
  isOpen,
  onClose,
}: MobileSidebarProps) {
  const { isAuthenticated, user } = useIsAuthenticated();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  // Subscribe to cart changes and derive count
  const cartItemsCount = useCartStore((state) =>
    (state.cart || []).reduce((total, item) => total + (item?.quantity || 0), 0)
  );

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center">
            <img
              src="/icons/Main Logo.svg"
              alt="GrottoMore Logo"
              className="h-10 w-10"
            />
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="flex-1 p-6">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-lg h-12"
                onClick={() => handleNavigation("/")}
              >
                <Home className="mr-3 h-5 w-5" />
                Home
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-lg h-12"
                onClick={() => handleNavigation("/products")}
              >
                <Package className="mr-3 h-5 w-5" />
                Products
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Quick Actions
              </h3>

              <Button
                variant="ghost"
                className="w-full justify-start text-lg h-12"
                onClick={() => handleNavigation("/favorites")}
              >
                <Heart className="mr-3 h-5 w-5" />
                Favorites
                {favoritesCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {favoritesCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-lg h-12"
                onClick={() => handleNavigation("/cart")}
              >
                <ShoppingCart className="mr-3 h-5 w-5" />
                Cart
                {cartItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User Section */}
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Account
              </h3>

              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="p-3 bg-muted/50 rounded-lg mb-3">
                    <div className="flex items-center space-x-3">
                      <UserCircle className="h-8 w-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Menu Items */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg h-12"
                    onClick={() => handleNavigation("/profile")}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Profile
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg h-12"
                    onClick={() => handleNavigation("/orders")}
                  >
                    <List className="mr-3 h-5 w-5" />
                    Orders
                  </Button>

                  {user?.role === "admin" && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-lg h-12"
                      onClick={() => handleNavigation("/admin")}
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      Admin Dashboard
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg h-12 text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg h-12"
                    onClick={() => handleNavigation("/login")}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Login
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg h-12"
                    onClick={() => handleNavigation("/register")}
                  >
                    <List className="mr-3 h-5 w-5" />
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="p-6 border-t">
            <Button variant="outline" className="w-full" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close Menu
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
