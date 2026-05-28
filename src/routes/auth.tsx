import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")), password: String(form.get("password")),
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back."); navigate({ to: "/dashboard" }); }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: String(form.get("full_name") || ""),
          phone_number: String(form.get("phone") || ""),
        },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created. Check your email to confirm."); }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">
        <a href="/" className="flex items-center justify-center gap-2 mb-8">
          <Scissors className="h-6 w-6 text-gold" />
          <span className="font-serif text-2xl">Iron <span className="text-gold">&</span> Blade</span>
        </a>
        <Card className="vintage-card p-8">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{t("sign_in")}</TabsTrigger>
              <TabsTrigger value="signup">{t("sign_up")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div><Label>{t("email")}</Label><Input name="email" type="email" required /></div>
                <div><Label>{t("password")}</Label><Input name="password" type="password" required /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                  {t("sign_in")}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div><Label>{t("full_name")}</Label><Input name="full_name" required /></div>
                <div><Label>{t("phone")}</Label><Input name="phone" type="tel" /></div>
                <div><Label>{t("email")}</Label><Input name="email" type="email" required /></div>
                <div><Label>{t("password")}</Label><Input name="password" type="password" required minLength={6} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                  {t("sign_up")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="my-6 gold-divider" />
          <Button variant="outline" onClick={handleGoogle} className="w-full border-gold/40 hover:bg-gold/10">
            {t("google")}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}