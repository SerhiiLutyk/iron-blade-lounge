import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "EN" | "RU" | "UK";

const dict = {
  EN: {
    nav_services: "Services", nav_barbers: "Barbers", nav_gallery: "Lookbook", nav_contact: "Contact",
    cta_book: "Book an Appointment", cta_login: "Login / Book Now", cta_logout: "Log out",
    hero_title: "Sharp Cuts. Straight Razors. Iron Standards.",
    hero_sub: "A members-club barbershop for the modern gentleman. Hand-crafted cuts, hot towel shaves, and timeless rituals.",
    section_services: "The Menu", section_services_sub: "Crafted services, honestly priced.",
    section_barbers: "Meet the Blades", section_barbers_sub: "Steady hands, sharp minds.",
    section_gallery: "The Lookbook", section_gallery_sub: "A record of the craft.",
    section_reviews: "Voices of the Lounge",
    footer_hours: "Hours", footer_visit: "Visit", footer_call: "Call",
    dashboard: "Dashboard", admin: "Admin",
    book_new: "New Appointment", book_step1: "Choose a Service", book_step2: "Choose your Barber",
    book_step3: "Pick a Date & Time", book_step4: "Confirm",
    next: "Continue", back: "Back", confirm: "Confirm Booking",
    my_appts: "My Appointments", profile: "Profile",
    upcoming: "Upcoming", past: "Past", cancel: "Cancel", cancel_disabled: "Cancellation window closed",
    loyalty: "Loyalty Points", vip: "VIP Member",
    sign_in: "Sign In", sign_up: "Sign Up", email: "Email", password: "Password",
    full_name: "Full Name", phone: "Phone",
    google: "Continue with Google",
    pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", noshow: "No-Show",
    minutes: "min",
  },
  RU: {
    nav_services: "Услуги", nav_barbers: "Барберы", nav_gallery: "Галерея", nav_contact: "Контакты",
    cta_book: "Записаться", cta_login: "Войти / Запись", cta_logout: "Выйти",
    hero_title: "Острые стрижки. Опасная бритва. Железные стандарты.",
    hero_sub: "Клубный барбершоп для современного джентльмена. Стрижки ручной работы, бритьё с горячим полотенцем и вечные ритуалы.",
    section_services: "Меню", section_services_sub: "Авторские услуги по честной цене.",
    section_barbers: "Наши мастера", section_barbers_sub: "Твёрдая рука, острый ум.",
    section_gallery: "Лукбук", section_gallery_sub: "Хроника ремесла.",
    section_reviews: "Голоса лаунжа",
    footer_hours: "Часы работы", footer_visit: "Адрес", footer_call: "Телефон",
    dashboard: "Кабинет", admin: "Админ",
    book_new: "Новая запись", book_step1: "Выберите услугу", book_step2: "Выберите барбера",
    book_step3: "Дата и время", book_step4: "Подтверждение",
    next: "Далее", back: "Назад", confirm: "Подтвердить",
    my_appts: "Мои визиты", profile: "Профиль",
    upcoming: "Предстоящие", past: "История", cancel: "Отменить", cancel_disabled: "Отмена недоступна",
    loyalty: "Бонусы", vip: "VIP клиент",
    sign_in: "Войти", sign_up: "Регистрация", email: "Email", password: "Пароль",
    full_name: "Имя", phone: "Телефон",
    google: "Войти через Google",
    pending: "Ожидание", confirmed: "Подтверждено", completed: "Завершено", cancelled: "Отменено", noshow: "Не явился",
    minutes: "мин",
  },
  UK: {
    nav_services: "Послуги", nav_barbers: "Барбери", nav_gallery: "Галерея", nav_contact: "Контакти",
    cta_book: "Записатися", cta_login: "Увійти / Запис", cta_logout: "Вийти",
    hero_title: "Гострі стрижки. Небезпечна бритва. Залізні стандарти.",
    hero_sub: "Клубний барбершоп для сучасного джентльмена. Стрижки ручної роботи, гоління гарячим рушником і вічні ритуали.",
    section_services: "Меню", section_services_sub: "Авторські послуги за чесною ціною.",
    section_barbers: "Наші майстри", section_barbers_sub: "Тверда рука, гострий розум.",
    section_gallery: "Лукбук", section_gallery_sub: "Хроніка ремесла.",
    section_reviews: "Голоси лаунжу",
    footer_hours: "Години роботи", footer_visit: "Адреса", footer_call: "Телефон",
    dashboard: "Кабінет", admin: "Адмін",
    book_new: "Новий запис", book_step1: "Оберіть послугу", book_step2: "Оберіть барбера",
    book_step3: "Дата та час", book_step4: "Підтвердження",
    next: "Далі", back: "Назад", confirm: "Підтвердити",
    my_appts: "Мої візити", profile: "Профіль",
    upcoming: "Майбутні", past: "Історія", cancel: "Скасувати", cancel_disabled: "Скасування недоступне",
    loyalty: "Бонуси", vip: "VIP клієнт",
    sign_in: "Увійти", sign_up: "Реєстрація", email: "Email", password: "Пароль",
    full_name: "Ім'я", phone: "Телефон",
    google: "Увійти через Google",
    pending: "Очікує", confirmed: "Підтверджено", completed: "Завершено", cancelled: "Скасовано", noshow: "Не з'явився",
    minutes: "хв",
  },
} as const;

export type DictKey = keyof typeof dict.EN;

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "EN", setLang: () => {}, t: (k) => String(k),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("EN");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved && ["EN", "RU", "UK"].includes(saved)) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const t = (k: DictKey) => dict[lang][k] ?? String(k);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);