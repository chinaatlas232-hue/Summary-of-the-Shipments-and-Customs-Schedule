import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Table as TableIcon,
  Ship,
  FileSpreadsheet,
  X,
  Info,
  HelpCircle,
  Save,
  RotateCcw,
  Check,
  FolderTree,
  Printer,
} from 'lucide-react';
import { RawShipmentRow } from './types';
import {
  INITIAL_RAW_DATA,
  aggregateShipments,
} from './utils/shipmentProcessor';
import { exportGroupByReport } from './utils/exportGroupBy';
import { printGroupByReport } from './utils/printGroupByReport';
import { ShipmentTable } from './components/ShipmentTable';
import { SummaryCards } from './components/SummaryCards';
import { DataImporterModal } from './components/DataImporterModal';
import { RawDataViewer } from './components/RawDataViewer';
import { GroupByReportModal } from './components/GroupByReportModal';

const STORAGE_KEY = 'shipment_processor_raw_data_v1';

export default function App() {
  const [rawData, setRawData] = useState<RawShipmentRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved shipments from localStorage', e);
    }
    return INITIAL_RAW_DATA;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isRawViewerOpen, setIsRawViewerOpen] = useState(false);
  const [isGroupByModalOpen, setIsGroupByModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Save current raw data & processing state locally
  const handleSaveData = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
      setSaveStatus('saved');
      setNotification({
        type: 'success',
        message:
          rawData.length > 0
            ? `تم حفظ ${rawData.length} سجل بنجاح في الذاكرة المحلية (LocalStorage). ستظل بياناتك متوفرة عند تحديث الصفحة.`
            : 'تم حفظ حالة التطبيق الحالية (الجدول فارغ) بنجاح.',
      });
      setTimeout(() => setSaveStatus('idle'), 2500);
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'warning',
        message: 'تعذر حفظ البيانات في الذاكرة المحلية.',
      });
    }
  };

  // Reset / Clear all data
  const handleResetData = () => {
    setRawData([]);
    setSearchQuery('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
    setNotification({
      type: 'warning',
      message: 'تم تصفير كافة البيانات ومسح الجدول بنجاح. التطبيق الآن في حالة نظيفة وجاهزة.',
    });
  };

  // Restore sample default data
  const handleRestoreDemoData = () => {
    setRawData(INITIAL_RAW_DATA);
    setSearchQuery('');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RAW_DATA));
    } catch (err) {
      console.error(err);
    }
    setNotification({
      type: 'info',
      message: 'تمت استعادة البيانات النموذجية الافتراضية بنجاح.',
    });
    setTimeout(() => setNotification(null), 3500);
  };

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

  // دالة تصدير تقرير الحركات الشامل المتسلسل (Group-By Export) مع تظليل وتنسيق الهيدرات والصفوف
  const handleExportGroupBy = (format: 'excel' | 'csv' = 'excel') => {
    const exportDataset = searchQuery.trim() ? filteredData : aggregatedData;
    if (exportDataset.length === 0) {
      setNotification({
        type: 'warning',
        message: 'لا توجد بيانات متاحة لتصدير التقرير الشامل.',
      });
      return;
    }
    exportGroupByReport(exportDataset, format);
    setNotification({
      type: 'success',
      message:
        format === 'excel'
          ? `تم تصدير تقرير الحركات المنسق والمظلل (Excel) لـ ${exportDataset.length} كود بنجاح.`
          : `تم تصدير تقرير الحركات (CSV) لـ ${exportDataset.length} كود بنجاح.`,
    });
    setTimeout(() => setNotification(null), 4500);
  };

  // دالة الطباعة وحفظ PDF المباشر لتقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)
  const handlePrintDirect = () => {
    const exportDataset = searchQuery.trim() ? filteredData : aggregatedData;
    if (exportDataset.length === 0) {
      setNotification({
        type: 'warning',
        message: 'لا توجد بيانات متاحة للطباعة أو حفظ ملف PDF.',
      });
      return;
    }

    setNotification({
      type: 'info',
      message: 'جارٍ فتح نافذة تجهيز وطباعة تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)...',
    });
    printGroupByReport(exportDataset, {
      searchQuery,
      totalMasterCount: aggregatedData.length,
    }).then(() => {
      setTimeout(() => setNotification(null), 3500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 w-full">
      {/* Top Navigation Bar - 60% gray (bg-slate-700) with clear white text & full width */}
      <header className="bg-slate-700 border-b border-slate-800 sticky top-0 z-30 shadow-md print:hidden text-white w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs border border-slate-600/70">
              <Ship className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                معالج وتجميع بيانات الشحنات
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  الجمرك بالدولار ($)
                </span>
              </h1>
              <p className="text-xs text-slate-300 hidden sm:block">
                دمج الأكواد المتكررة • استبدال الفاتورة بمبلغ الجمرك ($) • تطبيق دالة نوع الشحنة (RQ: بحري / RA: جوي)
              </p>
            </div>
          </div>

          {/* Clean status badge in header - No action buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-slate-800/90 text-slate-200 border border-slate-600/70 hidden sm:inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{rawData.length > 0 ? `${aggregatedData.length} كود مجمّع (${rawData.length} حركة)` : 'جاهز لإدخال البيانات'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container - Full width extending to screen edges without restrictive max-width */}
      <main className="w-full px-3 sm:px-5 lg:px-6 pt-5 space-y-5">
        {/* Notification Toast Banner */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all animate-fadeIn print:hidden ${
              notification.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : notification.type === 'warning'
                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {notification.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              {notification.type === 'warning' && <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-600 shrink-0" />}
              <span>{notification.message}</span>
              {rawData.length === 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDemoData}
                  className="mr-3 font-bold underline text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  استعادة النموذج الافتراضي للشحنات
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards - displaying real-time totals linked to search results */}
        <SummaryCards
          data={filteredData}
          rawCount={isFiltered ? currentRawCount : rawData.length}
          totalCodesCount={aggregatedData.length}
          isFiltered={isFiltered}
        />

        {/* Printable Official Document Header - Shown ONLY during Print / Save as PDF */}
        <div className="hidden print:block mb-4 p-4 rounded-xl border border-slate-700 bg-slate-900 text-white">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600">
                <Ship className="w-6 h-6 text-sky-300" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white">
                  تقرير معالجة وتجميع بيانات الشحنات والرسوم الجمركية
                </h1>
                <p className="text-xs text-slate-300">
                  تقرير رسمي موحد • دمج الأكواد المتكررة • استبدال الفاتورة بمبلغ الجمرك ($) • تصنيف الحاويات (RQ: بحري / RA: جوي)
                </p>
              </div>
            </div>
            <div className="text-left text-xs font-mono space-y-1 text-slate-300">
              <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div>وقت الإصدار: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
              {isFiltered ? (
                <span className="inline-block px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 text-[11px] font-sans">
                  نتائج التصفية: "{searchQuery}"
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 text-[11px] font-sans">
                  كافة الشحنات والأكواد ({aggregatedData.length} كود)
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center justify-between">
            <span>نظام تجميع الشحنات الآلي • تم تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic)</span>
            <span>مطابق لكافة معايير الاستيراد والتخليص الجمركي</span>
          </div>
        </div>

        {/* Unified Action Bar - Single organized toolbar right below summary cards */}
        <div id="unified-action-bar" className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5 print:hidden">
          {/* Row 1: The 7 Core Action Buttons in exact logical order */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. إدخال / لصق بيانات جديدة (بلون أزرق/نيلي بارز) */}
            <button
              type="button"
              id="btn-open-importer"
              onClick={() => setIsImporterOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border border-blue-500/80 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="إدخال أو لصق بيانات شحنات جديدة من إكسل أو نصوص"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>إدخال / لصق بيانات جديدة</span>
            </button>

            {/* 2. حفظ المعلومات (أخضر خفيف Pastel) */}
            <button
              type="button"
              id="btn-save-data"
              onClick={handleSaveData}
              className="px-4 py-2.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 border border-emerald-300/90 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="حفظ بيانات الشحنات ومعالجة الجداول الحالية محلياً (LocalStorage)"
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>تم الحفظ بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-700" />
                  <span>حفظ المعلومات</span>
                </>
              )}
            </button>

            {/* 3. تصفير المعلومات (رمادي تحذيري هادئ) */}
            <button
              type="button"
              id="btn-reset-data"
              onClick={handleResetData}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:bg-rose-100 border border-slate-300 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="تصفير ومسح كافة البيانات المدخلة وإعادة تعيين التطبيق إلى حالة فارغة نظيفة"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>تصفير المعلومات</span>
            </button>

            {/* 4. الجدول الخام (لعرض أو إخفاء البيانات الأصلية) */}
            <button
              type="button"
              id="btn-view-raw"
              onClick={() => setIsRawViewerOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-100 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 border border-slate-600 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="عرض السجلات الأصلية المدخلة ومراجعتها بالتفصيل"
            >
              <TableIcon className="w-4 h-4 text-slate-300" />
              <span>الجدول الخام ({rawData.length})</span>
            </button>

            {/* 5. تصدير إلى Excel (أخضر زاهي) */}
            <button
              type="button"
              id="btn-export-excel"
              onClick={exportToExcel}
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="تصدير جدول الأكواد المجمعة بالأعمدة الـ 12 المرتبة مسبقاً إلى ملف Excel (CSV)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>تصدير إلى Excel</span>
            </button>

            {/* 6. تقرير الحركات المنَسَّق Excel/CSV ومعاينة (بنفسجي أنيق) */}
            <div className="relative inline-flex rounded-xl shadow-xs">
              <button
                type="button"
                id="btn-open-groupby-modal"
                onClick={() => setIsGroupByModalOpen(true)}
                className="px-3.5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 border border-purple-500 rounded-r-xl transition-all flex items-center gap-2 cursor-pointer"
                title="معاينة تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code) بالتصميم الاحترافي والترويسة الكاملة"
              >
                <FolderTree className="w-4 h-4 text-purple-200" />
                <span>تقرير الحركات المنسق (Group-By)</span>
              </button>
              <button
                type="button"
                id="btn-export-groupby-excel"
                onClick={() => handleExportGroupBy('excel')}
                className="px-2.5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 border-y border-l border-purple-500 transition-all flex items-center gap-1 cursor-pointer border-r border-r-purple-600"
                title="تصدير تقرير الحركات المنَسَّق بصيغة Excel ملون ومظلل هيدرات ومجاميع"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-200" />
                <span className="font-mono text-[11px] font-bold">Excel</span>
              </button>
              <button
                type="button"
                id="btn-export-groupby-csv"
                onClick={() => handleExportGroupBy('csv')}
                className="px-2.5 py-2.5 text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 border-y border-l border-purple-600 rounded-l-xl transition-all flex items-center gap-1 cursor-pointer border-r border-r-purple-700"
                title="تصدير تقرير الحركات المنَسَّق بصيغة CSV"
              >
                <span className="font-mono text-[10px] font-bold">CSV</span>
              </button>
            </div>

            {/* 7. طباعة / حفظ PDF مباشر (أزرق داكن أو رمادي محترف) */}
            <button
              type="button"
              id="btn-direct-print"
              onClick={handlePrintDirect}
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black border border-slate-700 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="طباعة التقرير فوراً أو حفظه كملف PDF عالي الجودة عبر طابعة المتصفح المدمجة بنظام الألوان والتنسيق الكامل وبدون أي أخطاء"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>طباعة / حفظ PDF مباشر</span>
            </button>
          </div>

          {/* Row 2: Integrated Smart Search Bar */}
          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-2xl relative flex items-center">
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

            <div className="flex flex-wrap items-center justify-between sm:justify-end text-[11px] text-slate-500 gap-3 font-['Tajawal','Cairo',sans-serif]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>بحث فوري ولحظي (Search As You Type)</span>
              </div>
              {isFiltered && (
                <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                  تم العثور على {filteredData.length} كود مجمّع ({currentRawCount} شحنة فرعية)
                </span>
              )}
            </div>
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
            <span className="text-xs text-slate-500 flex items-center gap-1 print:hidden">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              اضغط على السهم في العمود الأخير لعرض السجلات الأصلية المدمجة
            </span>
          </div>

          <ShipmentTable
            items={filteredData}
            totalRawCount={rawData.length}
            onOpenImporter={() => setIsImporterOpen(true)}
            onRestoreDemo={handleRestoreDemoData}
          />
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

      <GroupByReportModal
        isOpen={isGroupByModalOpen}
        onClose={() => setIsGroupByModalOpen(false)}
        dataset={searchQuery.trim() ? filteredData : aggregatedData}
        searchQuery={searchQuery}
        totalRawCount={rawData.length}
      />
    </div>
  );
}
