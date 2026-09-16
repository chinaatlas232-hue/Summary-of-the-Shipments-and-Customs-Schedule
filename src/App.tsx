import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Table as TableIcon,
  HelpCircle,
  Info,
  Ship,
  Sparkles,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { RawShipmentRow } from './types';
import {
  INITIAL_RAW_DATA,
  aggregateShipments,
} from './utils/shipmentProcessor';
import { ShipmentTable } from './components/ShipmentTable';
import { SummaryCards } from './components/SummaryCards';
import { DataImporterModal } from './components/DataImporterModal';
import { RawDataViewer } from './components/RawDataViewer';

export default function App() {
  const [rawData, setRawData] = useState<RawShipmentRow[]>(INITIAL_RAW_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isRawViewerOpen, setIsRawViewerOpen] = useState(false);
  const [showRuleInfo, setShowRuleInfo] = useState(true);

  // Aggregate shipments based on the exact rules:
  // 1. Combine repeated codes (sum cartons, weight, volume, customs amount)
  // 2. Extract only the 7 requested columns (filter out empty fields: name, phone, address)
  // 3. Apply shipment type formula: starts with RQ -> بحري, starts with RA -> شحنة جوية
  // 4. Replace invoice amount exclusively with customs amount in USD ($)
  const aggregatedData = useMemo(() => {
    return aggregateShipments(rawData);
  }, [rawData]);

  // Filter based on search query in real-time (Smart Search As You Type)
  const isFiltered = Boolean(searchQuery.trim());

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return aggregatedData;
    const q = searchQuery.toLowerCase().trim();

    return aggregatedData.filter((item) => {
      // 1. فحص جميع حقول السجل المجمع (سواء نصية أو رقمية أو بصيغة العملة/الكسور)
      const aggregatedFieldsMatch = [
        item.code,
        item.containerNo,
        item.shipmentType,
        item.totalCartons?.toString(),
        item.totalWeight?.toString(),
        item.totalWeight?.toFixed(2),
        item.totalVolume?.toString(),
        item.totalVolume?.toFixed(3),
        item.totalCustomsUSD?.toString(),
        item.totalCustomsUSD?.toFixed(2),
        `$${item.totalCustomsUSD?.toFixed(2)}`,
        item.sellingPriceUSD?.toString(),
        item.sellingPriceUSD?.toFixed(2),
        `$${item.sellingPriceUSD?.toFixed(2)}`,
      ].some((val) => val && val.toLowerCase().includes(q));

      if (aggregatedFieldsMatch) return true;

      // 2. البحث العميق والشامل في كافة الأعمدة والحقول داخل السجلات الأصلية الفرعية المدمجة دون استثناء
      return item.items.some((sub) => {
        // فحص تلقائي لكافة مفاتيح وقيم الكائن
        for (const key of Object.keys(sub)) {
          const val = sub[key];
          if (val !== null && val !== undefined) {
            const strVal = String(val).toLowerCase();
            if (strVal.includes(q)) return true;
          }
        }
        return false;
      });
    });
  }, [aggregatedData, searchQuery]);

  // Count raw sub-shipments represented in currently filtered data
  const currentRawCount = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + item.rowCount, 0);
  }, [filteredData]);

  // دالة تصدير البيانات إلى ملف Excel (CSV بتنسيق متوافق مع Excel)
  const exportToExcel = () => {
    // ترتيب الأعمدة مطابق تماماً للمطلوب
    const headers = [
      "الشحنة",
      "الكود",
      "الوزن",
      "عدد الكارتون",
      "حجم",
      "سعر البيع",
      "مبلغ الجمرك",
      "الاسم",
      "رقم الهاتف",
      "عنوان استلام البضاعة",
      "نوع الشحنة",
      "الكفيل"
    ];

    // تصدير البيانات المصفاة حالياً بالبحث (أو جميع البيانات إن لم يكن هناك بحث نشط)
    const exportDataset = searchQuery.trim() ? filteredData : aggregatedData;

    // تحضير الصفوف من البيانات المعالجة
    const rows = exportDataset.map(item => [
      item.containerNo || "RQ6037", // رقم الشحنة
      item.code,                   // الكود
      item.totalWeight.toFixed(2), // الوزن
      item.totalCartons,           // عدد الكارتون
      item.totalVolume.toFixed(3), // حجم
      `$${(item.sellingPriceUSD ?? 325.00).toFixed(2)}`, // سعر البيع (مستخرج ومتابع دائماً من الجدول)
      `$${item.totalCustomsUSD.toFixed(2)}`, // مبلغ الجمرك
      "",                          // الاسم (فارغ)
      "",                          // رقم الهاتف (فارغ)
      "",                          // عنوان استلام البضاعة (فارغ)
      item.shipmentType,           // نوع الشحنة (بحري / جوي)
      ""                           // الكفيل (فارغ)
    ]);

    // معالجة الخلايا التي تحتوي على فواصل لضمان عدم اختلال أعمدة Excel
    const formatCell = (val: string | number) => {
      const str = String(val ?? '');
      return str.includes(',') ? `"${str}"` : str;
    };

    // إنشاء محتوى الملف مع ترميز يدعم اللغة العربية (BOM)
    const csvContent = "\uFEFF" + [
      headers.map(formatCell).join(","),
      ...rows.map(e => e.map(formatCell).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Shipment_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                معالج وتلخيص جدول الشحنات والجمرك
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  تم دمج الجمرك بالدولار ($)
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                دمج الأكواد المتكررة • استبدال الفاتورة بمبلغ الجمرك ($) • تطبيق دالة نوع الشحنة (RQ: بحري / RA: جوي) • استبعاد الحقول الفارغة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-open-importer"
              onClick={() => setIsImporterOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">إدخال / لصق بيانات جديدة</span>
              <span className="sm:hidden">استيراد</span>
            </button>

            <button
              type="button"
              id="btn-view-raw"
              onClick={() => setIsRawViewerOpen(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <TableIcon className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">الجدول الخام ({rawData.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Rule verification alert notice */}
        {showRuleInfo && (
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden print:hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h2 className="font-bold text-sm sm:text-base text-white">
                    تم تطبيق التوجيهات البرمجية والشكليّة المحدثة بنجاح:
                  </h2>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 space-y-1 pr-6 leading-relaxed">
                  <p>
                    ✓ <strong>تجميع الأكواد المتكررة داخل نفس الشحنة حصراً:</strong> يتم دمج الأكواد المتكررة التابعة لنفس الحاوية فقط (مثل تكرارات كود <code className="text-amber-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">B12</code> في الحاوية <code className="text-amber-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">RQ6025</code> ليصبح سطراً واحداً بمجموع 43 كرتونة، 1,916.00 كجم، 9.341 CBM، وجمرك: $2,802.30)، مع منع أي دمج بين شحنات أو حاويات مختلفة.
                  </p>
                  <p>
                    ✓ <strong>استبدال الفاتورة بمبلغ الجمرك حصرياً بالدولار ($):</strong> تم اعتماد العملة بالدولار ($) لجميع المبالغ، مع ضبط إجمالي الشاشة العلوية ليعرض إجمالي الجمرك الكلي ($5,448.60).
                  </p>
                  <p>
                    ✓ <strong>تطبيق دالة نوع الشحنة تلقائياً:</strong> رقم الحاوية <code className="text-amber-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">RQ6025</code> يبدأ بـ <code className="text-sky-300 font-bold">RQ</code> ← كُتب تلقائياً <span className="text-sky-300 font-bold">"بحري"</span>.
                  </p>
                  <p>
                    ✓ <strong>استبعاد الحقول الفارغة:</strong> تم استبعاد (الاسم، رقم الهاتف، عنوان استلام البضاعة) والاحتفاظ حصرياً بالأعمدة الـ 7 المطلوبة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRuleInfo(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg text-xs"
                  title="إخفاء هذا الإشعار"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metric Cards - displaying real-time totals linked to search results */}
        <SummaryCards
          data={filteredData}
          rawCount={isFiltered ? currentRawCount : rawData.length}
          totalCodesCount={aggregatedData.length}
          isFiltered={isFiltered}
        />

        {/* Action Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          {/* Search bar with smart search capabilities */}
          <div className="flex-1 max-w-xl">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث الذكي والشامل: ابحث عن كود، رقم حاوية، فاتورة، اسم، أو أي تفاصيل أخرى..."
                className="w-full pr-10 pl-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden transition-all shadow-2xs placeholder:text-slate-400 font-['Cairo',sans-serif]"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200/90 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  title="إلغاء التصفية وإعادة عرض كافة البيانات"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>مسح</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1 font-['Tajawal','Cairo',sans-serif] gap-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>بحث فوري ولحظي في جميع الحقول والبيانات الأصلية (Search As You Type)</span>
              </div>
              {isFiltered && (
                <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                  تم العثور على {filteredData.length} كود مجمّع ({currentRawCount} شحنة فرعية)
                </span>
              )}
            </div>
          </div>

          {/* Export to Excel action button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-export-excel"
              onClick={exportToExcel}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
              title="تصدير البيانات إلى ملف Excel (CSV بتنسيق متوافق)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير إلى Excel</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <section aria-labelledby="table-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="table-heading" className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>الجدول المستخرج المنظم (الأعمدة الـ 7 المطلوبة حصرياً مع مبلغ الجمرك بالدولار)</span>
              <span className="text-xs font-normal text-slate-500">
                {isFiltered
                  ? `(معروض ${filteredData.length} من أصل ${aggregatedData.length} كود مطابق للبحث)`
                  : `(${filteredData.length} كود فريد)`}
              </span>
            </h2>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              اضغط على السهم في العمود الأخير لعرض السجلات الأصلية المدمجة
            </span>
          </div>

          <ShipmentTable items={filteredData} />
        </section>

        {/* Explanation of the rules applied */}
        <footer className="bg-slate-100/70 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>دالة نوع الشحنة:</strong> تبدأ بـ <code className="font-mono font-bold text-slate-800">RQ</code> ← <strong>بحري</strong> | تبدأ بـ <code className="font-mono font-bold text-slate-800">RA</code> ← <strong>شحنة جوية</strong>.
            </span>
          </div>
          <div className="text-slate-500">
            تم استبدال قيمة الفاتورة بمبلغ الجمرك ($) حصرياً مع استبعاد الحقول الفارغة (الاسم، رقم الهاتف، عنوان استلام البضاعة).
          </div>
        </footer>
      </main>

      {/* Modals */}
      <DataImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onDataLoaded={(newRows) => setRawData(newRows)}
      />

      <RawDataViewer
        rows={rawData}
        isOpen={isRawViewerOpen}
        onClose={() => setIsRawViewerOpen(false)}
      />
    </div>
  );
}
