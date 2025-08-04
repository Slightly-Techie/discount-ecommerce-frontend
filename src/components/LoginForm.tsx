import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useLogin();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
        redirectTo,
      });
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 