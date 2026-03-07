import { useState } from 'react';
import { RegisterForm } from '@/components/RegisterForm';
import { VendorRegisterForm } from '@/components/VendorRegisterForm';
import { Layout } from '@/components/Layout';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, User } from 'lucide-react';
import { Link } from 'react-router-dom';

type RoleChoice = 'customer' | 'vendor' | null;

export default function Register() {
  const [role, setRole] = useState<RoleChoice>(null);

  return (
    <Layout>
      <main className="min-h-[calc(100vh-var(--header-height,4rem))] relative overflow-hidden">
        {/* Futuristic background */}
        <div
          className="absolute inset-0 -z-10"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80" />
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem))]">
          {/* Glassmorphic card */}
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 md:p-10"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
          >
            {role === null ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Create account
                  </h1>
                  <p className="text-slate-400 mt-2 text-sm md:text-base">
                    Join as a customer or register your business as a vendor
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className="group relative flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-cyan-400/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 transition-colors group-hover:bg-cyan-500/30">
                      <User className="h-6 w-6" />
                    </span>
                    <span className="font-semibold text-white">I'm a Customer</span>
                    <span className="text-sm text-slate-400 text-center">
                      Shop deals and manage your orders
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('vendor')}
                    className="group relative flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-teal-400/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 transition-colors group-hover:bg-teal-500/30">
                      <Store className="h-6 w-6" />
                    </span>
                    <span className="font-semibold text-white">I'm a Vendor</span>
                    <span className="text-sm text-slate-400 text-center">
                      Sell products — approval required to start
                    </span>
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyan-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-teal-500 -ml-2"
                    onClick={() => setRole(null)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {role === 'customer' ? 'Customer registration' : 'Vendor registration'}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {role === 'customer'
                      ? 'Fill in your details to create an account'
                      : 'Your account will be active after admin approval'}
                  </p>
                </div>

                <div className="[&_.border-red-500]:border-red-400 [&_input]:bg-white/5 [&_input]:border-white/10 [&_input::placeholder]:text-slate-500 [&_label]:text-slate-300 [&_p]:text-red-400">
                  {role === 'customer' ? <RegisterForm embedded /> : <VendorRegisterForm />}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
