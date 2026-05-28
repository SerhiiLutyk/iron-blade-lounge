import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Instagram, ArrowRight, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Landing });

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

function Landing() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const goBook = () => navigate({ to: user ? "/dashboard" : "/auth" });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").order("category");
      return data ?? [];
    },
  });
  const { data: barbers } = useQuery({
    queryKey: ["barbers"],
    queryFn: async () => (await supabase.from("barbers").select("*")).data ?? [],
  });
  const { data: gallery } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await supabase.from("gallery").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const grouped = (services ?? []).reduce<Record<string, typeof services>>((acc, s) => {
    (acc[s.category] ||= [] as never).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1920&q=80)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="relative container mx-auto px-4 py-32 md:py-48 max-w-4xl text-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Est. 2019 · Grooming Lounge</p>
            <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-6">
              {t("hero_title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">{t("hero_sub")}</p>
            <Button size="lg" onClick={goBook} className="bg-gold text-gold-foreground hover:bg-gold/90 font-medium tracking-wide px-8 h-12">
              {t("cta_book")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* SERVICES MENU */}
      <section id="services" className="container mx-auto px-4 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">— Menu —</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-2">{t("section_services")}</h2>
          <p className="text-muted-foreground">{t("section_services_sub")}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(["Hair", "Beard", "Combo"] as const).map((cat) => (
            <motion.div key={cat} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <Card className="vintage-card p-6 h-full">
                <h3 className="font-serif text-2xl text-gold mb-1">{cat}</h3>
                <div className="gold-divider mb-5" />
                <ul className="space-y-4">
                  {(grouped[cat] ?? []).map((s) => (
                    <li key={s.id} className="flex justify-between gap-3 text-sm">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.duration_minutes} {t("minutes")}</div>
                      </div>
                      <div className="text-gold font-serif text-lg whitespace-nowrap">${Number(s.price).toFixed(0)}</div>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BARBERS */}
      <section id="barbers" className="container mx-auto px-4 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">— Crew —</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-2">{t("section_barbers")}</h2>
          <p className="text-muted-foreground">{t("section_barbers_sub")}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(barbers ?? []).map((b, i) => (
            <motion.div key={b.id} initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.1 }}>
              <Card className="vintage-card overflow-hidden group">
                <div className="aspect-[4/5] overflow-hidden">
                  {b.avatar_url && (
                    <img src={b.avatar_url} alt={b.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl">{b.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">{b.bio}</p>
                  {b.instagram_handle && (
                    <a href={`https://instagram.com/${b.instagram_handle}`}
                       className="inline-flex items-center gap-2 text-xs text-gold hover:underline">
                      <Instagram className="h-3 w-3" /> @{b.instagram_handle}
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="container mx-auto px-4 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">— Portfolio —</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-2">{t("section_gallery")}</h2>
          <p className="text-muted-foreground">{t("section_gallery_sub")}</p>
        </motion.div>
        <div className="columns-2 md:columns-4 gap-4 max-w-6xl mx-auto [&>*]:mb-4">
          {(gallery ?? []).map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="break-inside-avoid overflow-hidden rounded-md border border-border group relative">
              <img src={g.image_url} alt={g.title ?? "Lookbook"} className="w-full grayscale group-hover:grayscale-0 transition-all duration-500" />
              {g.title && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gold tracking-wider uppercase">{g.title}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container mx-auto px-4 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">— Reviews —</p>
          <h2 className="font-serif text-4xl md:text-5xl">{t("section_reviews")}</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { q: "The most precise fade I've ever had. The hot towel ritual alone is worth it.", a: "— James R." },
            { q: "Feels like stepping into a 1920s gentleman's club. Theo is an artist.", a: "— Andriy K." },
            { q: "My monthly ritual. Marcus knows my cut before I sit down.", a: "— Dmitri S." },
          ].map((r, i) => (
            <motion.div key={i} initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.1 }}>
              <Card className="vintage-card p-6 h-full">
                <Quote className="h-6 w-6 text-gold mb-3" />
                <p className="italic text-foreground/90 mb-4">{r.q}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.a}</span>
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
