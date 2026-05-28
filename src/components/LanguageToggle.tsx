import { Globe } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const langs: Lang[] = ["EN", "RU", "UK"];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-foreground hover:text-gold">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium tracking-wider">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {langs.map((l) => (
          <DropdownMenuItem key={l} onClick={() => setLang(l)} className={l === lang ? "text-gold" : ""}>
            {l}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}