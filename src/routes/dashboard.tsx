import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO, differenceInHours } from "date-fns";
import { toast } from "sonner";
import { Crown, Plus, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { BookingWizard } from "@/components/BookingWizard";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("bookings")
      .select("*, services(name, price), barbers(name)")
      .eq("user_id", user!.id).order("appointment_date", { ascending: false })).data ?? [],
  });

  // Realtime: notify on completion
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("user-bookings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { status: string };
          if (n.status === "Completed") toast.success("Thanks for visiting! You earned points.");
          qc.invalidateQueries({ queryKey: ["my-bookings"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(`${b.appointment_date}T${b.appointment_time}`) >= now && !["Cancelled", "Completed", "No-Show"].includes(b.status));
  const past = bookings.filter((b) => !upcoming.includes(b));

  const cancel = async (id: string, when: Date) => {
    if (differenceInHours(when, now) < 24) { toast.error(t("cancel_disabled")); return; }
    await supabase.from("bookings").update({ status: "Cancelled" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-bookings"] });
    toast.success("Cancelled");
  };

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("profiles").update({
      full_name: String(fd.get("full_name") || ""),
      phone_number: String(fd.get("phone") || ""),
    }).eq("id", user!.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["profile"] }); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const pts = profile?.loyalty_points ?? 0;
  const isVip = pts > 500;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="vintage-card p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</p>
              <h1 className="font-serif text-3xl mt-1">{profile?.full_name ?? user.email}</h1>
            </div>
            <div className="flex items-center gap-3">
              {isVip && <Badge className="bg-gold text-gold-foreground gap-1"><Crown className="h-3 w-3" /> {t("vip")}</Badge>}
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("loyalty")}</div>
                <div className="font-serif text-3xl text-gold">{pts}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <Tabs defaultValue="appts">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="appts">{t("my_appts")}</TabsTrigger>
              <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
            </TabsList>
            <Button onClick={() => setWizardOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1">
              <Plus className="h-4 w-4" /> {t("book_new")}
            </Button>
          </div>

          <TabsContent value="appts" className="space-y-6">
            <Section title={t("upcoming")}>
              {upcoming.length === 0 && <Empty />}
              {upcoming.map((b) => {
                const when = new Date(`${b.appointment_date}T${b.appointment_time}`);
                return (
                  <Card key={b.id} className="vintage-card p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-serif text-lg">{b.services?.name}</div>
                      <div className="text-sm text-muted-foreground">{b.barbers?.name} · {format(when, "EEE, MMM d · HH:mm")}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-gold/40 text-gold">{b.status}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => cancel(b.id, when)}>{t("cancel")}</Button>
                    </div>
                  </Card>
                );
              })}
            </Section>
            <Section title={t("past")}>
              {past.length === 0 && <Empty />}
              {past.map((b) => (
                <Card key={b.id} className="vintage-card p-4 flex items-center justify-between flex-wrap gap-3 opacity-80">
                  <div>
                    <div className="font-serif">{b.services?.name}</div>
                    <div className="text-xs text-muted-foreground">{b.barbers?.name} · {format(parseISO(b.appointment_date), "MMM d, yyyy")}</div>
                  </div>
                  <Badge variant="outline">{b.status}</Badge>
                </Card>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="vintage-card p-6 max-w-md">
              <form onSubmit={saveProfile} className="space-y-4">
                <div><Label>{t("full_name")}</Label><Input name="full_name" defaultValue={profile?.full_name ?? ""} /></div>
                <div><Label>{t("phone")}</Label><Input name="phone" defaultValue={profile?.phone_number ?? ""} /></div>
                <div><Label>{t("email")}</Label><Input value={user.email ?? ""} disabled /></div>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90">Save</Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{t("book_new")}</DialogTitle></DialogHeader>
          <BookingWizard onDone={() => setWizardOpen(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-xl text-gold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" /> {title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Empty() {
  return <p className="text-sm text-muted-foreground italic">No appointments here yet.</p>;
}