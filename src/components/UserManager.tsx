import { useUsers } from "@/hooks/useUsers";
import { Select } from "@radix-ui/react-select";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { User } from "@/types/api";

const UserManager = () => {
  const { data: users } = useUsers();
  console.log("Users",users);
//   const updateRole = useUpdateUserRole();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user: User) => (
            <div key={user.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <p className="font-semibold">{user.email}</p>
                <p className="text-sm text-muted-foreground">Role: {user.role}</p>
              </div>
              <p>thitis </p>
              {/* <Select
                options={[
                  { value: "user", label: "User" },
                  { value: "admin", label: "Admin" },
                ]}
                value={{ value: user.role, label: user.role }}
                onChange={(selected) => updateRole.mutate({ id: user.id, role: selected?.value })}
              /> */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManager;
