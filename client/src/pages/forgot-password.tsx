import { useState, useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, ArrowLeft, CheckCircle, Mail, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      e.preventDefault();
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setStep("otp");
      toast({ title: "Code sent", description: "Check your email for the 6-digit verification code." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not send code. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast({ title: "Enter the full 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/verify-otp", { email, otp: code });
      setStep("password");
    } catch (err: any) {
      toast({ title: "Incorrect code", description: err.message || "Check the code and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { email, otp: otp.join(""), password: newPassword });
      setStep("done");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reset password.", variant: "destructive" });
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
          <h1 className="font-serif text-2xl font-bold" data-testid="text-forgot-title">
            {step === "email" && "Reset Password"}
            {step === "otp" && "Enter Verification Code"}
            {step === "password" && "Create New Password"}
            {step === "done" && "Password Reset"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "otp" && `A 6-digit code was sent to ${email}`}
            {step === "password" && "Choose a new password for your account"}
            {step === "done" && "Your password has been updated successfully"}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={sendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </Label>
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
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-send-code">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Verification Code
            </Button>
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full" type="button" data-testid="button-back-login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Verification Code
              </Label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid={`input-otp-${i}`}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); }}
                  className="text-primary hover:underline"
                  data-testid="button-resend-code"
                >
                  Send again
                </button>
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.join("").length < 6} data-testid="button-verify-otp">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify Code
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="pr-10"
                  data-testid="input-new-password"
                />
                <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  className="pr-10"
                  data-testid="input-confirm-password"
                />
                <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirm(s => !s)}>
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-reset-password">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Set New Password
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground" data-testid="text-reset-done">
              Your password has been reset. You can now log in with your new password.
            </p>
            <Link href="/login">
              <Button className="w-full" data-testid="button-go-login">
                Go to Login
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
