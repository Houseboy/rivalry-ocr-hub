import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Trophy, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Separator } from "../components/ui/separator";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);

      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success!",
          description: "Account created successfully. You can now sign in.",
        });
        // Auto-switch to login tab
        document.querySelector<HTMLButtonElement>('[value="login"]')?.click();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Email or password is incorrect. Please try again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a link to reset your password",
      });
      setIsForgotPassword(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAuthForm = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsForgotPassword(true)}
          className="text-sm text-muted-foreground hover:underline"
        >
          Forgot password?
        </button>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium">Reset Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-email"
            placeholder="name@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsForgotPassword(false)}
            disabled={loading}
          >
            Back to Login
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </div>
      </div>
    </form>
  );

  const renderSocialLogins = () => (
    <div className="space-y-4">
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="p-6">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <Trophy className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="text-muted-foreground">Sign in to your account</p>
              </div>
              {isForgotPassword ? renderForgotPassword() : renderAuthForm()}
              {!isForgotPassword && (
                <>
                  <p className="px-8 text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="underline underline-offset-4 hover:text-primary"
                      onClick={() => {
                        const signUpTab = document.querySelector('[value="signup"]') as HTMLButtonElement;
                        signUpTab?.click();
                      }}
                    >
                      Sign up
                    </button>
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signup" className="p-6">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <Trophy className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Create an account</h2>
                <p className="text-muted-foreground">Enter your details to get started</p>
              </div>
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      placeholder="Password (min 6 characters)"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
              
              {renderSocialLogins()}
              
              <p className="px-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-primary"
                  onClick={() => {
                    const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
                    loginTab?.click();
                  }}
                >
                  Sign in
                </button>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
