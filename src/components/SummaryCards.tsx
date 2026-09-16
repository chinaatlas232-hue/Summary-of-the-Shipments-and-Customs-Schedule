import React from 'react';
import { Package, Weight, Box, DollarSign, Layers } from 'lucide-react';
import { AggregatedShipment } from '../types';

interface SummaryCardsProps {
  data: AggregatedShipment[];
  rawCount: number;
  totalCodesCount?: number;
  isFiltered?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  data,
  rawCount,
  totalCodesCount,
  isFiltered = false,
}) => {
  const totalCartons = data.reduce((acc, item) => acc + (Number(item.totalCartons) || 0), 0);
  const totalWeight = data.reduce((acc, item) => acc + (Number(item.totalWeight) || 0), 0);
  const totalVolume = data.reduce((acc, item) => acc + (Number(item.totalVolume) || 0), 0);
  const totalCustomsUSD = data.reduce((acc, item) => acc + (Number(item.totalCustomsUSD) || 0), 0);

  const cards = [
    {
      id: 'stat-codes',
      label: isFiltered ? 'الأكواد المصفاة' : 'الأكواد المجمعة',
      value: `${data.length} ${data.length === 1 ? 'كود' : 'أكواد'}`,
      sub: isFiltered
        ? `${rawCount} شحنة مطابقة (${totalCodesCount || 0} كلي)`
        : `تم دمج ${rawCount} شحنة فرعية`,
      icon: Layers,
      cardBg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-200/80 hover:border-rose-300',
      iconBox: 'bg-rose-100/90 text-rose-700 border-rose-200',
      labelColor: 'text-rose-900/80',
      valueColor: 'text-rose-950',
      subColor: 'text-rose-700/80',
    },
    {
      id: 'stat-cartons',
      label: 'عدد الكارتون (مجموع)',
      value: totalCartons.toLocaleString('en-US'),
      sub: isFiltered ? 'كرتونة مطابقة للبحث' : 'كرتونة إجمالية',
      icon: Package,
      cardBg: 'bg-purple-50/70 hover:bg-purple-50 border-purple-200/80 hover:border-purple-300',
      iconBox: 'bg-purple-100/90 text-purple-700 border-purple-200',
      labelColor: 'text-purple-900/80',
      valueColor: 'text-purple-950',
      subColor: 'text-purple-700/80',
    },
    {
      id: 'stat-weight',
      label: 'الوزن الإجمالي',
      value: `${totalWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'كيلوغرام (kg)',
      icon: Weight,
      cardBg: 'bg-sky-50/70 hover:bg-sky-50 border-sky-200/80 hover:border-sky-300',
      iconBox: 'bg-sky-100/90 text-sky-700 border-sky-200',
      labelColor: 'text-sky-900/80',
      valueColor: 'text-sky-950',
      subColor: 'text-sky-700/80',
    },
    {
      id: 'stat-volume',
      label: 'الحجم الإجمالي',
      value: `${totalVolume.toFixed(3)}`,
      sub: 'متر مكعب (CBM)',
      icon: Box,
      cardBg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-200/80 hover:border-amber-300',
      iconBox: 'bg-amber-100/90 text-amber-700 border-amber-200',
      labelColor: 'text-amber-900/80',
      valueColor: 'text-amber-950',
      subColor: 'text-amber-700/80',
    },
    {
      id: 'stat-customs-amount',
      label: 'إجمالي مبلغ الجمرك',
      value: `$${totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: isFiltered ? 'الجمرك للنتائج المصفاة ($)' : 'بالدولار ($) حصرياً',
      icon: DollarSign,
      cardBg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/80 hover:border-emerald-300',
      iconBox: 'bg-emerald-100/90 text-emerald-700 border-emerald-200',
      labelColor: 'text-emerald-900/80',
      valueColor: 'text-emerald-950',
      subColor: 'text-emerald-700/80',
    },
  ];

  return (
    <div id="summary-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`rounded-2xl p-4.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between ${card.cardBg}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-xs font-bold tracking-tight font-['Tajawal','Cairo',sans-serif] ${card.labelColor}`}>
                {card.label}
              </span>
              <div className={`p-2 rounded-xl border ${card.iconBox}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold tracking-tight font-mono ${card.valueColor}`}>
                {card.value}
              </div>
              <div className={`text-xs mt-1.5 font-medium font-['Tajawal','Cairo',sans-serif] ${card.subColor}`}>
                {card.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
