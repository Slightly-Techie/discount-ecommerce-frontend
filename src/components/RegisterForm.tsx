import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegister } from "@/hooks/useAuth";
import { AlertCircle, Loader2 } from "lucide-react";
import { apiFormErrors, formFieldErrors } from "@/lib/apiErrors";
import { normalizePhone, passwordError, phoneError } from "@/lib/registration";
import { Link } from "react-router-dom";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface RegisterFormProps {
  /** When true, render only the form (no card wrapper) for embedding in custom layouts */
  embedded?: boolean;
}

// API field name → this form's state key.
const API_TO_FORM_FIELD: Record<string, string> = {
  first_name: "firstname",
  last_name: "lastname",
  username: "username",
  email: "email",
  password: "password",
  phonenumber: "phonenumber",
  date_of_birth: "date_of_birth",
  gender: "gender",
};

export function RegisterForm({ embedded }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    phonenumber: "",
    username: "",
    firstname: "",
    lastname: "", 
    password: "",
    date_of_birth: "",
    gender: "",
    role: "customer",
    metadata: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const registerMutation = useRegister();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = "First name is required";
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    const phoneProblem = phoneError(formData.phonenumber);
    if (phoneProblem) {
      newErrors.phonenumber = phoneProblem;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    const passwordProblem = passwordError(formData.password);
    if (passwordProblem) {
      newErrors.password = passwordProblem;
    }

    if (!formData.date_of_birth.trim()) {
      newErrors.date_of_birth = "Date of birth is required";
    }

    if (!formData.gender.trim()) {
      newErrors.gender = "Gender is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await registerMutation.mutateAsync({
        first_name: formData.firstname,
        last_name: formData.lastname,
        username: formData.username,
        phonenumber: normalizePhone(formData.phonenumber),
        email: formData.email.trim(),
        password: formData.password,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        role: formData.role,
        metadata: formData.metadata,
      });
    } catch (error) {
      // The mutation's onError shows a toast; here we put each API message
      // under the field it belongs to, so people know exactly what to fix.
      const { fields, general } = formFieldErrors(apiFormErrors(error), API_TO_FORM_FIELD);
      setErrors(fields);
      setFormError(general);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              value={formData.firstname}
              onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
              placeholder="Enter your first name"
              className={errors.firstname ? "border-red-500" : ""}
            />
            {errors.firstname && (
              <p className="text-sm text-red-500 mt-1">{errors.firstname}</p>
            )}
          </div>

          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              value={formData.lastname}
              onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
              placeholder="Enter your last name"
              className={errors.lastname ? "border-red-500" : ""}
            />
            {errors.lastname && (
              <p className="text-sm text-red-500 mt-1">{errors.lastname}</p>
            )}
          </div>

          <div>
              <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              className={errors.username ? "border-red-500" : ""}
            />
            {errors.username && (
              <p className="text-sm text-red-500 mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              autoComplete="email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phonenumber">Phone Number</Label>
            <Input
              id="phonenumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phonenumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phonenumber: e.target.value }))}
              placeholder="e.g. 0241234567"
              className={errors.phonenumber ? "border-red-500" : ""}
            />
              {errors.phonenumber && (
              <p className="text-sm text-red-500 mt-1">{errors.phonenumber}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              placeholder="Enter your date of birth"
              className={errors.date_of_birth ? "border-red-500" : ""}
            />
            {errors.date_of_birth && (
              <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p> 
            )}
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}

            >
              <SelectTrigger id="gender" className={errors.gender ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
            )}
          </div>
          {formError && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}
            <Button 
            type="submit" 
            className="w-full" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
} 