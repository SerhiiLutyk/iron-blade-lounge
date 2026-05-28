import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, addDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Scissors, User, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Service = { id: string; name: string; price: number; duration_minutes: number; category: string };
type Barber = { id: string; name: string; avatar_url: string | null };

const SLOTS = Array.from({ length: 22 }, (_, i) => {
  const minutes = 10 * 60 + i * 30; // 10:00 to 20:30
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
});

export function BookingWizard({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").order("category")).data as Service[] | null ?? [],
  });
  const { data: barbers } = useQuery({
    queryKey: ["barbers"],
    queryFn: async () => (await supabase.from("barbers").select("*")).data as Barber[] | null ?? [],
  });
  const { data: booked = [] } = useQuery({
    queryKey: ["booked", barber?.id, date],
    enabled: !!barber && !!date,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_booked_slots", { _barber_id: barber!.id, _date: date });
      return (data ?? []).map((r: { appointment_time: string }) => r.appointment_time.slice(0, 5));
    },
  });

  const dateOptions = Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i + 1), "yyyy-MM-dd"));

  const submit = async () => {
    if (!user || !service || !barber || !time) return;
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id, service_id: service.id, barber_id: barber.id,
      appointment_date: date, appointment_time: time + ":00", status: "Pending",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Appointment booked!");
    qc.invalidateQueries({ queryKey: ["my-bookings"] });
    onDone();
  };

  const steps = [
    { n: 1, label: t("book_step1"), icon: Scissors },
    { n: 2, label: t("book_step2"), icon: User },
    { n: 3, label: t("book_step3"), icon: CalendarIcon },
    { n: 4, label: t("book_step4"), icon: Check },
  ];

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
              step >= s.n ? "border-gold bg-gold text-gold-foreground" : "border-border text-muted-foreground"
            )}><s.icon className="h-4 w-4" /></div>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1 mx-2 transition-colors", step > s.n ? "bg-gold" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}>
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {(services ?? []).map((s) => (
                <Card key={s.id} onClick={() => { setService(s); setStep(2); }}
                  className={cn("vintage-card p-4 cursor-pointer hover:border-gold transition-all",
                    service?.id === s.id && "border-gold")}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs text-gold uppercase tracking-wider">{s.category}</div>
                      <div className="font-medium mt-1">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.duration_minutes} {t("minutes")}</div>
                    </div>
                    <div className="font-serif text-xl text-gold">${Number(s.price).toFixed(0)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="grid sm:grid-cols-3 gap-3">
              {(barbers ?? []).map((b) => (
                <Card key={b.id} onClick={() => { setBarber(b); setStep(3); }}
                  className={cn("vintage-card p-4 cursor-pointer hover:border-gold transition-all text-center",
                    barber?.id === b.id && "border-gold")}>
                  {b.avatar_url && <img src={b.avatar_url} alt={b.name} className="w-20 h-20 rounded-full mx-auto object-cover grayscale" />}
                  <div className="font-serif text-lg mt-3">{b.name}</div>
                </Card>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label>Date</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 mt-2 -mx-1 px-1">
                  {dateOptions.map((d) => (
                    <button key={d} onClick={() => { setDate(d); setTime(null); }}
                      className={cn("px-3 py-2 rounded border min-w-[64px] shrink-0 text-center transition-all",
                        date === d ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}>
                      <div className="text-xs uppercase">{format(parseISO(d), "EEE")}</div>
                      <div className="font-serif text-lg">{format(parseISO(d), "d")}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Time</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                  {SLOTS.map((s) => {
                    const taken = booked.includes(s);
                    return (
                      <button key={s} disabled={taken} onClick={() => setTime(s)}
                        className={cn("px-2 py-2 rounded border text-sm transition-all",
                          taken && "opacity-30 cursor-not-allowed line-through",
                          time === s ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4" />{t("back")}</Button>
                <Button disabled={!time} onClick={() => setStep(4)} className="bg-gold text-gold-foreground hover:bg-gold/90">
                  {t("next")} <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <Card className="vintage-card p-6 space-y-4">
              <h3 className="font-serif text-2xl text-gold">{t("book_step4")}</h3>
              <div className="gold-divider" />
              <Row label="Service" value={`${service?.name} · $${service?.price}`} />
              <Row label="Barber" value={barber?.name ?? ""} />
              <Row label="Date" value={format(parseISO(date), "EEEE, MMM d")} />
              <Row label="Time" value={time ?? ""} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4" />{t("back")}</Button>
                <Button onClick={submit} disabled={submitting} className="bg-gold text-gold-foreground hover:bg-gold/90">
                  {t("confirm")}
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// silence unused import warning
void parseISO;