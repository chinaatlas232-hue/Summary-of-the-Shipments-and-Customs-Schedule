import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Ship, Plane, PieChart as PieChartIcon, BarChart3, Info } from 'lucide-react';
import { AggregatedShipment } from '../types';

interface ShipmentDistributionChartProps {
  data: AggregatedShipment[];
  isFiltered?: boolean;
}

type MetricKey = 'codes' | 'customs' | 'cartons' | 'weight';

interface DistributionGroup {
  name: string;
  typeKey: 'sea' | 'air';
  codesCount: number;
  movementsCount: number;
  totalCartons: number;
  totalWeight: number;
  totalVolume: number;
  totalCustomsUSD: number;
  color: string;
  lightColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

export const ShipmentDistributionChart: React.FC<ShipmentDistributionChartProps> = ({
  data,
  isFiltered = false,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('codes');
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');

  // تصنيف وحساب الإحصائيات بين البحري والجوي
  const stats = useMemo(() => {
    let seaCodes = 0;
    let seaMovements = 0;
    let seaCartons = 0;
    let seaWeight = 0;
    let seaVolume = 0;
    let seaCustoms = 0;

    let airCodes = 0;
    let airMovements = 0;
    let airCartons = 0;
    let airWeight = 0;
    let airVolume = 0;
    let airCustoms = 0;

    for (const item of data) {
      const isAir =
        item.shipmentType?.includes('جوي') ||
        (item.containerNo && item.containerNo.trim().toUpperCase().startsWith('RA'));

      const cartons = Number(item.totalCartons) || 0;
      const weight = Number(item.totalWeight) || 0;
      const volume = Number(item.totalVolume) || 0;
      const customs = Number(item.totalCustomsUSD) || 0;
      const movements = item.items?.length || item.rowCount || 1;

      if (isAir) {
        airCodes += 1;
        airMovements += movements;
        airCartons += cartons;
        airWeight += weight;
        airVolume += volume;
        airCustoms += customs;
      } else {
        seaCodes += 1;
        seaMovements += movements;
        seaCartons += cartons;
        seaWeight += weight;
        seaVolume += volume;
        seaCustoms += customs;
      }
    }

    const groups: DistributionGroup[] = [
      {
        name: 'شحن بحري (Sea)',
        typeKey: 'sea',
        codesCount: seaCodes,
        movementsCount: seaMovements,
        totalCartons: seaCartons,
        totalWeight: seaWeight,
        totalVolume: seaVolume,
        totalCustomsUSD: seaCustoms,
        color: '#059669', // emerald-600
        lightColor: '#ecfdf5', // emerald-50
        borderColor: '#a7f3d0', // emerald-200
        textColor: '#065f46', // emerald-800
        badgeBg: '#10b981', // emerald-500
      },
      {
        name: 'شحن جوي (Air)',
        typeKey: 'air',
        codesCount: airCodes,
        movementsCount: airMovements,
        totalCartons: airCartons,
        totalWeight: airWeight,
        totalVolume: airVolume,
        totalCustomsUSD: airCustoms,
        color: '#6366f1', // indigo-500
        lightColor: '#eef2ff', // indigo-50
        borderColor: '#c7d2fe', // indigo-200
        textColor: '#3730a3', // indigo-800
        badgeBg: '#4f46e5', // indigo-600
      },
    ];

    const totalCodes = seaCodes + airCodes;
    const totalMovements = seaMovements + airMovements;
    const totalCartons = seaCartons + airCartons;
    const totalWeight = seaWeight + airWeight;
    const totalCustomsUSD = seaCustoms + airCustoms;

    return {
      groups,
      totals: {
        totalCodes,
        totalMovements,
        totalCartons,
        totalWeight,
        totalVolume: seaVolume + airVolume,
        totalCustomsUSD,
      },
    };
  }, [data]);

  const { groups, totals } = stats;
  const seaGroup = groups[0];
  const airGroup = groups[1];

  // بيانات الرسم البياني بحسب المعيار المختار
  const chartData = useMemo(() => {
    return groups.map((g) => {
      let value = 0;
      let displayValue = '';
      let unit = '';

      if (activeMetric === 'codes') {
        value = g.codesCount;
        displayValue = `${g.codesCount} كود`;
        unit = 'كود';
      } else if (activeMetric === 'customs') {
        value = Number(g.totalCustomsUSD.toFixed(2));
        displayValue = `$${g.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        unit = '$';
      } else if (activeMetric === 'cartons') {
        value = g.totalCartons;
        displayValue = `${g.totalCartons.toLocaleString('en-US')} كرتونة`;
        unit = 'كرتونة';
      } else if (activeMetric === 'weight') {
        value = Number(g.totalWeight.toFixed(2));
        displayValue = `${g.totalWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} كجم`;
        unit = 'كجم';
      }

      const totalVal =
        activeMetric === 'codes'
          ? totals.totalCodes
          : activeMetric === 'customs'
          ? totals.totalCustomsUSD
          : activeMetric === 'cartons'
          ? totals.totalCartons
          : totals.totalWeight;

      const percentage = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : '0.0';

      return {
        name: g.name,
        typeKey: g.typeKey,
        value,
        displayValue,
        percentage: Number(percentage),
        color: g.color,
        unit,
      };
    });
  }, [groups, totals, activeMetric]);

  const metricTitles: Record<MetricKey, { label: string; sub: string }> = {
    codes: { label: 'عدد الأكواد والشحنات', sub: 'مقارنة حجم العمليات بين الجوي والبحري' },
    customs: { label: 'مبالغ الجمرك ($)', sub: 'مقارنة الرسوم الجمركية المحصلة بالدولار' },
    cartons: { label: 'عدد الكراتين (الطرود)', sub: 'مقارنة حجم البضائع المنقولة بالكرتونة' },
    weight: { label: 'الوزن الإجمالي (كجم)', sub: 'مقارنة أوزان الشحنات المنقولة بالكيلوغرام' },
  };

  if (data.length === 0) {
    return null;
  }

  // مخصص لمكون Tooltip لإظهار تفاصيل عربية وأنيقة
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; displayValue: string; percentage: number; color: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-lg text-xs min-w-[170px] pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-800">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <div className="space-y-1 text-slate-600 font-mono">
            <div className="flex justify-between items-center text-slate-900 font-bold text-sm">
              <span>القيمة:</span>
              <span>{item.displayValue}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-slate-500">
              <span>النسبة:</span>
              <span className="font-bold text-slate-800">{item.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="shipment-distribution-chart-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all print:hidden"
    >
      {/* Header: Title + Metric Selector + Chart Style Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shadow-2xs">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              توزيع الشحنات: بحري vs جوي
              {isFiltered && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  بيانات البحث المصفاة
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {metricTitles[activeMetric].sub} (إجمالي {totals.totalCodes} كود مجمّع)
          </p>
        </div>

        {/* Controls: Metric Switcher & Chart Format Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs for Metrics */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric('codes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'codes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الأكواد ({totals.totalCodes})
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('customs')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'customs'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الجمرك ($)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('cartons')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'cartons'
                  ? 'bg-white text-purple-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكراتين
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('weight')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'weight'
                  ? 'bg-white text-sky-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الوزن (كجم)
            </button>
          </div>

          {/* Toggle between Donut / Bar */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="رسم دائري (Donut Chart)"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="رسم أعمدة (Bar Chart)"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Chart (Left) + Detail Breakdown Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-center">
        {/* Visual Chart Area (5 columns on desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 bg-slate-50/60 rounded-xl border border-slate-100 min-h-[260px]">
          {chartType === 'donut' ? (
            <div className="w-full h-[240px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric Label inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {metricTitles[activeMetric].label}
                </span>
                <span className="text-base font-black text-slate-800 font-mono">
                  {activeMetric === 'customs'
                    ? `$${totals.totalCustomsUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : activeMetric === 'codes'
                    ? totals.totalCodes
                    : activeMetric === 'cartons'
                    ? totals.totalCartons.toLocaleString('en-US')
                    : totals.totalWeight.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">الإجمالي</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-[240px] pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mini Legend Below Chart */}
          <div className="flex items-center justify-center gap-6 mt-1 text-xs">
            {chartData.map((item) => (
              <div key={item.typeKey} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-bold text-slate-700">{item.name}:</span>
                <span className="font-mono font-bold text-slate-900">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown Comparison Cards (7 columns on desktop) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Sea Shipping Card */}
          <div
            id="chart-card-sea"
            className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-50/80 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Ship className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950">شحن بحري (RQ)</h3>
                  <span className="text-[10px] text-emerald-700 font-medium">حاويات وطرود بحرية</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white font-mono shadow-2xs">
                {chartData.find((d) => d.typeKey === 'sea')?.percentage || 0}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">الأكواد والحركات:</span>
                <span className="font-mono font-bold text-emerald-950">
                  {seaGroup.codesCount} كود <span className="text-[10px] text-slate-500 font-normal">({seaGroup.movementsCount} حركة)</span>
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">مبلغ الجمرك ($):</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${seaGroup.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">عدد الكراتين:</span>
                <span className="font-mono font-bold text-slate-800">
                  {seaGroup.totalCartons.toLocaleString('en-US')} كرتونة
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">الوزن الإجمالي:</span>
                <span className="font-mono font-bold text-slate-800">
                  {seaGroup.totalWeight.toFixed(2)} كجم
                </span>
              </div>
            </div>

            {/* Sea Progress Bar */}
            <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${chartData.find((d) => d.typeKey === 'sea')?.percentage || 0}%` }}
              />
            </div>
          </div>

          {/* Air Shipping Card */}
          <div
            id="chart-card-air"
            className="p-4 rounded-xl border border-indigo-200/90 bg-indigo-50/50 hover:bg-indigo-50/80 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950">شحن جوي (RA)</h3>
                  <span className="text-[10px] text-indigo-700 font-medium">شحنات وطيران سريع</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white font-mono shadow-2xs">
                {chartData.find((d) => d.typeKey === 'air')?.percentage || 0}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/60 text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block">الأكواد والحركات:</span>
                <span className="font-mono font-bold text-indigo-950">
                  {airGroup.codesCount} كود <span className="text-[10px] text-slate-500 font-normal">({airGroup.movementsCount} حركة)</span>
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block">مبلغ الجمرك ($):</span>
                <span className="font-mono font-bold text-indigo-700">
                  ${airGroup.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block">عدد الكراتين:</span>
                <span className="font-mono font-bold text-slate-800">
                  {airGroup.totalCartons.toLocaleString('en-US')} كرتونة
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block">الوزن الإجمالي:</span>
                <span className="font-mono font-bold text-slate-800">
                  {airGroup.totalWeight.toFixed(2)} كجم
                </span>
              </div>
            </div>

            {/* Air Progress Bar */}
            <div className="w-full bg-indigo-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${chartData.find((d) => d.typeKey === 'air')?.percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Note footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            يتم التصنيف تلقائياً بناءً على بادئة رقم الحاوية/الشحنة (RQ: شحن بحري / RA: شحن جوي).
          </span>
        </div>
        <span className="font-mono font-semibold text-slate-500">
          إجمالي الجمرك: ${totals.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
