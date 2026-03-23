import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import ProfilePage from "./profile";

export default function BookmarksPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (!isLoading && !user) {
    navigate("/login");
    return null;
  }

  return <ProfilePage />;
}
