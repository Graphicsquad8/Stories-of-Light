import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FcGoogle } from "react-icons/fc";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const googleEnabled = settings?.googleLoginEnabled !== "false";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast({ title: "Welcome!", description: "Your account has been created." });
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.message || "Signup failed";
      let description = "Something went wrong";
      try {
        const parsed = JSON.parse(msg.replace(/^\d+:\s*/, ""));
        description = parsed.message || description;
      } catch {
        description = msg.replace(/^\d+:\s*/, "");
      }
      toast({ title: "Signup Failed", description, variant: "destructive" });
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
          <h1 className="font-serif text-2xl font-bold" data-testid="text-signup-title">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join Stories of Light</p>
        </div>

        {googleEnabled && (
          <>
            <a href="/auth/google" data-testid="button-google-signup">
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
                <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              data-testid="input-name"
            />
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              data-testid="input-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sign Up
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
            Log In
          </Link>
        </p>
      </Card>
    </div>
  );
}
