import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminHomePagePage() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/image/categories");
  }, []);
  return null;
}
