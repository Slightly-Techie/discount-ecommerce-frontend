import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsAuthenticated, authKeys } from "@/hooks/useAuth";
import { useUpdateCurrentUser, useUpdateProfile, useUpdateProfileMultipart, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/useUsers";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Trash } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const addresses: AddressForm[] = ((user as any)?.addresses || []) as any;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Avatar section */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.profile_image} alt={form.first_name || form.username} />
                  <AvatarFallback>{(form.first_name || form.username || 'U').slice(0,1)}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow hover:opacity-90"
                  title="Change photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manage your personal info and saved addresses below.</p>
                {uploading && <p className="text-xs text-muted-foreground">Saving...</p>}
              </div>
              <input id="profile_image_input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2">
              <Button variant={activeTab==='personal' ? 'default' : 'outline'} onClick={() => setActiveTab('personal')}>Personal Info</Button>
              <Button variant={activeTab==='addresses' ? 'default' : 'outline'} onClick={() => setActiveTab('addresses')}>Addresses</Button>
            </div>

            {activeTab === 'personal' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First name</Label>
                    <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last name</Label>
                    <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" value={form.username} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="phonenumber">Phone number</Label>
                    <Input id="phonenumber" name="phonenumber" value={form.phonenumber} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of birth</Label>
                    <Input id="date_of_birth" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" name="gender" value={form.gender} onChange={handleChange} placeholder="male | female | other" required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" name="bio" value={form.bio} onChange={handleChange} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" value={form.website} onChange={handleChange} />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="submit" disabled={updateUser.isPending || updateProfile.isPending || uploading || updateProfileMultipart.isPending}>
                    {updateUser.isPending || updateProfile.isPending || uploading || updateProfileMultipart.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Existing addresses */}
                <div className="space-y-3">
                  {(addresses || []).map((addr) => (
                    <div key={addr.id} className="border rounded p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                        <div className="text-sm text-muted-foreground">
                          {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code ? `- ${addr.postal_code}` : ''}, {addr.country}
                        </div>
                        {addr.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!addr.is_default && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefault(addr.id!)}>Set Default</Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAddress(addr.id!)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!addresses || addresses.length === 0) && (
                    <div className="text-sm text-muted-foreground">No saved addresses yet.</div>
                  )}
                </div>

                {/* Add new address */}
                <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Address line 1</Label>
                    <Input value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address line 2</Label>
                    <Input value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                  </div>
                  <div>
                    <Label>Postal code</Label>
                    <Input value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} required />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input id="is_default" type="checkbox" checked={!!addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
                    <Label htmlFor="is_default">Set as default</Label>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={createAddress.isPending}>{createAddress.isPending ? 'Adding...' : 'Add Address'}</Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 