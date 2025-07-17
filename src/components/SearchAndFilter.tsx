import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface FilterOptions {
  search: string;
  category: string;
  brand: string;
  priceRange: string;
  sortBy: string;
}

interface SearchAndFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
  brands: string[];
}

export function SearchAndFilter({ 
  filters, 
  onFilterChange, 
  categories, 
  brands 
}: SearchAndFilterProps) {
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    const finalValue = value === "all" ? "" : value;
    onFilterChange({ ...filters, [key]: finalValue });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      category: "",
      brand: "",
      priceRange: "",
      sortBy: "name"
    });
  };

  const hasActiveFilters = filters.search || filters.category || filters.brand || filters.priceRange;

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg shadow-card">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Category Filter */}
        <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Brand Filter */}
        <Select value={filters.brand} onValueChange={(value) => updateFilter("brand", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range Filter */}
        <Select value={filters.priceRange} onValueChange={(value) => updateFilter("priceRange", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="0-25">$0 - $25</SelectItem>
            <SelectItem value="25-50">$25 - $50</SelectItem>
            <SelectItem value="50-100">$50 - $100</SelectItem>
            <SelectItem value="100+">$100+</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="discount">Biggest Discount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters and Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter("search", "")}
                />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                Category: {filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter("category", "")}
                />
              </Badge>
            )}
            {filters.brand && (
              <Badge variant="secondary" className="gap-1">
                Brand: {filters.brand}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter("brand", "")}
                />
              </Badge>
            )}
            {filters.priceRange && (
              <Badge variant="secondary" className="gap-1">
                Price: ${filters.priceRange}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter("priceRange", "")}
                />
              </Badge>
            )}
          </div>
          
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}