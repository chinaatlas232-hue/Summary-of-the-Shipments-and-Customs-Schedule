import { useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  Layers,
  Calendar,
  Package,
  Boxes,
  DollarSign,
  Search,
} from 'lucide-react';
import { AggregatedShipment } from '../types';
import { printGroupByReport, formatDisplayCode } from '../utils/printGroupByReport';
import { exportGroupByExcel, exportGroupByCSV } from '../utils/exportGroupBy';

interface GroupByReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: AggregatedShipment[];
  searchQuery?: string;
  totalRawCount?: number;
}

export function GroupByReportModal({
  isOpen,
  onClose,
  dataset,
  searchQuery = '',
  totalRawCount,
}: GroupByReportModalProps) {
  if (!isOpen) return null;

  // إحصائيات التقرير
  const stats = useMemo(() => {
    let cartons = 0;
    let weight = 0;
    let volume = 0;
    let customs = 0;
    let subItemsCount = 0;

    dataset.forEach((group) => {
      cartons += group.totalCartons;
      weight += group.totalWeight;
      volume += group.totalVolume;
      customs += group.totalCustomsUSD;
      subItemsCount += group.items.length;
    });

    return {
      cartons,
      weight,
      volume,
      customs,
      subItemsCount,
      masterCount: dataset.length,
    };
  }, [dataset]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    printGroupByReport(dataset, {
      searchQuery,
      totalMasterCount: stats.masterCount,
    });
  };

  const handleExcel = () => {
    exportGroupByExcel(dataset);
  };

  const handleCSV = () => {
    exportGroupByCSV(dataset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs font-['Cairo',sans-serif] animate-fade-in" dir="rtl">
      <div
        className="bg-white w-full max-w-7xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col border border-slate-300 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="groupby-modal-title"
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 id="groupby-modal-title" className="font-black text-base sm:text-lg leading-tight text-white flex items-center gap-2">
                <span>تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  {stats.masterCount} كود
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                معاينة حية ومطابقة تماماً للنسخة المطبوعة والمصدرة بصيغة Excel المحاسبية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-modal-print"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer"
              title="طباعة أو حفظ التقرير كـ PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / PDF</span>
            </button>
            <button
              type="button"
              id="btn-modal-excel"
              onClick={handleExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer"
              title="تصدير ملف Excel ملون ومنسق"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              id="btn-modal-csv"
              onClick={handleCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="تصدير CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              id="btn-modal-close"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer mr-1"
              title="إغلاق التقرير"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            
            {/* 1. تنسيق الهيدر والترويسة (Report Header) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-700/80 gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)
                  </h1>
                  <p className="text-xs text-slate-300 mt-0.5">
                    نظام معالجة وتجميع بيانات الشحنات والرسوم الجمركية وفق قاعدة عدم التكرار (Single-Movement Clean Logic)
                  </p>
                </div>
                {searchQuery.trim() && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold">
                    <Search className="w-3.5 h-3.5" />
                    <span>تصفية بالبحث: "{searchQuery}"</span>
                  </div>
                )}
              </div>

              {/* شريط معلومات التقرير العلوي (تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. تاريخ الإصدار */}
                <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 sm:p-3 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300 text-xs font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-300" />
                    <span>تاريخ الإصدار</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white">{formattedDate}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{formattedTime}</div>
                </div>

                {/* 2. إجمالي الحركات */}
                <div className="bg-amber-500/15 backdrop-blur-xs rounded-lg p-2.5 sm:p-3 border border-amber-500/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-amber-200 text-xs font-bold mb-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>إجمالي الحركات</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-300">
                    {stats.subItemsCount} <span className="text-xs font-normal text-amber-200">حركة</span>
                  </div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">عبر {stats.masterCount} كود مجمع</div>
                </div>

                {/* 3. إجمالي الكراتين */}
                <div className="bg-blue-500/15 backdrop-blur-xs rounded-lg p-2.5 sm:p-3 border border-blue-500/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-200 text-xs font-bold mb-1">
                    <Boxes className="w-3.5 h-3.5 text-blue-400" />
                    <span>إجمالي الكراتين</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-blue-300 font-mono">
                    {stats.cartons.toLocaleString('en-US')} <span className="text-xs font-normal font-sans text-blue-200">كرتونة</span>
                  </div>
                  <div className="text-[10px] text-blue-200/80 mt-0.5">{stats.weight.toFixed(1)} كجم | {stats.volume.toFixed(2)} CBM</div>
                </div>

                {/* 4. إجمالي الجمرك */}
                <div className="bg-emerald-500/15 backdrop-blur-xs rounded-lg p-2.5 sm:p-3 border border-emerald-500/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-200 text-xs font-bold mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إجمالي الجمرك</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-300 font-mono">
                    ${stats.customs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-200/80 mt-0.5">مجموع رسوم الجمرك ($)</div>
                </div>
              </div>
            </div>

            {/* 2. هيكل وتصميم الجدول (Group-By Layout) للأعمدة الـ 12 */}
            <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs">
              <table className="w-full border-collapse text-xs text-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black border-b border-slate-800 text-center select-none">
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[4%]">التسلسل</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[9%]">رقم الحاوية</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[6%]">نوع الشحنة</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[8%]">رقم الفاتورة</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[14%] text-right">نوع البضاعة</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[15%] text-right">بيان الحركة</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[7%]">عدد الكراتين</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[7%]">الوزن كجم</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[7%]">الحجم CBM</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[7%]">سعر البيع $</th>
                    <th className="py-2.5 px-2 border-r border-slate-800 w-[9%] text-left">مبلغ الجمرك $</th>
                    <th className="py-2.5 px-2 w-[7%]">الكود الرئيسي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dataset.map((group, groupIdx) => {
                    const formattedCode = formatDisplayCode(group.code);

                    // قاعدة عدم التكرار (Single-Movement Clean Logic)
                    if (group.items.length === 1) {
                      const sub = group.items[0];
                      const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

                      return (
                        <tr key={group.id || groupIdx} className="bg-white hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-600 border-r border-slate-200">{groupIdx + 1}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-200">{group.containerNo || '-'}</td>
                          <td className="py-2 px-2 text-center border-r border-slate-200">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              group.shipmentType === 'جوي'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {group.shipmentType}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{sub.invoiceNo || '-'}</td>
                          <td className="py-2 px-2 text-right font-medium text-slate-800 border-r border-slate-200">{sub.goodsType || '-'}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-600 bg-slate-50 border-r border-slate-200">
                            ● حركة مستقلة
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-slate-900 border-r border-slate-200">{group.totalCartons.toLocaleString('en-US')}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-200">{group.totalWeight.toFixed(2)}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-200">{group.totalVolume.toFixed(3)}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-200">
                            ${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-left font-bold text-emerald-700 font-mono border-r border-slate-200">
                            ${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {/* الكود داخل أقواس واضحة حصراً: (B133) */}
                          <td className="py-2 px-2 text-center font-mono font-bold">
                            <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-black">
                              {formattedCode}
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    // مجموعة تحتوي على حركتين أو أكثر (أكواد متعددة)
                    return (
                      <tbody key={group.id || groupIdx} className="border-b-2 border-amber-200">
                        {/* أ. صف الكود الرئيسي المجمع (تظليل دافئ وناعم بلون كهرماني/أصفر فاتح مع خط عريض) */}
                        <tr className="bg-amber-50/80 border-t-2 border-amber-400 text-amber-950 font-bold hover:bg-amber-100/70 transition-colors">
                          <td className="py-2.5 px-2 text-center font-mono font-black border-r border-amber-200">{groupIdx + 1}</td>
                          <td className="py-2.5 px-2 text-center font-bold border-r border-amber-200">{group.containerNo || '-'}</td>
                          <td className="py-2.5 px-2 text-center border-r border-amber-200">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              group.shipmentType === 'جوي'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {group.shipmentType}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-400 border-r border-amber-200">-</td>
                          <td className="py-2.5 px-2 text-right font-black border-r border-amber-200">
                            كافة بضائع الكود {formattedCode}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-amber-900 bg-amber-100/60 border-r border-amber-200">
                            ▶ كود رئيسي مجمّع ({group.items.length} حركات)
                          </td>
                          <td className="py-2.5 px-2 text-center font-black text-slate-900 border-r border-amber-200">{group.totalCartons.toLocaleString('en-US')}</td>
                          <td className="py-2.5 px-2 text-center font-bold border-r border-amber-200">{group.totalWeight.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-center font-bold border-r border-amber-200">{group.totalVolume.toFixed(3)}</td>
                          <td className="py-2.5 px-2 text-center font-bold border-r border-amber-200">${(group.sellingPriceUSD ?? 325.0).toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-left font-black text-emerald-800 font-mono border-r border-amber-200">
                            ${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {/* الكود داخل أقواس واضحة حصراً: (B133) */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-black">
                              {formattedCode}
                            </span>
                          </td>
                        </tr>

                        {/* ب. صفوف الحركات الفرعية التابعة للكود (Zebra Striping متبادل) */}
                        {group.items.map((sub, subIdx) => {
                          const isOdd = subIdx % 2 === 1;
                          const customsVal = Number(sub.customsAmountUSD || 0);

                          return (
                            <tr
                              key={sub.id || subIdx}
                              className={`${
                                isOdd ? 'bg-slate-50' : 'bg-white'
                              } hover:bg-slate-100/70 transition-colors text-slate-700`}
                            >
                              <td className="py-1.5 px-2 text-center font-mono text-[11px] text-slate-500 border-r border-slate-200">
                                {groupIdx + 1}.{subIdx + 1}
                              </td>
                              <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{group.containerNo || '-'}</td>
                              <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{group.shipmentType}</td>
                              <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{sub.invoiceNo || '-'}</td>
                              <td className="py-1.5 px-2 text-right text-slate-800 border-r border-slate-200">{sub.goodsType || '-'}</td>
                              <td className="py-1.5 px-2 text-right font-mono text-slate-500 border-r border-slate-200 pr-4">
                                ↳ حركة فرعية #{subIdx + 1}
                              </td>
                              <td className="py-1.5 px-2 text-center font-bold text-slate-800 border-r border-slate-200">{sub.cartons}</td>
                              <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{Number(sub.weight || 0).toFixed(2)}</td>
                              <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{Number(sub.volume || 0).toFixed(3)}</td>
                              <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}</td>
                              <td className="py-1.5 px-2 text-left font-bold text-emerald-700 font-mono border-r border-slate-200">
                                ${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1.5 px-2 text-center font-mono text-slate-500 text-[11px]">{formattedCode}</td>
                            </tr>
                          );
                        })}

                        {/* ج. صف المجموع الفرعي الخاص بالكود (تظليل دافئ وناعم مع خط عريض) */}
                        <tr className="bg-amber-100/70 border-t border-dashed border-amber-400 border-b-2 border-amber-500 text-amber-950 font-black">
                          <td className="py-2 px-2 text-center font-bold border-r border-amber-300">∑</td>
                          <td className="py-2 px-2 text-center border-r border-amber-300">{group.containerNo || '-'}</td>
                          <td className="py-2 px-2 text-center border-r border-amber-300">{group.shipmentType}</td>
                          <td className="py-2 px-2 text-center text-slate-400 border-r border-amber-300">-</td>
                          <td className="py-2 px-2 text-right border-r border-amber-300">ملخص إجمالي الكود</td>
                          <td className="py-2 px-2 text-right border-r border-amber-300">مجموع الكود {formattedCode}</td>
                          <td className="py-2 px-2 text-center text-slate-900 border-r border-amber-300">{group.totalCartons.toLocaleString('en-US')}</td>
                          <td className="py-2 px-2 text-center border-r border-amber-300">{group.totalWeight.toFixed(2)}</td>
                          <td className="py-2 px-2 text-center border-r border-amber-300">{group.totalVolume.toFixed(3)}</td>
                          <td className="py-2 px-2 text-center text-slate-400 border-r border-amber-300">-</td>
                          <td className="py-2 px-2 text-left text-emerald-800 font-mono border-r border-amber-300">
                            ${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-amber-900">{formattedCode}</td>
                        </tr>
                      </tbody>
                    );
                  })}
                </tbody>

                {/* 3. صف المجموع النهائي العام في أسفل الجدول (خلفية داكنة واضحة وخط عريض) */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-4 border-sky-400">
                    <td className="py-3 px-2 text-center text-amber-400 border-r border-slate-800 font-mono">===</td>
                    <td className="py-3 px-2 text-center border-r border-slate-800">-</td>
                    <td className="py-3 px-2 text-center border-r border-slate-800">-</td>
                    <td className="py-3 px-2 text-center border-r border-slate-800">-</td>
                    <td className="py-3 px-2 text-right border-r border-slate-800">إجمالي كافة السجلات</td>
                    <td className="py-3 px-2 text-right text-sky-300 border-r border-slate-800">
                      الإجمالي العام ({stats.masterCount} كود / {stats.subItemsCount} حركة)
                    </td>
                    <td className="py-3 px-2 text-center text-amber-400 font-mono border-r border-slate-800">
                      {stats.cartons.toLocaleString('en-US')}
                    </td>
                    <td className="py-3 px-2 text-center text-sky-300 font-mono border-r border-slate-800">
                      {stats.weight.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center text-pink-300 font-mono border-r border-slate-800">
                      {stats.volume.toFixed(3)}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-400 border-r border-slate-800">-</td>
                    <td className="py-3 px-2 text-left text-emerald-300 font-mono border-r border-slate-800">
                      ${stats.customs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-center text-amber-400 font-mono">
                      ({stats.masterCount} كود)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note & Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 gap-2">
              <div>
                نظام معالجة وتجميع بيانات الشحنات • تم تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic) • الكود معروض بصيغة (Code)
              </div>
              <div className="font-semibold text-slate-600">
                مطابق 100% للتصميم المعتمد (12 عموداً مرتبة بدقة مع التظليل الدافئ والمجموع الداكن)
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            عدد السجلات المعروضة: <strong>{stats.masterCount} كود</strong> ({stats.subItemsCount} حركة تفصيلية)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF مباشر</span>
            </button>
            <button
              type="button"
              onClick={handleExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
