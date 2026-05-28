import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "No-Show"] as const;

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: barbers = [] } = useQuery({
    queryKey: ["barbers-admin"],
    queryFn: async () => (await supabase.from("barbers").select("*")).data ?? [],
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services-admin"],
    queryFn: async () => (await supabase.from("services").select("*").order("category")).data ?? [],
  });
  const { data: todays = [] } = useQuery({
    queryKey: ["todays", today],
    queryFn: async () => (await supabase.from("bookings")
      .select("*, services(name, price), barbers(name), profiles(full_name)")
      .eq("appointment_date", today).order("appointment_time")).data ?? [],
  });
  const { data: recent = [] } = useQuery({
    queryKey: ["recent-bookings"],
    queryFn: async () => (await supabase.from("bookings")
      .select("appointment_date, status, services(price), barbers(name)")
      .gte("appointment_date", format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd"))).data ?? [],
  });

  const updateStatus = async (id: string, status: typeof STATUSES[number]) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["todays"] }); qc.invalidateQueries({ queryKey: ["recent-bookings"] }); }
  };

  const addBarber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("avatar") as File | null;
    let avatar_url: string | null = null;
    if (file && file.size) {
      const path = `barbers/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("avatars").upload(path, file);
      if (up.error) { toast.error(up.error.message); return; }
      avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("barbers").insert({
      name: String(fd.get("name")), bio: String(fd.get("bio") || ""),
      instagram_handle: String(fd.get("ig") || ""), avatar_url,
    });
    if (error) toast.error(error.message);
    else { toast.success("Barber added"); qc.invalidateQueries({ queryKey: ["barbers-admin"] }); (e.target as HTMLFormElement).reset(); }
  };

  const addService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("services").insert({
      name: String(fd.get("name")),
      category: fd.get("category") as "Hair" | "Beard" | "Combo",
      price: Number(fd.get("price")), duration_minutes: Number(fd.get("duration")),
    });
    if (error) toast.error(error.message);
    else { toast.success("Service added"); qc.invalidateQueries({ queryKey: ["services-admin"] }); (e.target as HTMLFormElement).reset(); }
  };

  const uploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `gallery/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("gallery").upload(path, file);
    if (up.error) { toast.error(up.error.message); return; }
    const url = supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
    await supabase.from("gallery").insert({ image_url: url, title: file.name });
    toast.success("Photo added");
  };

  // Analytics
  const revenueByBarber = barbers.map((b) => ({
    name: b.name.split(" ")[0],
    revenue: recent.filter((r) => r.status === "Completed" && r.barbers?.name === b.name)
      .reduce((sum, r) => sum + Number(r.services?.price ?? 0), 0),
  }));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(new Date(Date.now() - (6 - i) * 86400000), "yyyy-MM-dd");
    return { date: format(new Date(d), "MMM d"), bookings: recent.filter((r) => r.appointment_date === d).length };
  });

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="font-serif text-4xl mb-2">Admin Console</h1>
        <p className="text-muted-foreground mb-8">Manage the lounge.</p>

        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="catalog">Services & Gallery</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-6">
            <h2 className="font-serif text-xl text-gold mb-4">Today · {format(new Date(), "EEEE, MMM d")}</h2>
            <div className="space-y-2">
              {todays.length === 0 && <p className="text-sm text-muted-foreground italic">No appointments today.</p>}
              {todays.map((b) => (
                <Card key={b.id} className="vintage-card p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-serif text-lg">{b.appointment_time?.slice(0,5)} · {b.profiles?.full_name ?? "Guest"}</div>
                    <div className="text-sm text-muted-foreground">{b.services?.name} with {b.barbers?.name}</div>
                  </div>
                  <Select defaultValue={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staff" className="mt-6 grid md:grid-cols-2 gap-6">
            <Card className="vintage-card p-6">
              <h3 className="font-serif text-lg text-gold mb-4">Add Barber</h3>
              <form onSubmit={addBarber} className="space-y-3">
                <div><Label>Name</Label><Input name="name" required /></div>
                <div><Label>Bio</Label><Input name="bio" /></div>
                <div><Label>Instagram</Label><Input name="ig" /></div>
                <div><Label>Avatar</Label><Input name="avatar" type="file" accept="image/*" /></div>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90">Add</Button>
              </form>
            </Card>
            <Card className="vintage-card p-6">
              <h3 className="font-serif text-lg text-gold mb-4">Current Staff</h3>
              <div className="space-y-2">
                {barbers.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-2 border border-border rounded">
                    {b.avatar_url && <img src={b.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />}
                    <span className="flex-1">{b.name}</span>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      await supabase.from("barbers").delete().eq("id", b.id);
                      qc.invalidateQueries({ queryKey: ["barbers-admin"] });
                    }}>Remove</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="mt-6 grid md:grid-cols-2 gap-6">
            <Card className="vintage-card p-6">
              <h3 className="font-serif text-lg text-gold mb-4">Add Service</h3>
              <form onSubmit={addService} className="space-y-3">
                <div><Label>Name</Label><Input name="name" required /></div>
                <div>
                  <Label>Category</Label>
                  <Select name="category" defaultValue="Hair">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hair">Hair</SelectItem>
                      <SelectItem value="Beard">Beard</SelectItem>
                      <SelectItem value="Combo">Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Price</Label><Input name="price" type="number" required /></div>
                  <div><Label>Minutes</Label><Input name="duration" type="number" required /></div>
                </div>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90">Add</Button>
              </form>
              <div className="mt-6">
                <h4 className="font-serif text-sm text-muted-foreground uppercase mb-2">Existing</h4>
                <ul className="text-sm space-y-1 max-h-[200px] overflow-auto">
                  {services.map((s) => (
                    <li key={s.id} className="flex justify-between border-b border-border py-1">
                      <span>{s.name}</span><span className="text-gold">${s.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card className="vintage-card p-6">
              <h3 className="font-serif text-lg text-gold mb-4">Add Gallery Photo</h3>
              <Input type="file" accept="image/*" onChange={uploadGallery} />
              <p className="text-xs text-muted-foreground mt-2">Photos appear in the public lookbook.</p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 grid md:grid-cols-2 gap-6">
            <Card className="vintage-card p-6">
              <h3 className="font-serif text-lg text-gold mb-4">Revenue per Barber (last 7 days)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByBarber}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.008 60)" />
                  <XAxis dataKey="name" stroke="oklch(0.68 0.012 60)" />
                  <YAxis stroke="oklch(0.68 0.012 60)" />
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.006 60)", border: "1px solid oklch(0.30 0.008 60)" }} />
                  <Bar dataKey="revenue" fill="oklch(0.78 0.135 82)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="vintage-card p-6">
              <h3 className="font-serif text-lg text-gold mb-4">Bookings (last 7 days)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={last7}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.008 60)" />
                  <XAxis dataKey="date" stroke="oklch(0.68 0.012 60)" />
                  <YAxis stroke="oklch(0.68 0.012 60)" />
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.006 60)", border: "1px solid oklch(0.30 0.008 60)" }} />
                  <Line type="monotone" dataKey="bookings" stroke="oklch(0.78 0.135 82)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}