import { RegisterForm } from "@/components/RegisterForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Register() {
  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={0} favoritesCount={0} />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Join us to start saving on amazing deals
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </main>

      <Footer />
    </div>
  );
} 