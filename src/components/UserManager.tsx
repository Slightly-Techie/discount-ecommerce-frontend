import { useState } from "react";
import { useUsers, useUpdateUserRole } from "@/hooks/useUsers";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, User as UserIcon, Loader2, Search, Filter, Package } from "lucide-react";
import { Input } from "./ui/input";

const UserManager = () => {
  const { data: users, isLoading, error, refetch } = useUsers();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Filter users based on search term and role filter
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ id: userId, role: newRole });
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'seller':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'customer':
      case 'user':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'seller':
        return <Package className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      case 'customer':
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Failed to load users</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email, username, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== "all" 
                  ? "No users match your search criteria" 
                  : "No users found"}
              </p>
            </div>
          ) : (
            filteredUsers.map((user: User) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || user.email
                        }
                      </p>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role || 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role || 'customer'}
                    onValueChange={(newRole) => handleRoleUpdate(user.id, newRole)}
                    disabled={updateRole.isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {updateRole.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users?.length || 0} users
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManager;
