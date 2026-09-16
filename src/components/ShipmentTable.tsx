import React, { useState } from 'react';
import {
  Ship,
  Plane,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  PlusCircle,
  RotateCcw,
  Database,
  FileText,
  Boxes,
  Weight,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { AggregatedShipment } from '../types';

interface ShipmentTableProps {
  items: AggregatedShipment[];
  totalRawCount?: number;
  onOpenImporter?: () => void;
  onRestoreDemo?: () => void;
}

export const ShipmentTable: React.FC<ShipmentTableProps> = ({
  items,
  totalRawCount = 0,
  onOpenImporter,
  onRestoreDemo,
}) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedKey(prev => (prev === key ? null : key));
  };

  // Grand totals
  const totalCartons = items.reduce((acc, i) => acc + (Number(i.totalCartons) || 0), 0);
  const totalWeight = items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
  const totalVolume = items.reduce((acc, i) => acc + (Number(i.totalVolume) || 0), 0);
  const totalCustomsUSD = items.reduce((acc, i) => acc + (Number(i.totalCustomsUSD) || 0), 0);

  return (
    <div id="shipment-table-container" className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table id="aggregated-shipments-table" className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white border-b-2 border-slate-700 text-sm font-bold tracking-tight">
              <th className="py-4 px-4 text-center w-16 text-slate-400 font-semibold">#</th>
              <th className="py-4 px-4 font-bold text-white">
                1. الكود
              </th>
              <th className="py-4 px-4 text-center font-bold text-white">
                2. عدد الكارتون (مجموع)
              </th>
              <th className="py-4 px-4 text-center font-bold text-white">
                3. الوزن (مجموع) <span className="text-xs font-normal text-slate-300">كجم</span>
              </th>
              <th className="py-4 px-4 text-center font-bold text-white">
                4. الحجم (مجموع) <span className="text-xs font-normal text-slate-300">CBM</span>
              </th>
              <th className="py-4 px-4 font-bold text-white">
                5. رقم الحاوية (أو الشحنة)
              </th>
              <th className="py-4 px-4 text-center font-bold text-white">
                6. نوع الشحنة
              </th>
              <th className="py-4 px-5 text-left font-bold text-emerald-300">
                7. مبلغ الجمرك ($)
              </th>
              <th className="py-4 px-3 text-center w-20 text-xs text-slate-400 font-medium print:hidden">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 text-slate-800 text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-slate-500">
                  {totalRawCount === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-base font-bold text-slate-800 block">تم تصفير البيانات والجدول فارغ حالياً</span>
                        <span className="text-xs text-slate-500 block leading-relaxed">
                          يمكنك البدء بإدخال أو لصق بيانات شحنات جديدة، أو استعادة البيانات النموذجية بضغطة زر.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {onOpenImporter && (
                          <button
                            type="button"
                            onClick={onOpenImporter}
                            className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <PlusCircle className="w-4 h-4 text-slate-700" />
                            <span>إدخال / لصق بيانات جديدة</span>
                          </button>
                        )}
                        {onRestoreDemo && (
                          <button
                            type="button"
                            onClick={onRestoreDemo}
                            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <RotateCcw className="w-4 h-4 text-indigo-600" />
                            <span>استعادة البيانات النموذجية</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-sm font-bold text-slate-700">لا توجد نتائج مطابقة لبحثك</span>
                      <span className="text-xs text-slate-400">تأكد من كتابة رمز الكود أو رقم الحاوية بشكل صحيح</span>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              items.map((row, index) => {
                const isSea = row.shipmentType.includes('بحري');
                const isAir = row.shipmentType.includes('جوية') || row.shipmentType.includes('جوي');
                const rowUniqueKey = `${row.containerNo}:::${row.code}:::${index}`;
                const isExpanded = expandedKey === rowUniqueKey;

              return (
                <React.Fragment key={`agg-row-${row.code}-${index}`}>
                  <tr
                    id={`row-${row.code}`}
                    className={`hover:bg-indigo-50/40 transition-colors ${
                      isExpanded ? 'bg-indigo-50/30' : index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400 font-semibold">
                      {index + 1}
                    </td>

                    {/* 1. الكود */}
                    <td className="py-3.5 px-4 font-bold font-mono text-indigo-950 text-base">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-100/70 text-indigo-900 px-2.5 py-1 rounded-md text-sm border border-indigo-200 font-mono font-bold tracking-wide">
                          ({row.code})
                        </span>
                        {row.rowCount > 1 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-sans border border-slate-200">
                            {row.rowCount} شحنات مدمجة
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. عدد الكارتون (مجموع) */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono text-base">
                      {row.totalCartons.toLocaleString('en-US')}
                    </td>

                    {/* 3. الوزن (مجموع) */}
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-800">
                      {row.totalWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 4. الحجم (مجموع) */}
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-800">
                      {row.totalVolume.toFixed(3)}
                    </td>

                    {/* 5. رقم الحاوية */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs border border-slate-200">
                        {row.containerNo || '-'}
                      </span>
                    </td>

                    {/* 6. نوع الشحنة */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isSea
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : isAir
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isSea ? <Ship className="w-3.5 h-3.5 text-sky-600" /> : <Plane className="w-3.5 h-3.5 text-amber-600" />}
                        {row.shipmentType}
                      </span>
                    </td>

                    {/* 7. مبلغ الجمرك ($) */}
                    <td className="py-3.5 px-5 text-left font-mono">
                      <div className="font-bold text-emerald-700 text-base">
                        ${row.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* زر التقرير التفصيلي */}
                    <td className="py-3.5 px-3 text-center print:hidden">
                      <button
                        type="button"
                        id={`btn-expand-${row.code}-${index}`}
                        onClick={() => toggleExpand(rowUniqueKey)}
                        title={isExpanded ? 'إغلاق التقرير التفصيلي' : 'عرض التقرير التفصيلي للحركات الفرعية'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isExpanded
                            ? 'bg-slate-800 text-white shadow-xs'
                            : row.items.length > 1
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {row.items.length > 1 ? `${row.items.length} حركات` : 'حركة 1'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* تقرير تفصيلي منسق واحترافي للحركات الفرعية المدمجة */}
                  {isExpanded && (
                    <tr className="bg-slate-100/60 border-b border-indigo-100/80">
                      <td colSpan={9} className="p-3 sm:p-5">
                        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden animate-fadeIn">
                          {/* رأس التقرير التفصيلي */}
                          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 border-b border-slate-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                    <FileText className="w-4 h-4" />
                                  </span>
                                  <h4 className="font-bold text-sm sm:text-base text-white tracking-wide">
                                    تقرير تفصيلي للحركات الفرعية المدمجة
                                  </h4>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                                    الكود: ({row.code})
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-200 border border-slate-600">
                                    الحاوية: {row.containerNo || '-'}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                                    {row.shipmentType}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 pr-1">
                                  عرض تفصيلي لـ <strong className="text-white font-bold">{row.items.length}</strong> حركة فرعية مدمجة مع استبعاد الحقول غير الضرورية.
                                </p>
                              </div>

                              {/* كبسولات إحصائيات سريعة للتقرير */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-center">
                                  <div className="text-slate-400 text-[10px]">إجمالي الكراتين</div>
                                  <div className="font-bold text-white font-mono text-sm">{row.totalCartons.toLocaleString('en-US')}</div>
                                </div>
                                <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-center">
                                  <div className="text-slate-400 text-[10px]">إجمالي الوزن (كجم)</div>
                                  <div className="font-bold text-white font-mono text-sm">{row.totalWeight.toFixed(2)}</div>
                                </div>
                                <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-center">
                                  <div className="text-slate-400 text-[10px]">إجمالي الحجم (CBM)</div>
                                  <div className="font-bold text-white font-mono text-sm">{row.totalVolume.toFixed(3)}</div>
                                </div>
                                <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-xl px-3 py-2 text-center">
                                  <div className="text-emerald-300 text-[10px]">إجمالي الجمرك ($)</div>
                                  <div className="font-bold text-emerald-300 font-mono text-sm">
                                    ${row.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* جدول التقرير المصغر - مقتصر حصراً على الأعمدة الـ 8 المطلوبة */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                                  <th className="py-2.5 px-3 text-center w-14"># التسلسل</th>
                                  <th className="py-2.5 px-4 font-bold text-slate-900">نوع البضاعة</th>
                                  <th className="py-2.5 px-3 text-center font-bold text-slate-900">عدد الكراتين</th>
                                  <th className="py-2.5 px-3 text-center font-bold text-slate-900">الوزن (كجم)</th>
                                  <th className="py-2.5 px-3 text-center font-bold text-slate-900">الحجم (CBM)</th>
                                  <th className="py-2.5 px-3 text-center font-bold text-slate-900">سعر البيع ($)</th>
                                  <th className="py-2.5 px-4 text-left font-bold text-emerald-800">مبلغ الجمرك ($)</th>
                                  <th className="py-2.5 px-3 text-center font-bold text-slate-900">رقم الفاتورة</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {row.items.map((subItem, subIdx) => (
                                  <tr
                                    key={`sub-${subItem.no}-${subIdx}`}
                                    className="hover:bg-indigo-50/40 transition-colors"
                                  >
                                    {/* 1. رقم السلسلة / التسلسل */}
                                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono font-semibold">
                                      {subItem.no || subIdx + 1}
                                    </td>

                                    {/* 2. نوع البضاعة */}
                                    <td className="py-2.5 px-4 text-slate-800 font-medium">
                                      {subItem.goodsType || '-'}
                                    </td>

                                    {/* 3. عدد الكراتين */}
                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                                      {subItem.cartons}
                                    </td>

                                    {/* 4. الوزن (كجم) */}
                                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                      {Number(subItem.weight || 0).toFixed(2)}
                                    </td>

                                    {/* 5. الحجم (CBM) */}
                                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                      {Number(subItem.volume || 0).toFixed(3)}
                                    </td>

                                    {/* 6. سعر البيع ($) */}
                                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                      ${(Number(subItem.sellingPriceUSD) || 325.00).toFixed(2)}
                                    </td>

                                    {/* 7. مبلغ الجمرك ($) */}
                                    <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-700 text-xs">
                                      ${Number(subItem.customsAmountUSD || 0).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>

                                    {/* 8. رقم الفاتورة */}
                                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600">
                                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                                        {subItem.invoiceNo || '-'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-bold">المجموع</td>
                                  <td className="py-2.5 px-4 text-slate-700 font-semibold text-[11px]">
                                    {row.items.length} حركة فرعية
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-indigo-900 font-bold">
                                    {row.totalCartons.toLocaleString('en-US')}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                                    {row.totalWeight.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                                    {row.totalVolume.toFixed(3)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-normal">-</td>
                                  <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-800">
                                    ${row.totalCustomsUSD.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-normal">-</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-bold text-sm border-t-2 border-slate-700">
              <td className="py-4 px-4 text-center text-xs text-slate-400 font-normal">المجموع</td>
              <td className="py-4 px-4 text-white">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>الإجمالي العام</span>
                </span>
              </td>
              <td className="py-4 px-4 text-center font-mono text-base text-amber-300">
                {totalCartons.toLocaleString('en-US')}
              </td>
              <td className="py-4 px-4 text-center font-mono text-base text-amber-300">
                {totalWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} كجم
              </td>
              <td className="py-4 px-4 text-center font-mono text-base text-amber-300">
                {totalVolume.toFixed(3)} CBM
              </td>
              <td className="py-4 px-4 text-slate-300 font-mono text-xs">
                {Array.from(new Set(items.map(i => i.containerNo).filter(Boolean))).join(', ')}
              </td>
              <td className="py-4 px-4 text-center text-slate-300 text-xs">
                -
              </td>
              <td className="py-4 px-5 text-left font-mono">
                <div className="font-bold text-emerald-300 text-base">
                  ${totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </td>
              <td className="print:hidden"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
