import React, { useState } from 'react';
import { Ship, Plane, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';
import { AggregatedShipment } from '../types';

interface ShipmentTableProps {
  items: AggregatedShipment[];
}

export const ShipmentTable: React.FC<ShipmentTableProps> = ({ items }) => {
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
            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-sm font-bold">
              <th className="py-4 px-4 text-center w-16">#</th>
              <th className="py-4 px-4 font-bold text-slate-900">
                1. الكود
              </th>
              <th className="py-4 px-4 text-center font-bold text-slate-900">
                2. عدد الكارتون (مجموع)
              </th>
              <th className="py-4 px-4 text-center font-bold text-slate-900">
                3. الوزن (مجموع) <span className="text-xs font-normal text-slate-500">كجم</span>
              </th>
              <th className="py-4 px-4 text-center font-bold text-slate-900">
                4. الحجم (مجموع) <span className="text-xs font-normal text-slate-500">CBM</span>
              </th>
              <th className="py-4 px-4 font-bold text-slate-900">
                5. رقم الحاوية (أو الشحنة)
              </th>
              <th className="py-4 px-4 text-center font-bold text-slate-900">
                6. نوع الشحنة
              </th>
              <th className="py-4 px-5 text-left font-bold text-slate-900">
                7. مبلغ الجمرك ($)
              </th>
              <th className="py-4 px-3 text-center w-20 text-xs text-slate-500 font-medium">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 text-slate-800 text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span className="text-sm font-bold text-slate-700">لا توجد نتائج مطابقة لبحثك</span>
                    <span className="text-xs text-slate-400">تأكد من كتابة رمز الكود أو رقم الحاوية بشكل صحيح</span>
                  </div>
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
                        <span className="bg-indigo-100/70 text-indigo-900 px-2.5 py-1 rounded-md text-sm border border-indigo-200 font-mono font-bold">
                          {row.code}
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

                    {/* زر التفاصيل */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        id={`btn-expand-${row.code}-${index}`}
                        onClick={() => toggleExpand(rowUniqueKey)}
                        title={isExpanded ? 'إخفاء السجلات الفرعية' : 'عرض السجلات الفرعية المدمجة'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-100/50 transition-colors inline-flex items-center justify-center"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* تفاصيل السجلات الفرعية المدمجة */}
                  {isExpanded && (
                    <tr className="bg-slate-50 border-b border-indigo-100">
                      <td colSpan={9} className="p-4">
                        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                              <Layers className="w-4 h-4 text-indigo-600" />
                              <span>السجلات الأصلية المدمجة تحت الكود: <span className="text-indigo-700 font-mono">{row.code}</span></span>
                              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                                {row.items.length} سجلات
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">جميع الحقول مستخرجة من الجدول الخام</span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                  <th className="py-2 px-3 text-center">رقم</th>
                                  <th className="py-2 px-3">علامة الشحن (Shipping mark)</th>
                                  <th className="py-2 px-3">رقم دخول المخزن</th>
                                  <th className="py-2 px-3">نوع البضاعة</th>
                                  <th className="py-2 px-3 text-center">الكرتون</th>
                                  <th className="py-2 px-3 text-center">الوزن (كجم)</th>
                                  <th className="py-2 px-3 text-center">الحجم (CBM)</th>
                                  <th className="py-2 px-3">الموظف (Staff)</th>
                                  <th className="py-2 px-3 text-center">سعر البيع ($)</th>
                                  <th className="py-2 px-3 text-left">مبلغ الجمرك ($)</th>
                                  <th className="py-2 px-3">رقم قيد الادخال</th>
                                  <th className="py-2 px-3">رقم الفاتورة</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {row.items.map((subItem) => (
                                  <tr key={`sub-${subItem.no}-${subItem.shippingMark}`} className="hover:bg-slate-50">
                                    <td className="py-2 px-3 text-center text-slate-400 font-mono">{subItem.no}</td>
                                    <td className="py-2 px-3 font-mono font-medium text-indigo-900">{subItem.shippingMark}</td>
                                    <td className="py-2 px-3 font-mono text-slate-600">{subItem.warehouseReceiptNo}</td>
                                    <td className="py-2 px-3 text-slate-700">{subItem.goodsType}</td>
                                    <td className="py-2 px-3 text-center font-mono font-bold">{subItem.cartons}</td>
                                    <td className="py-2 px-3 text-center font-mono">{subItem.weight.toFixed(2)}</td>
                                    <td className="py-2 px-3 text-center font-mono">{subItem.volume.toFixed(3)}</td>
                                    <td className="py-2 px-3 text-slate-600">{subItem.staff}</td>
                                    <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">${(subItem.sellingPriceUSD || 325.00).toFixed(2)}</td>
                                    <td className="py-2 px-3 text-left font-mono font-bold text-emerald-700">${subItem.customsAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="py-2 px-3 font-mono text-slate-600">{subItem.entryNo}</td>
                                    <td className="py-2 px-3 font-mono text-slate-600">{subItem.invoiceNo}</td>
                                  </tr>
                                ))}
                              </tbody>
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
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
