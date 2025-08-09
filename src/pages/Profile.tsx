import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsAuthenticated, authKeys } from "@/hooks/useAuth";
import { useUpdateCurrentUser, useUpdateProfile, useUpdateProfileMultipart } from "@/hooks/useUsers";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

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
  profile_image?: string; // holds preview URL for UI only
}

export default function Profile() {
  const { isAuthenticated, user, isLoading } = useIsAuthenticated();
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateUser = useUpdateCurrentUser();
  const updateProfile = useUpdateProfile();
  const updateProfileMultipart = useUpdateProfileMultipart();
  const queryClient = useQueryClient();

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Create a local preview URL; actual file will be sent to backend
    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setForm((f) => ({ ...f, profile_image: previewUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setUploading(true);
      // Update top-level fields first
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

      // Ensure we have the profile id
      let profileId = (user as any)?.profile?.id as string | undefined;
      if (!profileId) {
        const refreshedUser = await queryClient.fetchQuery({ queryKey: authKeys.user });
        profileId = (refreshedUser as any)?.profile?.id;
      }

      if (profileId) {
        if (profileImageFile) {
          // Send multipart including bio/website and file as profile_image
          const fd = new FormData();
          fd.append('bio', form.bio || '');
          fd.append('website', form.website || '');
          fd.append('profile_image', profileImageFile);
          await updateProfileMultipart.mutateAsync({ profileId, formData: fd });
        } else {
          // Only text fields
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                <p className="text-sm text-muted-foreground">Upload a new profile photo (optional)</p>
                {uploading && <p className="text-xs text-muted-foreground">Saving...</p>}
              </div>
              <input id="profile_image_input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" value={form.username} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="phonenumber">Phone number</Label>
                  <Input id="phonenumber" name="phonenumber" value={form.phonenumber} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <Input id="date_of_birth" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input id="gender" name="gender" value={form.gender} onChange={handleChange} placeholder="male | female | other" />
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 