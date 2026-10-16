import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsAuthenticated, useLogout, authKeys } from "@/hooks/useAuth";
import { useUpdateCurrentUser, useUpdateProfile, useUpdateProfileMultipart, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/useUsers";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, ChevronRight, Heart, LogOut, MapPin, Package, Settings, Store, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorMe } from "@/hooks/useVendors";
import { canAccessAdminPortal } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";

interface ProfileForm {
  email: string;
  phonenumber: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  bio?: string;
  website?: string;
  profile_image?: string; // preview
}

interface AddressForm {
  id?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
}

export default function Profile() {
  const { isAuthenticated, user, isLoading } = useIsAuthenticated();
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateUser = useUpdateCurrentUser();
  const updateProfile = useUpdateProfile();
  const updateProfileMultipart = useUpdateProfileMultipart();
  const createAddress = useCreateAddress();
  const logout = useLogout();
  const { data: vendor } = useVendorMe(isAuthenticated);
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'personal' | 'addresses'>('personal');

  const [form, setForm] = useState<ProfileForm>({
    email: "",
    phonenumber: "",
    username: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    bio: "",
    website: "",
    profile_image: "",
  });
  const [uploading, setUploading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const [addressForm, setAddressForm] = useState<AddressForm>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_default: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        email: user.email || "",
        phonenumber: user.phonenumber || "",
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        date_of_birth: (user as any)?.date_of_birth || "",
        gender: (user as any)?.gender || "",
        bio: (user as any)?.profile?.bio || "",
        website: (user as any)?.profile?.website || "",
        profile_image: (user as any)?.profile?.profile_image || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const triggerFilePicker = () => {
    const input = document.getElementById('profile_image_input') as HTMLInputElement | null;
    input?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setForm((f) => ({ ...f, profile_image: previewUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setUploading(true);
      await updateUser.mutateAsync({
        id: user.id,
        payload: {
          email: form.email,
          phonenumber: form.phonenumber,
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
        },
      });

      let profileId = (user as any)?.profile?.id as string | undefined;
      if (!profileId) {
        const refreshedUser = await queryClient.fetchQuery({ queryKey: authKeys.user });
        profileId = (refreshedUser as any)?.profile?.id;
      }

      if (profileId) {
        if (profileImageFile) {
          const fd = new FormData();
          fd.append('bio', form.bio || '');
          fd.append('website', form.website || '');
          fd.append('profile_image', profileImageFile);
          await updateProfileMultipart.mutateAsync({ profileId, formData: fd });
        } else {
          await updateProfile.mutateAsync({
            profileId,
            payload: { bio: form.bio || null, website: form.website || null },
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: authKeys.user });

      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Could not update profile.');
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetAddressForm = () => setAddressForm({ line1: "", line2: "", city: "", state: "", postal_code: "", country: "", is_default: false });

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAddress.mutateAsync({ ...addressForm });
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      resetAddressForm();
      toast({ title: 'Address added' });
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Could not add address.');
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateAddress.mutateAsync({ id, payload: { is_default: true } });
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      toast({ title: 'Default address set' });
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Could not update address.');
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      toast({ title: 'Address deleted' });
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Could not delete address.');
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Layout mobileBar={{ kind: "title", title: "Account" }}>
        <div aria-busy="true" className="container flex max-w-3xl flex-col gap-4 py-6">
          <div className="h-20 rounded-lg bg-skeleton" />
          <div className="h-64 rounded-lg bg-skeleton" />
        </div>
      </Layout>
    );
  }

  const addresses: AddressForm[] = ((user as any)?.addresses || []) as any;
  const saving = updateUser.isPending || updateProfile.isPending || uploading || updateProfileMultipart.isPending;
  const quickLinks = [
    { to: "/orders", label: "Your orders", icon: Package },
    { to: "/favorites", label: "Saved deals", icon: Heart },
    ...(vendor ? [{ to: "/vendor", label: "Vendor dashboard", icon: Store }] : []),
    ...(canAccessAdminPortal(user) ? [{ to: "/admin", label: "Admin dashboard", icon: Settings }] : []),
  ];

  return (
    <Layout mobileBar={{ kind: "title", title: "Account" }}>
      <div className="container flex max-w-3xl flex-col gap-5 pb-12 pt-4 lg:pt-8">
        <section aria-label="Your account" className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20">
              <AvatarImage src={form.profile_image} alt="" />
              <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">
                {(form.first_name || form.username || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={triggerFilePicker}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
            </button>
            <input id="profile_image_input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">
              {[form.first_name, form.last_name].filter(Boolean).join(" ") || form.username || "Your account"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{form.email}</p>
            {uploading && <p className="text-xs text-muted-foreground">Saving photo…</p>}
          </div>
        </section>

        <nav aria-label="Account shortcuts">
          <ul className="divide-y rounded-lg border">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="flex min-h-14 items-center gap-3 px-4 text-[15px] font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "personal" | "addresses")}>
          <TabsList aria-label="Account details">
            <TabsTrigger value="personal">Personal info</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "personal" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { id: "first_name", label: "First name", autoComplete: "given-name" },
                { id: "last_name", label: "Last name", autoComplete: "family-name" },
                { id: "username", label: "Username", autoComplete: "username" },
                { id: "email", label: "Email", type: "email", autoComplete: "email" },
                { id: "phonenumber", label: "Phone number", type: "tel", autoComplete: "tel" },
                { id: "date_of_birth", label: "Date of birth", type: "date", autoComplete: "bday" },
                { id: "gender", label: "Gender", placeholder: "male, female or other" },
              ].map((f) => (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <Label htmlFor={f.id} className="text-sm font-semibold">
                    {f.label}
                  </Label>
                  <Input
                    id={f.id}
                    name={f.id}
                    type={f.type || "text"}
                    autoComplete={f.autoComplete}
                    placeholder={f.placeholder}
                    value={String((form as unknown as Record<string, unknown>)[f.id] ?? "")}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="bio" className="text-sm font-semibold">Bio (optional)</Label>
                <Input id="bio" name="bio" value={form.bio} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="website" className="text-sm font-semibold">Website (optional)</Label>
                <Input id="website" name="website" type="url" inputMode="url" value={form.website} onChange={handleChange} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="self-end">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {(addresses || []).map((addr) => (
                <li key={addr.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="text-[15px]">
                      <p className="font-medium">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.city}
                        {addr.state ? `, ${addr.state}` : ""}
                        {addr.postal_code ? ` ${addr.postal_code}` : ""}
                        {addr.country ? `, ${addr.country}` : ""}
                      </p>
                      {addr.is_default && <Badge variant="confirmed" className="mt-1.5">Default</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!addr.is_default && (
                      <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id!)}>
                        Make default
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id!)} aria-label={`Delete address ${addr.line1}`} className="text-destructive hover:bg-destructive-subtle hover:text-destructive">
                      <Trash className="h-[18px] w-[18px]" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
              {(!addresses || addresses.length === 0) && (
                <li className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No saved addresses yet. Add one to place orders.</li>
              )}
            </ul>

            <form onSubmit={handleAddAddress} className="grid grid-cols-1 gap-4 rounded-lg border p-5 md:grid-cols-2">
              <h2 className="text-lg font-bold md:col-span-2">Add an address</h2>
              {[
                { key: "line1", label: "House, street and landmark", span: true, required: true, autoComplete: "address-line1" },
                { key: "line2", label: "More details (optional)", span: true, autoComplete: "address-line2" },
                { key: "city", label: "Town or city", required: true, autoComplete: "address-level2" },
                { key: "state", label: "Region", autoComplete: "address-level1" },
                { key: "postal_code", label: "GhanaPost GPS or postal code (optional)", autoComplete: "postal-code" },
                { key: "country", label: "Country", required: true, autoComplete: "country-name" },
              ].map((f) => (
                <div key={f.key} className={f.span ? "flex flex-col gap-1.5 md:col-span-2" : "flex flex-col gap-1.5"}>
                  <Label htmlFor={`addr-${f.key}`} className="text-sm font-semibold">
                    {f.label}
                  </Label>
                  <Input
                    id={`addr-${f.key}`}
                    autoComplete={f.autoComplete}
                    required={f.required}
                    value={String((addressForm as unknown as Record<string, unknown>)[f.key] ?? "")}
                    onChange={(e) => setAddressForm({ ...addressForm, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <label htmlFor="is_default" className="flex min-h-12 items-center gap-3 text-[15px] md:col-span-2">
                <Checkbox
                  id="is_default"
                  checked={!!addressForm.is_default}
                  onCheckedChange={(v) => setAddressForm({ ...addressForm, is_default: v === true })}
                />
                Use as my default delivery address
              </label>
              <Button type="submit" variant="outline" disabled={createAddress.isPending} className="md:col-span-2 md:justify-self-end">
                {createAddress.isPending ? "Adding…" : "Add address"}
              </Button>
            </form>
          </div>
        )}

        <Button variant="ghost" onClick={() => logout.mutate()} className="self-start text-destructive hover:bg-destructive-subtle hover:text-destructive">
          <LogOut aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </Layout>
  );
} 