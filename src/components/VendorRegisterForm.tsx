import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVendorSignup } from '@/hooks/useVendors';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VendorRegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    phonenumber: '',
    password: '',
    first_name: '',
    last_name: '',
    vendor_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const signup = useVendorSignup();

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.first_name.trim()) next.first_name = 'First name is required';
    if (!formData.last_name.trim()) next.last_name = 'Last name is required';
    if (!formData.vendor_name.trim()) next.vendor_name = 'Business / vendor name is required';
    if (!formData.phonenumber.trim()) next.phonenumber = 'Phone number is required';
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) next.email = 'Please enter a valid email';
    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await signup.mutateAsync(formData);
    } catch {
      // Handled in hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vendor_first_name">First name</Label>
          <Input
            id="vendor_first_name"
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
            placeholder="First name"
            className={errors.first_name ? 'border-red-500' : ''}
          />
          {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>}
        </div>
        <div>
          <Label htmlFor="vendor_last_name">Last name</Label>
          <Input
            id="vendor_last_name"
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
            placeholder="Last name"
            className={errors.last_name ? 'border-red-500' : ''}
          />
          {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="vendor_name">Business / vendor name</Label>
        <Input
          id="vendor_name"
          type="text"
          value={formData.vendor_name}
          onChange={(e) => setFormData((p) => ({ ...p, vendor_name: e.target.value }))}
          placeholder="Your store or business name"
          className={errors.vendor_name ? 'border-red-500' : ''}
        />
        {errors.vendor_name && <p className="text-sm text-red-500 mt-1">{errors.vendor_name}</p>}
      </div>

      <div>
        <Label htmlFor="vendor_email">Email</Label>
        <Input
          id="vendor_email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="vendor_phonenumber">Phone number</Label>
        <Input
          id="vendor_phonenumber"
          type="text"
          value={formData.phonenumber}
          onChange={(e) => setFormData((p) => ({ ...p, phonenumber: e.target.value }))}
          placeholder="+1234567890"
          className={errors.phonenumber ? 'border-red-500' : ''}
        />
        {errors.phonenumber && <p className="text-sm text-red-500 mt-1">{errors.phonenumber}</p>}
      </div>

      <div>
        <Label htmlFor="vendor_password">Password</Label>
        <Input
          id="vendor_password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
          placeholder="At least 6 characters"
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={signup.isPending}>
        {signup.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          'Submit vendor registration'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
