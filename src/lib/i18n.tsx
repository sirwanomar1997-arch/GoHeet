import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * GoHeet interface language.
 *
 * The app follows the phone/browser language automatically the first time it
 * opens, and the person can override it in Settings. Only interface text is
 * translated — people's own posts, names and messages stay exactly as written.
 * Legal documents and support replies stay in English so there is one binding
 * version, which is what every large platform does.
 */
export const LOCALES = [
  { code: "en", label: "English", native: "English" },
  { code: "sv", label: "Swedish", native: "Svenska" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "fa", label: "Persian", native: "فارسی" },
  { code: "he", label: "Hebrew", native: "עברית" },
  { code: "ku", label: "Kurdish", native: "کوردی" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "uk", label: "Ukrainian", native: "Українська" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "da", label: "Danish", native: "Dansk" },
  { code: "no", label: "Norwegian", native: "Norsk" },
  { code: "fi", label: "Finnish", native: "Suomi" },
  { code: "cs", label: "Czech", native: "Čeština" },
  { code: "ro", label: "Romanian", native: "Română" },
  { code: "el", label: "Greek", native: "Ελληνικά" },
  { code: "hu", label: "Hungarian", native: "Magyar" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "tl", label: "Filipino", native: "Filipino" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "so", label: "Somali", native: "Soomaali" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "af", label: "Afrikaans", native: "Afrikaans" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

const SUPPORTED = new Set<string>(LOCALES.map((l) => l.code));

const RTL: Locale[] = ["ar", "he", "fa", "ur", "ku"];
const STORAGE_KEY = "goheet.language";

type Dict = Record<string, string>;

const en: Dict = {
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.accept": "Accept",
  "common.decline": "Decline",
  "common.back": "Back",
  "common.send": "Send",
  "common.now": "now",

  "msg.title": "Messages",
  "msg.subtitle": "People you don't follow back have to ask first.",
  "msg.chats": "Chats",
  "msg.requests": "Requests",
  "msg.noChats": "No chats yet",
  "msg.noChatsLine": "Start one from someone's profile.",
  "msg.noRequests": "No requests",
  "msg.noRequestsLine": "Messages from people you don't follow land here first.",
  "msg.waiting": "Waiting for a reply",
  "msg.requestSent": "Request sent",
  "msg.accepted": "Request accepted.",
  "msg.declined": "Request declined.",
  "msg.wantsToMessage": "{name} wants to message you. Accept to start chatting.",
  "msg.wasDeclined": "This request was declined.",
  "msg.waitingAccept": "Waiting to be accepted…",
  "msg.placeholder": "Message @{username}",
  "msg.requestNote":
    "This is a message request — they'll see it once, and you can send a few lines until they accept.",
  "msg.sent": "Sent",
  "msg.read": "Read",
  "msg.delivered": "Delivered",
  "msg.voiceRecord": "Record a voice message",
  "msg.voiceRecording": "Recording…",
  "msg.voiceStop": "Stop recording",
  "msg.voiceSend": "Send voice message",
  "msg.voiceDelete": "Delete recording",
  "msg.voiceNote": "Voice message",
  "msg.voicePlay": "Play voice message",
  "msg.voicePause": "Pause voice message",
  "msg.voiceMicDenied": "Allow microphone access to record a voice message.",

  "lang.title": "Language",
  "lang.line":
    "GoHeet follows your phone language automatically. You can pick a different one here.",
  "lang.auto": "Automatic (phone language)",
  "lang.note":
    "Legal pages and support replies stay in English so there is one official version.",

  "support.latin": "Please write your request in English using Latin letters so our team can act on it within 24 hours.",
};

const sv: Dict = {
  "common.loading": "Laddar…",
  "common.cancel": "Avbryt",
  "common.accept": "Acceptera",
  "common.decline": "Neka",
  "common.back": "Tillbaka",
  "common.send": "Skicka",
  "common.now": "nu",

  "msg.title": "Meddelanden",
  "msg.subtitle": "Personer du inte följer tillbaka måste fråga först.",
  "msg.chats": "Chattar",
  "msg.requests": "Förfrågningar",
  "msg.noChats": "Inga chattar än",
  "msg.noChatsLine": "Starta en från någons profil.",
  "msg.noRequests": "Inga förfrågningar",
  "msg.noRequestsLine": "Meddelanden från personer du inte följer hamnar här först.",
  "msg.waiting": "Väntar på svar",
  "msg.requestSent": "Förfrågan skickad",
  "msg.accepted": "Förfrågan accepterad.",
  "msg.declined": "Förfrågan nekad.",
  "msg.wantsToMessage": "{name} vill skicka meddelanden till dig. Acceptera för att börja chatta.",
  "msg.wasDeclined": "Den här förfrågan nekades.",
  "msg.waitingAccept": "Väntar på att bli accepterad…",
  "msg.placeholder": "Meddela @{username}",
  "msg.requestNote":
    "Det här är en meddelandeförfrågan — de ser den en gång, och du kan skicka några rader tills de accepterar.",
  "msg.sent": "Skickat",
  "msg.read": "Visat",
  "msg.delivered": "Levererat",

  "lang.title": "Språk",
  "lang.line": "GoHeet följer telefonens språk automatiskt. Du kan välja ett annat här.",
  "lang.auto": "Automatiskt (telefonens språk)",
  "lang.note":
    "Juridiska sidor och supportsvar är alltid på engelska så att det finns en officiell version.",

  "support.latin":
    "Skriv din förfrågan på engelska med latinska bokstäver så att vårt team kan agera inom 24 timmar.",
};

const ar: Dict = {
  "common.loading": "جارٍ التحميل…",
  "common.cancel": "إلغاء",
  "common.accept": "قبول",
  "common.decline": "رفض",
  "common.back": "رجوع",
  "common.send": "إرسال",
  "common.now": "الآن",

  "msg.title": "الرسائل",
  "msg.subtitle": "من لا تتابعهم عليهم إرسال طلب أولاً.",
  "msg.chats": "المحادثات",
  "msg.requests": "الطلبات",
  "msg.noChats": "لا توجد محادثات بعد",
  "msg.noChatsLine": "ابدأ محادثة من ملف أي شخص.",
  "msg.noRequests": "لا توجد طلبات",
  "msg.noRequestsLine": "رسائل من لا تتابعهم تصل هنا أولاً.",
  "msg.waiting": "بانتظار الرد",
  "msg.requestSent": "تم إرسال الطلب",
  "msg.accepted": "تم قبول الطلب.",
  "msg.declined": "تم رفض الطلب.",
  "msg.wantsToMessage": "{name} يريد مراسلتك. اقبل لبدء المحادثة.",
  "msg.wasDeclined": "تم رفض هذا الطلب.",
  "msg.waitingAccept": "بانتظار القبول…",
  "msg.placeholder": "راسل @{username}",
  "msg.requestNote":
    "هذا طلب مراسلة — سيظهر لهم مرة واحدة، ويمكنك إرسال بضعة أسطر حتى يقبلوا.",
  "msg.sent": "تم الإرسال",
  "msg.read": "تمت القراءة",
  "msg.delivered": "تم التسليم",

  "lang.title": "اللغة",
  "lang.line": "يتبع GoHeet لغة هاتفك تلقائياً. يمكنك اختيار لغة أخرى هنا.",
  "lang.auto": "تلقائي (لغة الهاتف)",
  "lang.note": "الصفحات القانونية وردود الدعم تبقى بالإنجليزية لوجود نسخة رسمية واحدة.",

  "support.latin":
    "يرجى كتابة طلبك بالإنجليزية وبأحرف لاتينية حتى يتمكن فريقنا من التعامل معه خلال 24 ساعة.",
};

const es: Dict = {
  "common.loading": "Cargando…",
  "common.accept": "Aceptar",
  "common.decline": "Rechazar",
  "common.send": "Enviar",
  "common.now": "ahora",
  "msg.title": "Mensajes",
  "msg.subtitle": "Quienes no sigues tienen que pedirlo primero.",
  "msg.chats": "Chats",
  "msg.requests": "Solicitudes",
  "msg.noChats": "Aún no hay chats",
  "msg.noChatsLine": "Empieza uno desde el perfil de alguien.",
  "msg.noRequests": "Sin solicitudes",
  "msg.noRequestsLine": "Los mensajes de quienes no sigues llegan aquí primero.",
  "msg.waiting": "Esperando respuesta",
  "msg.requestSent": "Solicitud enviada",
  "msg.accepted": "Solicitud aceptada.",
  "msg.declined": "Solicitud rechazada.",
  "msg.wantsToMessage": "{name} quiere escribirte. Acepta para empezar a chatear.",
  "msg.wasDeclined": "Esta solicitud fue rechazada.",
  "msg.waitingAccept": "Esperando aceptación…",
  "msg.placeholder": "Mensaje para @{username}",
  "msg.requestNote":
    "Es una solicitud de mensaje: la verán una vez y puedes enviar unas líneas hasta que acepten.",
  "msg.sent": "Enviado",
  "msg.read": "Leído",
  "msg.delivered": "Entregado",
  "lang.title": "Idioma",
  "lang.line": "GoHeet sigue el idioma de tu teléfono. Puedes elegir otro aquí.",
  "lang.auto": "Automático (idioma del teléfono)",
  "lang.note": "Las páginas legales y el soporte se mantienen en inglés.",
  "support.latin":
    "Escribe tu solicitud en inglés con letras latinas para que el equipo responda en 24 horas.",
};

const fr: Dict = {
  "common.loading": "Chargement…",
  "common.accept": "Accepter",
  "common.decline": "Refuser",
  "common.send": "Envoyer",
  "common.now": "maintenant",
  "msg.title": "Messages",
  "msg.subtitle": "Les personnes que vous ne suivez pas doivent demander d'abord.",
  "msg.chats": "Discussions",
  "msg.requests": "Demandes",
  "msg.noChats": "Aucune discussion",
  "msg.noChatsLine": "Commencez depuis le profil de quelqu'un.",
  "msg.noRequests": "Aucune demande",
  "msg.noRequestsLine": "Les messages des personnes non suivies arrivent ici.",
  "msg.waiting": "En attente de réponse",
  "msg.requestSent": "Demande envoyée",
  "msg.accepted": "Demande acceptée.",
  "msg.declined": "Demande refusée.",
  "msg.wantsToMessage": "{name} souhaite vous écrire. Acceptez pour discuter.",
  "msg.wasDeclined": "Cette demande a été refusée.",
  "msg.waitingAccept": "En attente d'acceptation…",
  "msg.placeholder": "Message à @{username}",
  "msg.requestNote":
    "C'est une demande de message — elle s'affiche une fois, et vous pouvez écrire quelques lignes.",
  "msg.sent": "Envoyé",
  "msg.read": "Lu",
  "msg.delivered": "Remis",
  "lang.title": "Langue",
  "lang.line": "GoHeet suit la langue de votre téléphone. Vous pouvez en choisir une autre ici.",
  "lang.auto": "Automatique (langue du téléphone)",
  "lang.note": "Les pages légales et le support restent en anglais.",
  "support.latin":
    "Rédigez votre demande en anglais, en lettres latines, pour une réponse sous 24 heures.",
};

const de: Dict = {
  "common.loading": "Lädt…",
  "common.accept": "Annehmen",
  "common.decline": "Ablehnen",
  "common.send": "Senden",
  "common.now": "jetzt",
  "msg.title": "Nachrichten",
  "msg.subtitle": "Wer dir nicht folgt, muss zuerst fragen.",
  "msg.chats": "Chats",
  "msg.requests": "Anfragen",
  "msg.noChats": "Noch keine Chats",
  "msg.noChatsLine": "Starte einen über ein Profil.",
  "msg.noRequests": "Keine Anfragen",
  "msg.noRequestsLine": "Nachrichten von Fremden landen zuerst hier.",
  "msg.waiting": "Wartet auf Antwort",
  "msg.requestSent": "Anfrage gesendet",
  "msg.accepted": "Anfrage angenommen.",
  "msg.declined": "Anfrage abgelehnt.",
  "msg.wantsToMessage": "{name} möchte dir schreiben. Nimm an, um zu chatten.",
  "msg.wasDeclined": "Diese Anfrage wurde abgelehnt.",
  "msg.waitingAccept": "Wartet auf Annahme…",
  "msg.placeholder": "Nachricht an @{username}",
  "msg.requestNote":
    "Das ist eine Nachrichtenanfrage — sie wird einmal angezeigt, bis sie angenommen wird.",
  "msg.sent": "Gesendet",
  "msg.read": "Gelesen",
  "msg.delivered": "Zugestellt",
  "lang.title": "Sprache",
  "lang.line": "GoHeet folgt der Sprache deines Telefons. Hier kannst du eine andere wählen.",
  "lang.auto": "Automatisch (Telefonsprache)",
  "lang.note": "Rechtliche Seiten und Support bleiben auf Englisch.",
  "support.latin":
    "Bitte schreibe deine Anfrage auf Englisch in lateinischen Buchstaben — Antwort in 24 Stunden.",
};

const tr: Dict = {
  "common.loading": "Yükleniyor…",
  "common.accept": "Kabul et",
  "common.decline": "Reddet",
  "common.send": "Gönder",
  "common.now": "şimdi",
  "msg.title": "Mesajlar",
  "msg.subtitle": "Takip etmediklerin önce istek göndermeli.",
  "msg.chats": "Sohbetler",
  "msg.requests": "İstekler",
  "msg.noChats": "Henüz sohbet yok",
  "msg.noChatsLine": "Birinin profilinden başlat.",
  "msg.noRequests": "İstek yok",
  "msg.noRequestsLine": "Takip etmediklerinin mesajları önce buraya düşer.",
  "msg.waiting": "Yanıt bekleniyor",
  "msg.requestSent": "İstek gönderildi",
  "msg.accepted": "İstek kabul edildi.",
  "msg.declined": "İstek reddedildi.",
  "msg.wantsToMessage": "{name} sana yazmak istiyor. Kabul et ve sohbete başla.",
  "msg.wasDeclined": "Bu istek reddedildi.",
  "msg.waitingAccept": "Kabul bekleniyor…",
  "msg.placeholder": "@{username} kullanıcısına mesaj",
  "msg.requestNote": "Bu bir mesaj isteği — kabul edilene kadar birkaç satır gönderebilirsin.",
  "msg.sent": "Gönderildi",
  "msg.read": "Okundu",
  "msg.delivered": "İletildi",
  "lang.title": "Dil",
  "lang.line": "GoHeet telefon dilini otomatik izler. Buradan başka bir dil seçebilirsin.",
  "lang.auto": "Otomatik (telefon dili)",
  "lang.note": "Yasal sayfalar ve destek yanıtları İngilizce kalır.",
  "support.latin":
    "Lütfen isteğini Latin harfleriyle İngilizce yaz ki ekibimiz 24 saat içinde işleme alsın.",
};

// Hand-written translations for the most-used screens. Every other language —
// and every screen not listed here — is translated automatically at runtime.
const DICTS: Partial<Record<Locale, Dict>> = { en, sv, ar, es, fr, de, tr };

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const codes = navigator.languages?.length ? navigator.languages : [navigator.language ?? "en"];
  for (const raw of codes) {
    const base = raw.toLowerCase().split("-")[0];
    if (base && SUPPORTED.has(base)) return base as Locale;
  }
  return "en";
}

type Ctx = {
  locale: Locale;
  dir: "ltr" | "rtl";
  auto: boolean;
  setLocale: (l: Locale | "auto") => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR renders English; the phone language is applied right after hydration
  // so the markup never mismatches.
  const [locale, setLocaleState] = useState<Locale>("en");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored && stored !== "auto" && SUPPORTED.has(stored)) {
      setAuto(false);
      setLocaleState(stored as Locale);
    } else {
      setAuto(true);
      setLocaleState(detectLocale());
    }
  }, []);

  useEffect(() => {
    const dir = RTL.includes(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  // Translates every screen — including ones without a hand-written dictionary.
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import("./auto-translate").then(({ startAutoTranslate }) => {
      if (cancelled) return;
      stop = startAutoTranslate(locale);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale | "auto") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage can be blocked — the choice just won't persist */
    }
    if (next === "auto") {
      setAuto(true);
      setLocaleState(detectLocale());
    } else {
      setAuto(false);
      setLocaleState(next);
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const table = DICTS[locale] ?? en;
    return {
      locale,
      auto,
      dir: RTL.includes(locale) ? "rtl" : "ltr",
      setLocale,
      t: (key, vars) => {
        let out = table[key] ?? en[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
        }
        return out;
      },
    };
  }, [locale, auto, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    locale: "en",
    dir: "ltr",
    auto: true,
    setLocale: () => {},
    t: (key, vars) => {
      let out = en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
      return out;
    },
  };
}
