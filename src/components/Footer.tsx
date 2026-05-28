import { Scissors, MapPin, Phone, Clock, Instagram } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer id="contact" className="border-t border-border bg-card/30 mt-24">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="h-5 w-5 text-gold" />
            <span className="font-serif text-xl">Iron <span className="text-gold">&</span> Blade</span>
          </div>
          <p className="text-sm text-muted-foreground">A members-club barbershop. Crafted with iron, finished with a blade.</p>
          <a href="https://instagram.com" className="inline-flex items-center gap-2 mt-4 text-sm hover:text-gold">
            <Instagram className="h-4 w-4" /> @ironandblade
          </a>
        </div>
        <div>
          <h4 className="font-serif text-gold mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> {t("footer_visit")}</h4>
          <p className="text-sm text-muted-foreground">14 Forge Street<br />Old Town, Floor 2</p>
        </div>
        <div>
          <h4 className="font-serif text-gold mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> {t("footer_call")}</h4>
          <p className="text-sm text-muted-foreground">+1 (555) 240-9000</p>
        </div>
        <div>
          <h4 className="font-serif text-gold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> {t("footer_hours")}</h4>
          <p className="text-sm text-muted-foreground">Mon–Fri · 10:00 — 21:00<br />Sat · 09:00 — 20:00<br />Sun · 11:00 — 18:00</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Iron & Blade Grooming Lounge
      </div>
    </footer>
  );
}