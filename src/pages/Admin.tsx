import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Layers, Users, LogOut, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import ProductManager from "@/components/ProductManager";
import CategoryManager from "@/components/CategoryManager";
import { BulkUploadProducts } from "@/components/BulkUploadProducts";
import { BulkUploadCategories } from "@/components/BulkUploadCategories";

import { useIsAuthenticated, useLogout } from "@/hooks/useAuth";
import UserManager from "@/components/UserManager";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("products");
  const { isAuthenticated, user } = useIsAuthenticated();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  // Redirect non-admins to home
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "admin") {
      navigate("/"); // Redirect customers to home or profile
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/login");
  };

  const navItems = [
    { key: "products", label: "Products", icon: Package },
    { key: "bulk-upload", label: "Bulk Upload Products", icon: Upload },
    { key: "bulk-upload-categories", label: "Bulk Upload Categories", icon: Upload },
    { key: "categories", label: "Categories", icon: Layers },
    { key: "users", label: "Users", icon: Users },
  ];

  // If not authenticated or wrong role, show nothing while redirecting
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="px-6 py-5 border-b">
          <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === key
                  ? "bg-primary text-white shadow-md"
                  : "hover:bg-gray-200 text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <LogOut className="w-4 h-4 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="p-6">
          {activeTab === "products" && <ProductManager />}
          {activeTab === "bulk-upload" && <BulkUploadProducts />}
          {activeTab === "bulk-upload-categories" && <BulkUploadCategories />}
          {activeTab === "categories" && <CategoryManager />}
          {activeTab === "users" && <UserManager />}
        </div>
      </main>
    </div>
  );
}
