import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLANS } from "../lib/plans-data";

const db = new PrismaClient();

const d = (days: number, hour = 9, min = 30) => {
  const t = new Date();
  t.setDate(t.getDate() + days);
  t.setHours(hour, min, 0, 0);
  return t;
};

async function main() {
  // الخطط
  for (const p of PLANS) {
    await db.plan.upsert({
      where: { id: p.id },
      update: { name: p.name, priceMonthly: p.priceMonthly, maxUsers: p.maxUsers, maxCases: p.maxCases, features: JSON.stringify(p.features) },
      create: { id: p.id, name: p.name, priceMonthly: p.priceMonthly, maxUsers: p.maxUsers, maxCases: p.maxCases, features: JSON.stringify(p.features) },
    });
  }

  // تجنب التكرار عند إعادة التشغيل
  const existing = await db.user.findUnique({ where: { email: "admin@demo.ma" } });
  if (existing) {
    console.log("البيانات التجريبية موجودة مسبقاً — تخطٍ.");
    return;
  }

  const hash = await bcrypt.hash("Demo@1234", 10);
  const pro = await db.plan.findUnique({ where: { id: "pro" } });

  const tenant = await db.tenant.create({
    data: {
      name: "مكتب النور للمحاماة",
      phone: "0522-123456",
      email: "contact@cabinet-alnoor.ma",
      address: "شارع محمد الخامس، عمولة الأمل، الطابق 3",
      city: "الدار البيضاء",
      ice: "001234567000089",
      planId: pro?.id,
      trialEndsAt: d(14, 23, 59),
      settings: {
        create: {
          invoicePrefix: "FAC",
          tvaRate: 20,
          reminderDays: 7,
          footerNote: "الأتعاب مستحقة فور التبليغ بها. الشكر على ثابتكم.",
        },
      },
    },
  });

  const admin = await db.user.create({
    data: { tenantId: tenant.id, email: "admin@demo.ma", passwordHash: hash, fullName: "الأستاذ كريم العلوي", role: "ADMIN", phone: "0661-111111", barNumber: "12345" },
  });
  const lawyer = await db.user.create({
    data: { tenantId: tenant.id, email: "salma@demo.ma", passwordHash: hash, fullName: "الأستاذة سلمى بنعيسى", role: "LAWYER", phone: "0662-222222", barNumber: "23456" },
  });
  await db.user.create({
    data: { tenantId: tenant.id, email: "assistant@demo.ma", passwordHash: hash, fullName: "ياسين الفاسي", role: "ASSISTANT", phone: "0663-333333" },
  });
  await db.user.create({
    data: { tenantId: tenant.id, email: "compta@demo.ma", passwordHash: hash, fullName: "نعيمة الشرقاوي", role: "ACCOUNTANT", phone: "0664-444444" },
  });

  const clientData = [
    { kind: "INDIVIDUAL", name: "محمد الرامي", cin: "BE123456", phone: "0612-345678", city: "الدار البيضاء" },
    { kind: "INDIVIDUAL", name: "فاطمة الزهراء بناني", cin: "BE654321", phone: "0613-456789", city: "الرباط" },
    { kind: "COMPANY", name: "شركة أطلس للبناء", companyName: "ATLAS BTP SARL", ice: "001987654000032", phone: "0522-888777", city: "الدار البيضاء" },
    { kind: "COMPANY", name: "مجمع الأمل التجاري", companyName: "GROUPE AMAL SA", ice: "002456789000045", phone: "0537-222333", city: "الرباط" },
    { kind: "INDIVIDUAL", name: "عبد الرحيم الطاهري", cin: "BE778899", phone: "0614-567890", city: "مراكش" },
    { kind: "INDIVIDUAL", name: "خديجة المرابط", cin: "BE445566", phone: "0615-678901", city: "فاس" },
    { kind: "COMPANY", name: "شركة الأفق للنقل", companyName: "HORIZON TRANSPORT", ice: "003112233000078", phone: "0539-111222", city: "طنجة" },
    { kind: "INDIVIDUAL", name: "يوسف العلمي", cin: "BE990011", phone: "0616-789012", city: "أكادير" },
  ];
  const clients = [] as { id: string; name: string }[];
  for (const c of clientData) {
    clients.push(await db.client.create({ data: { ...c, tenantId: tenant.id, email: null } as never }));
  }

  const caseData = [
    { reference: "D-2026-001", title: "مطالبة بأداء دين — سند إقرار", type: "CIVIL", status: "IN_PROGRESS", priority: "HIGH", client: clients[0], court: "المحكمة الابتدائية", city: "الدار البيضاء", opp: "الحاج يوسف قدوري", fees: 12000, desc: "مدين بمبلغ 85.000 درهم بموجب سند إقرار بتوقيعه، تبعاً لعدم تنفيذه نرفع دعوى أداء." },
    { reference: "D-2026-002", title: "دعوى شغل — فصل تعسفي", type: "LABOR", status: "IN_PROGRESS", priority: "MEDIUM", client: clients[4], court: "المحكمة الابتدائية (الغرفة الاجتماعية)", city: "مراكش", opp: "شركة المغرب للنسيج", fees: 8000, desc: "فصل بدون سبب قانوني بعد 7 سنوات خدمة، مطالبة بالتعويضات القانونية." },
    { reference: "D-2026-003", title: "دعوى تجارية — عدم تنفيذ عقد توريد", type: "COMMERCIAL", status: "NEW", priority: "HIGH", client: clients[2], court: "المحكمة التجارية", city: "الدار البيضاء", opp: "شركة المتوسط للمواد", fees: 25000, desc: "عدم تنفيذ عقد توريد مواد البناء لورشة الملعب الكبير." },
    { reference: "D-2026-004", title: "طلاق وتوزيع الأملاك المشتركة", type: "FAMILY", status: "IN_PROGRESS", priority: "MEDIUM", client: clients[1], court: "محكمة الأسرة", city: "الرباط", opp: "الزوج — سامي الإدريسي", fees: 6000, desc: "شعبة طلب طلة عيبية مع توزيع الأملاك المشتركة." },
    { reference: "D-2026-005", title: "نزاع إجارة عقارية — إفراغ", type: "REAL_ESTATE", status: "SUSPENDED", priority: "LOW", client: clients[3], court: "المحكمة الابتدائية", city: "الرباط", opp: "المستأجر — صيدلية النهضة", fees: 9000, desc: "عدم أداء الأجار لمدة 6 أشهر ورفض الإفراغ." },
    { reference: "D-2026-006", title: "قضية جنائية — نصب واحتيال", type: "CRIMINAL", status: "IN_PROGRESS", priority: "HIGH", client: clients[6], court: "المحكمة الابتدائية", city: "طنجة", opp: "النيابة العامة / المشتبي أحمد س.", fees: 15000, desc: "الشكوى ضحية نصب بمبلغ 200.000 درهم في صفقة وهمية." },
    { reference: "D-2026-007", title: "ملف وراثة وتصريف تركة", type: "CIVIL", status: "WON", priority: "LOW", client: clients[5], court: "المحكمة الابتدائية", city: "فاس", opp: "الوارثون الآخرون", fees: 10000, desc: "تصريف التركة وتسجيل حصة وارثة بالمحفوظات العقارية." },
    { reference: "D-2026-008", title: "مطالبة تأمين — حادثة سير", type: "CIVIL", status: "NEW", priority: "MEDIUM", client: clients[7], court: "المحكمة الابتدائية", city: "أكادير", opp: "شركة التأمين الوطنية", fees: 7000, desc: "رفض شركة التأمين التعويض بعد حادثة سير." },
    { reference: "D-2025-014", title: "دعوى شغل — أجور متأخرة", type: "LABOR", status: "CLOSED", priority: "LOW", client: clients[0], court: "المحكمة الابتدائية (الغرفة الاجتماعية)", city: "الدار البيضاء", opp: "شركة المحيط الصناعية", fees: 5000, desc: "مطالبة بأجور شهرين متأخرين. انتهت بصدور حكم بالموافقة." },
    { reference: "D-2025-011", title: "عقد مقاولة — منازعة بالحصالة", type: "COMMERCIAL", status: "LOST", priority: "LOW", client: clients[2], court: "المحكمة التجارية", city: "الدار البيضاء", opp: "مقاولة الجنوب", fees: 18000, desc: "منازعة على محضر الحصالة وتعديل الثمن. رفضت المطالبة." },
  ];

  const cases: { id: string; reference: string; title: string }[] = [];
  for (const c of caseData) {
    cases.push(
      await db.case.create({
        data: {
          tenantId: tenant.id,
          reference: c.reference,
          title: c.title,
          description: c.desc,
          type: c.type,
          status: c.status,
          priority: c.priority,
          clientId: c.client.id,
          opposingParty: c.opp,
          courtName: c.court,
          courtCity: c.city,
          lawyerId: Math.random() > 0.5 ? lawyer.id : admin.id,
          openedAt: d(-120 - Math.floor(Math.random() * 60)),
          closedAt: c.status === "CLOSED" || c.status === "WON" || c.status === "LOST" ? d(-20) : null,
          feesAgreed: c.fees,
        },
        select: { id: true, reference: true, title: true },
      })
    );
  }

  // الجلسات
  const hearings = [
    { c: 0, day: 2, hour: 9, status: "SCHEDULED", room: "قاعة 3" },
    { c: 1, day: 4, hour: 10, status: "SCHEDULED", room: "الغرفة الاجتماعية 2" },
    { c: 2, day: 6, hour: 11, status: "SCHEDULED", room: "قاعة 1" },
    { c: 3, day: 9, hour: 9, status: "SCHEDULED", room: "قاعة الأسرة" },
    { c: 5, day: 12, hour: 14, status: "SCHEDULED", room: "قاعة الجنح 2" },
    { c: 0, day: -14, hour: 9, status: "HELD", room: "قاعة 3", decision: "أجلت القضية لاستكمال عرض الوثائق." },
    { c: 4, day: -30, hour: 10, status: "POSTPONED", room: "قاعة 5", decision: "تأجيل لغياب الخصم." },
    { c: 6, day: -45, hour: 9, status: "HELD", room: "قاعة 2", decision: "قبول المطالبة أصلاً." },
  ];
  for (const h of hearings) {
    await db.hearing.create({
      data: {
        tenantId: tenant.id,
        caseId: cases[h.c].id,
        dateTime: d(h.day, h.hour),
        courtName: caseData[h.c].court,
        room: h.room,
        status: h.status,
        decision: h.decision ?? null,
        notes: null,
      },
    });
  }

  // المهام
  const tasks = [
    { title: "إعداد مذكرة بالجواب في ملف D-2026-001", due: 1, status: "IN_PROGRESS", pr: "HIGH", c: 0, who: lawyer.id },
    { title: "استخراج شهادة العمل من CNSS — ملف الشغل", due: 2, status: "TODO", pr: "MEDIUM", c: 1, who: lawyer.id },
    { title: "تسجيل مقال الدعوى التجارية بالمحكمة", due: 3, status: "TODO", pr: "HIGH", c: 2, who: admin.id },
    { title: "الاتصال بالموكل لجلب صور الحالة المدنية", due: -1, status: "TODO", pr: "MEDIUM", c: 3, who: lawyer.id },
    { title: "تجديد التأشيرة على السند الإقراري", due: -3, status: "TODO", pr: "LOW", c: 0, who: admin.id },
    { title: "ترتيب أرشيف الملف المغلق 2025-014", due: 7, status: "TODO", pr: "LOW", c: 8, who: null },
  ];
  for (const t of tasks) {
    await db.task.create({
      data: {
        tenantId: tenant.id,
        title: t.title,
        dueDate: d(t.due, 17, 0),
        status: t.status,
        priority: t.pr,
        caseId: cases[t.c].id,
        assigneeId: t.who,
        completedAt: null,
      },
    });
  }

  // الفواتير + المدفوعات
  const invDefs = [
    { client: clients[2], caseIdx: 2, n: 1, items: [["أتعاب المحاماة — أول ترانش (ملف تجاري)", 1, 15000], ["رسوم تسجيل مقال", 1, 1200]], status: "SENT", issue: -25, due: 5, pays: [] },
    { client: clients[0], caseIdx: 0, n: 2, items: [["أتعاب المحاماة — الترانش الأول", 1, 6000]], status: "PAID", issue: -70, due: -40, pays: [[6000, -55]] },
    { client: clients[3], caseIdx: 4, n: 3, items: [["أتعاب تحرير إشعار بالإفراغ", 1, 2500], ["أتعاب تتبع الدعوى — شهر", 1, 3000]], status: "OVERDUE", issue: -45, due: -15, pays: [[2000, -30]] },
    { client: clients[5], caseIdx: 6, n: 4, items: [["أتعاب المحاماة — الملف المكسوب", 1, 10000]], status: "PAID", issue: -30, due: -10, pays: [[10000, -20]] },
    { client: clients[4], caseIdx: 1, n: 5, items: [["أتعاب المحاماة — دعوى شغل (ترانش 1)", 1, 4000]], status: "SENT", issue: -8, due: 12, pays: [] },
    { client: clients[6], caseIdx: 5, n: 6, items: [["أتعاب الدفاع الجنائي — جلسة أولى", 1, 7500]], status: "PAID", issue: -12, due: 2, pays: [[7500, -10]] },
    { client: clients[1], caseIdx: 3, n: 7, items: [["أتعاب محكمة الأسرة", 1, 6000]], status: "DRAFT", issue: -1, due: 14, pays: [] },
  ];
  const invoices: { id: string; total: number }[] = [];
  for (const f of invDefs) {
    const subtotal = f.items.reduce((s, it) => s + (it[1] as number) * (it[2] as number), 0);
    const tva = Math.round(subtotal * 20) / 100 * 1; // 20%
    const tvaAmount = subtotal * 0.2;
    const total = subtotal + tvaAmount;
    const inv = await db.invoice.create({
      data: {
        tenantId: tenant.id,
        number: `FAC-2026-${String(f.n).padStart(4, "0")}`,
        clientId: f.client.id,
        caseId: cases[f.caseIdx].id,
        status: f.status,
        issueDate: d(f.issue, 12, 0),
        dueDate: d(f.due, 12, 0),
        subtotal, tvaRate: 20, tvaAmount, total,
        items: {
          create: f.items.map((it) => ({ description: it[0] as string, qty: it[1] as number, unitPrice: it[2] as number, amount: (it[1] as number) * (it[2] as number) })),
        },
      },
      select: { id: true, total: true },
    });
    for (const p of f.pays) {
      await db.payment.create({
        data: { tenantId: tenant.id, invoiceId: inv.id, amount: p[0] as number, method: "TRANSFER", paidAt: d(p[1], 11, 0) },
      });
    }
    invoices.push(inv);
  }

  // المصاريف
  const exp = [
    { caseIdx: 0, label: "رسوم تسجيل مقال الدعوى", cat: "COURT_FEES", amount: 350, day: -20 },
    { caseIdx: 0, label: "أتعاب محضر قضائي — تبليغ بسند الإقرار", cat: "BAILIFF", amount: 800, day: -18 },
    { caseIdx: 2, label: "أتعاب خبير — تقرير فني بالورشة", cat: "EXPERT", amount: 5000, day: -10 },
    { caseIdx: 1, label: "تنقلات إلى محكمة مراكش", cat: "TRAVEL", amount: 450, day: -5 },
    { caseIdx: 5, label: "طوابع جبائية", cat: "STAMPS", amount: 120, day: -3 },
    { caseIdx: 6, label: "رسوم تسجيل الحكم بالمحفوظات العقارية", cat: "COURT_FEES", amount: 1500, day: -25 },
  ];
  for (const e of exp) {
    await db.expense.create({
      data: {
        tenantId: tenant.id,
        caseId: cases[e.caseIdx].id,
        label: e.label,
        category: e.cat,
        amount: e.amount,
        date: d(e.day, 10, 0),
        reimbursable: true,
      },
    });
  }

  // سجل النشاط
  const acts = [
    [admin.fullName, "أنشأ الملف", "D-2026-003 — دعوى تجارية"],
    [lawyer.fullName, "حدّث حالة الجلسة", "D-2026-001 — أجلت"],
    [admin.fullName, "أنشأ فاتورة", "FAC-2026-0001"],
    [admin.fullName, "سجل دفعة", "FAC-2026-0002 — 6.000 د.م."],
    [lawyer.fullName, "أضاف موكلاً جديداً", "شركة الأفق للنقل"],
    [admin.fullName, "أغلق الملف", "D-2025-014"],
  ];
  for (let i = 0; i < acts.length; i++) {
    await db.activity.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        userName: acts[i][0],
        action: acts[i][1],
        entity: acts[i][2],
        createdAt: d(-i - 1, 11, 15),
      },
    });
  }

  console.log("تم إنشاء البيانات التجريبية بنجاح.");
  console.log("الدخول: admin@demo.ma / Demo@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
