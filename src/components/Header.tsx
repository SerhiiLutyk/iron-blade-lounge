import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LogOut, Scissors, LayoutDashboard, Shield } from "lucide-react";

export function Header() {
  const { t } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <Scissors className="h-5 w-5 text-gold transition-transform group-hover:rotate-12" />
          <span className="font-serif text-xl tracking-wide">
            Iron <span className="text-gold">&</span> Blade
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="/#services" className="hover:text-gold transition-colors">{t("nav_services")}</a>
          <a href="/#barbers" className="hover:text-gold transition-colors">{t("nav_barbers")}</a>
          <a href="/#gallery" className="hover:text-gold transition-colors">{t("nav_gallery")}</a>
          <a href="/#contact" className="hover:text-gold transition-colors">{t("nav_contact")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin" })} className="gap-1">
                  <Shield className="h-4 w-4" /> {t("admin")}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })} className="gap-1">
                <LayoutDashboard className="h-4 w-4" /> {t("dashboard")}
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/auth" })} className="bg-gold text-gold-foreground hover:bg-gold/90 font-medium">
              {t("cta_login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}