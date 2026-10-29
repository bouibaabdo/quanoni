const MAD_FMT = new Intl.NumberFormat("ar-MA-u-nu-latn", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 2,
});
const NUM_FMT = new Intl.NumberFormat("ar-MA-u-nu-latn");
const DATE_FMT = new Intl.DateTimeFormat("ar-MA-u-ca-gregory-nu-latn", {
  dateStyle: "medium",
  timeZone: "Africa/Casablanca",
});
const DATETIME_FMT = new Intl.DateTimeFormat("ar-MA-u-ca-gregory-nu-latn", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Casablanca",
});
const TIME_FMT = new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Casablanca",
});

export function mad(n?: number | null) {
  return MAD_FMT.format(n ?? 0);
}
export function num(n?: number | null) {
  return NUM_FMT.format(n ?? 0);
}
export function fdate(d?: Date | string | null) {
  return d ? DATE_FMT.format(new Date(d)) : "—";
}
export function fdt(d?: Date | string | null) {
  return d ? DATETIME_FMT.format(new Date(d)) : "—";
}
export function ftime(d: Date | string) {
  return TIME_FMT.format(new Date(d));
}
export function dateKey(d: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
  }).format(new Date(d));
}
export function fsize(b?: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} بايت`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} ك.ب`;
  return `${(b / 1048576).toFixed(1)} م.ب`;
}

export const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو",
  "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر",
];
export const WEEKDAYS_AR = [
  "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد",
];

// تفقيط: تحويل المبلغ إلى كلمات عربية (درهم/سنتيم)
const ONES = [
  "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية",
  "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر",
  "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر",
];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUND = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function under100(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const t = Math.floor(n / 10), o = n % 10;
  return o ? `${ONES[o]} و${TENS[t]}` : TENS[t];
}
function under1000(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  if (!h) return under100(r);
  if (!r) return HUND[h];
  return `${HUND[h]} و${under100(r)}`;
}
function group(n: number, one: string, two: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${under1000(n)} ${few}`;
  return `${under1000(n)} ${many}`;
}

export function tafqit(amount: number): string {
  const total = Math.round(amount * 100);
  const dh = Math.floor(total / 100);
  const c = total % 100;
  const parts: string[] = [];
  const mil = Math.floor(dh / 1e6);
  const th = Math.floor((dh % 1e6) / 1e3);
  const rest = dh % 1e3;
  if (mil) parts.push(group(mil, "مليون", "مليونان", "ملايين", "مليوناً"));
  if (th) parts.push(group(th, "ألف", "ألفان", "آلاف", "ألفاً"));
  if (rest || (!mil && !th)) parts.push(under1000(rest) || "صفر");
  let s = `${parts.join(" و")} درهم`;
  if (c) s += ` و${under100(c)} سنتيم`;
  return s;
}

// تفقيط فرنسي (dirhams/centimes)
const FR_UNITS = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const FR_TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
const FR_HUND = ["", "cent", "deux cents", "trois cents", "quatre cents", "cinq cents", "six cents", "sept cents", "huit cents", "neuf cents"];

function frUnder100(n: number): string {
  if (n < 20) return FR_UNITS[n];
  const t = Math.floor(n / 10), o = n % 10;
  if (t === 7 && o) return `soixante-${FR_UNITS[10 + o]}`;
  if (t === 9 && o) return `quatre-vingt-${FR_UNITS[10 + o]}`;
  if (t === 8 && !o) return "quatre-vingts";
  return o ? `${FR_TENS[t]}-${FR_UNITS[o]}` : FR_TENS[t];
}
function frUnder1000(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  if (!h) return frUnder100(r);
  if (!r) return FR_HUND[h];
  return `${h === 1 ? "cent" : FR_HUND[h]} ${frUnder100(r)}`;
}
function frGroup(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return `deux ${many}`;
  if (n > 1 && n < 10) return `${frUnder1000(n)} ${few}`;
  return `${frUnder1000(n)} ${many}`;
}

export function tafqitFr(amount: number): string {
  const total = Math.round(amount * 100);
  const dh = Math.floor(total / 100);
  const c = total % 100;
  const parts: string[] = [];
  const mil = Math.floor(dh / 1e6);
  const th = Math.floor((dh % 1e6) / 1e3);
  const rest = dh % 1e3;
  if (mil) parts.push(frGroup(mil, "un million", "millions", "millions"));
  if (th) parts.push(frGroup(th, "mille", "mille", "mille"));
  if (rest || (!mil && !th)) parts.push(frUnder1000(rest) || "zéro");
  let s = `${parts.join(" et ")} dirhams`;
  if (c) s += ` et ${frUnder100(c)} centimes`;
  return s;
}

export type InvoiceLang = "AR" | "FR" | "BI";

// نصوص واجهة الفاتورة حسب اللغة
export const INVOICE_TEXTS: Record<
  InvoiceLang,
  { title: string; for: string; item: string; qty: string; unit: string; amount: string;
    subtotal: string; tva: string; total: string; paid: string; remaining: string;
    case: string; due: string; date: string; invoiceNo: string; footerCredit: string;
    inWords: string; inWords2: string; tafqit: (n: number) => string; tafqitLabel: (n: number) => string }
> = {
  AR: {
    title: "فاتورة", for: "الفاتورة موجّهة إلى", item: "البند", qty: "الكمية", unit: "سعر الوحدة", amount: "المبلغ",
    subtotal: "المجموع دون ضريبة", tva: "TVA", total: "الإجمالي", paid: "المدفوع", remaining: "المتبقي",
    case: "الملف", due: "الاستحقاق", date: "التاريخ", invoiceNo: "رقم", footerCredit: "فاتورة صادرة إلكترونياً عبر منصة قانوني",
    inWords: "وحُدِّدت هذه الفاتورة بمبلغ:", inWords2: "والباقي:", tafqit: tafqit, tafqitLabel: tafqit,
  },
  FR: {
    title: "FACTURE", for: "Facture à", item: "Désignation", qty: "Qté", unit: "P.U. (DH)", amount: "Montant",
    subtotal: "Total HT", tva: "TVA", total: "Total TTC", paid: "Payé", remaining: "Reste à payer",
    case: "Dossier", due: "Échéance", date: "Date", invoiceNo: "N°", footerCredit: "Facture générée via Qanoni",
    inWords: "Arrêtée la présente facture à la somme de:", inWords2: "Reste dû:", tafqit: tafqitFr, tafqitLabel: tafqitFr,
  },
  BI: {
    title: "فاتورة / FACTURE", for: "الفاتورة موجّهة إلى / Facture à", item: "البند / Désignation", qty: "الكمية / Qté",
    unit: "سعر الوحدة / P.U.", amount: "المبلغ / Montant", subtotal: "المجموع دون ضريبة / Total HT",
    tva: "TVA", total: "الإجمالي / Total TTC", paid: "المدفوع / Payé", remaining: "المتبقي / Reste à payer",
    case: "الملف / Dossier", due: "الاستحقاق / Échéance", date: "التاريخ / Date", invoiceNo: "رقم / N°",
    footerCredit: "فاتورة صادرة إلكترونياً عبر منصة قانوني / Facture générée via Qanoni",
    inWords: "وحُدِّدت هذه الفاتورة بمبلغ / Arrêtée à la somme de:",
    inWords2: "والباقي / Reste dû:", tafqit: tafqit, tafqitLabel: (n) => `${tafqit(n)} / ${tafqitFr(n)}`,
  },
};
