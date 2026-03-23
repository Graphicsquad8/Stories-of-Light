import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin" || user.role === "moderator") {
        navigate("/image");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, authLoading, navigate]);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const googleEnabled = settings?.googleLoginEnabled !== "false" && !!settings?.googleClientId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center mx-auto mb-4 cursor-pointer">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-serif text-2xl font-bold" data-testid="text-login-title">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Log in to Stories of Light</p>
        </div>

        {googleEnabled && (
          <>
            <a href="/auth/google" data-testid="button-google-login">
              <Button variant="outline" className="w-full flex items-center gap-2 mb-4" type="button">
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </Button>
            </a>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Log In
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline" data-testid="link-signup">
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
}
