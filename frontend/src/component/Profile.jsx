import { useAuth } from "../state/AuthContext";
import { Navbar } from "./Navbar";

export default function Profile() {
  const { auth } = useAuth();

  if (!auth?.user) {
    return (
      <div className="container mt-5">
        <h2>No user data found ❌</h2>
        <p>Please login again.</p>
      </div>
    );
  }

  const { name, email, phone } = auth.user;

  return (
    <>
    <Navbar/>
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
  <div className="shadow-md rounded-2xl p-6 w-80 text-center">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
      👤
    </div>
    <h2 className="text-lg font-semibold mb-2">Profile</h2>
    <div className="text-sm text-gray-600 space-y-2">
      <p><span className="font-medium">Name:</span> {name}</p>
      <p><span className="font-medium">Email:</span> {email}</p>
      <p><span className="font-medium">Phone:</span> {phone}</p>
    </div>
  </div>
</div>
    </>
  );
}
