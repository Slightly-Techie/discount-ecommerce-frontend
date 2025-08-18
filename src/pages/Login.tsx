import { LoginForm } from "@/components/LoginForm";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useLocation } from "react-router-dom";

export default function Login() {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  return (
    <Layout>
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              {from !== "/" ? `Sign in to access ${from}` : "Sign in to your account to continue shopping"}
            </p>
          </div>
          
          <LoginForm redirectTo={from} />
        </div>
      </main>

      <Footer />
    </Layout>
  );
} 