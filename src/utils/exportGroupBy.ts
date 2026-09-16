import { AggregatedShipment } from '../types';

/**
 * دالة مساعدة لترميز النصوص وتأمين إخراج HTML نظيف لملف Excel
 */
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * تصدير تقرير الحركات (Group-By Export) بصيغة Excel ملون ومظلل هيدرات احترافية
 * 
 * المعايير الصارمة:
 * 1. 12 عموداً فريداً وغير مكرر تماماً بدون تداخل أو تكرار لقيم الجمرك أو سعر البيع.
 * 2. تظليل بارز وأنيق للصفوف الرئيسية، الحركات الفرعية، ومجموع كل كود.
 * 3. تطابق كامل في عدد الأعمدة عبر جميع الصفوف لمنع أي إزاحة أو تشويه في الجداول.
 */
export function exportGroupByExcel(dataset: AggregatedShipment[]) {
  // 12 عموداً فريداً ومحدداً بدقة بدون تكرار
  const headers = [
    'نوع السجل / البيان',
    'الكود (Code)',
    'رقم الحاوية (Container)',
    'نوع الشحنة (Type)',
    'رقم الحركة / التسلسل',
    'نوع البضاعة (Goods Type)',
    'عدد الكراتين (Cartons)',
    'الوزن كجم (Weight)',
    'الحجم CBM (Volume)',
    'سعر البيع $ (Selling Price)',
    'مبلغ الجمرك $ (Customs USD)',
    'رقم الفاتورة (Invoice No)',
  ];

  let grandCartons = 0;
  let grandWeight = 0;
  let grandVolume = 0;
  let grandCustoms = 0;
  let grandSubItemsCount = 0;

  let bodyHtml = '';

  dataset.forEach((group, groupIdx) => {
    grandCartons += group.totalCartons;
    grandWeight += group.totalWeight;
    grandVolume += group.totalVolume;
    grandCustoms += group.totalCustomsUSD;
    grandSubItemsCount += group.items.length;

    // التحقق من قاعدة عدم التكرار (Single-Movement Clean Logic)
    if (group.items.length === 1) {
      // 1. الكود يحتوي على حركة فرعية واحدة فقط -> سطر واحد فقط نظيف ومباشر بدون تكرار
      const sub = group.items[0];
      const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

      bodyHtml += `
        <tr class="single-row">
          <td class="text-right font-bold single-level-cell">● حركة مستقلة [${groupIdx + 1}]</td>
          <td class="text-center font-bold code-cell">${escapeHtml(group.code)}</td>
          <td class="text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
          <td class="text-center font-bold">${escapeHtml(group.shipmentType)}</td>
          <td class="text-center font-mono text-slate">${escapeHtml(sub.no || 1)}</td>
          <td class="text-right font-medium">${escapeHtml(sub.goodsType || '-')}</td>
          <td class="text-center font-bold num-cell">${group.totalCartons.toLocaleString('en-US')}</td>
          <td class="text-center font-bold num-cell">${group.totalWeight.toFixed(2)}</td>
          <td class="text-center font-bold num-cell">${group.totalVolume.toFixed(3)}</td>
          <td class="text-center font-bold num-cell">$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}</td>
          <td class="text-left font-bold customs-cell">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-center font-mono">${escapeHtml(sub.invoiceNo || '-')}</td>
        </tr>
      `;
    } else {
      // 2. الكود يحتوي على حركتين أو أكثر -> الحفاظ على سلوك العرض المجمع الطبيعي الكامل
      // أ. صف الكود الرئيسي المجمّع (تظليل أزرق باستيل احترافي مع خط عريض)
      bodyHtml += `
        <tr class="master-row">
          <td class="text-right font-bold level-cell">▶ كود رئيسي مجمّع [${groupIdx + 1}]</td>
          <td class="text-center font-bold code-cell">${escapeHtml(group.code)}</td>
          <td class="text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
          <td class="text-center font-bold">${escapeHtml(group.shipmentType)}</td>
          <td class="text-center font-bold text-slate">إجمالي ${group.items.length} حركات</td>
          <td class="text-right font-bold">[كافة بضائع الكود: ${escapeHtml(group.code)}]</td>
          <td class="text-center font-bold num-cell">${group.totalCartons.toLocaleString('en-US')}</td>
          <td class="text-center font-bold num-cell">${group.totalWeight.toFixed(2)}</td>
          <td class="text-center font-bold num-cell">${group.totalVolume.toFixed(3)}</td>
          <td class="text-center font-bold num-cell">$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}</td>
          <td class="text-left font-bold customs-cell">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-center font-bold">-</td>
        </tr>
      `;

      // ب. صفوف الحركات والسجلات الفرعية التابعة للكود (تنسيق متبادل Zebra Striping)
      group.items.forEach((sub, subIdx) => {
        const isOdd = subIdx % 2 === 1;
        const rowClass = isOdd ? 'sub-row-odd' : 'sub-row-even';
        const customsVal = Number(sub.customsAmountUSD || 0);

        bodyHtml += `
          <tr class="${rowClass}">
            <td class="text-right sub-level-cell">&nbsp;&nbsp;&nbsp;↳ حركة فرعية (#${subIdx + 1})</td>
            <td class="text-center font-mono text-slate">${escapeHtml(group.code)}</td>
            <td class="text-center text-slate">${escapeHtml(group.containerNo || '-')}</td>
            <td class="text-center text-slate">${escapeHtml(group.shipmentType)}</td>
            <td class="text-center text-slate font-mono">${escapeHtml(sub.no || subIdx + 1)}</td>
            <td class="text-right">${escapeHtml(sub.goodsType || '-')}</td>
            <td class="text-center font-bold">${sub.cartons}</td>
            <td class="text-center">${Number(sub.weight || 0).toFixed(2)}</td>
            <td class="text-center">${Number(sub.volume || 0).toFixed(3)}</td>
            <td class="text-center">$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}</td>
            <td class="text-left font-bold sub-customs-cell">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-center font-mono">${escapeHtml(sub.invoiceNo || '-')}</td>
          </tr>
        `;
      });

      // ج. صف المجموع الفرعي الخاص بكل كود (تظليل كهرماني/أصفر دافئ + خط عريض بارز)
      bodyHtml += `
        <tr class="subtotal-row">
          <td class="text-right font-bold">∑ مجموع الكود (${escapeHtml(group.code)})</td>
          <td class="text-center font-bold">${escapeHtml(group.code)}</td>
          <td class="text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
          <td class="text-center font-bold">${escapeHtml(group.shipmentType)}</td>
          <td class="text-center font-bold">${group.items.length} حركات فرعية</td>
          <td class="text-right font-bold">--- ملخص إجمالي الكود ---</td>
          <td class="text-center font-bold num-cell">${group.totalCartons.toLocaleString('en-US')}</td>
          <td class="text-center font-bold num-cell">${group.totalWeight.toFixed(2)}</td>
          <td class="text-center font-bold num-cell">${group.totalVolume.toFixed(3)}</td>
          <td class="text-center font-bold text-muted">-</td>
          <td class="text-left font-bold customs-cell">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-center font-bold text-muted">-</td>
        </tr>
      `;

      // سطر فاصل ناعم بين كل كود وآخر للأكواد المتعددة
      bodyHtml += `
        <tr class="separator-row">
          <td colspan="12" class="separator-cell">&nbsp;</td>
        </tr>
      `;
    }
  });

  // 4. صف الإجمالي العام لجميع الأكواد والحركات (تظليل كحلي داكن فاخر + خط عريض ملون)
  const grandTotalHtml = `
    <tr class="grandtotal-row">
      <td class="text-right font-bold">=== الإجمالي العام لكافة الأكواد ===</td>
      <td class="text-center font-bold">${dataset.length} كود مجمّع</td>
      <td class="text-center font-bold">-</td>
      <td class="text-center font-bold">-</td>
      <td class="text-center font-bold">${grandSubItemsCount} حركة فرعية إجمالية</td>
      <td class="text-right font-bold">إجمالي كافة البضائع والسجلات</td>
      <td class="text-center font-bold grand-num">${grandCartons.toLocaleString('en-US')}</td>
      <td class="text-center font-bold grand-num">${grandWeight.toFixed(2)}</td>
      <td class="text-center font-bold grand-num">${grandVolume.toFixed(3)}</td>
      <td class="text-center font-bold text-muted">-</td>
      <td class="text-left font-bold grand-customs">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="text-center font-bold text-muted">-</td>
    </tr>
  `;

  // بناء كود HTML المتكامل مع أنماط التظليل المحاسبية المخصصة لـ Microsoft Excel
  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>تقرير تجميع الحركات Group-By</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
                <x:DoNotDisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
          text-align: right;
          background-color: #ffffff;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          direction: rtl;
        }
        th {
          background-color: #1e293b;
          color: #ffffff;
          font-weight: bold;
          font-size: 11pt;
          padding: 10px 8px;
          border: 1px solid #334155;
          text-align: center;
          white-space: nowrap;
        }
        td {
          padding: 8px 8px;
          font-size: 10pt;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        
        /* ترويسة التقرير في أعلى الملف */
        .report-header-title {
          font-size: 18pt;
          font-weight: bold;
          color: #0f172a;
          text-align: center;
          padding: 16px;
          background-color: #f8fafc;
          border-bottom: 2px solid #0284c7;
        }
        .report-meta-box {
          font-size: 10pt;
          color: #475569;
          text-align: right;
          padding: 8px 12px;
          background-color: #f1f5f9;
        }

        /* 1. تظليل صف الكود الرئيسي */
        .master-row td {
          background-color: #dbeafe;
          color: #1e3a8a;
          font-size: 10.5pt;
          border-top: 2px solid #2563eb;
          border-bottom: 1px solid #93c5fd;
        }
        .level-cell {
          background-color: #bfdbfe !important;
          color: #1e3a8a !important;
          font-weight: bold;
        }
        .code-cell {
          color: #1d4ed8;
          font-weight: bold;
          font-size: 11pt;
        }
        .num-cell {
          font-weight: bold;
          color: #0f172a;
        }
        .customs-cell {
          color: #047857 !important;
          font-weight: bold;
          font-size: 11pt;
        }

        /* 1.5. تظليل سطر الحركة المفردة المستقلة (Single-Movement Clean Row) */
        .single-row td {
          background-color: #ffffff;
          color: #1e293b;
          font-size: 10pt;
          border: 1px solid #cbd5e1;
        }
        .single-level-cell {
          background-color: #f1f5f9 !important;
          color: #334155 !important;
          font-weight: bold;
        }

        /* 2. تظليل صفوف الحركات الفرعية */
        .sub-row-even td {
          background-color: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .sub-row-odd td {
          background-color: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .sub-level-cell {
          color: #64748b;
          font-family: Consolas, monospace;
          padding-right: 14px;
        }
        .sub-customs-cell {
          color: #059669;
          font-weight: bold;
        }

        /* 3. تظليل صف مجموع الكود */
        .subtotal-row td {
          background-color: #fef3c7;
          color: #92400e;
          font-weight: bold;
          font-size: 10.5pt;
          border-top: 1px dashed #d97706;
          border-bottom: 2px solid #d97706;
        }

        /* 4. تظليل صف الإجمالي العام */
        .grandtotal-row td {
          background-color: #0f172a;
          color: #ffffff;
          font-weight: bold;
          font-size: 11.5pt;
          border-top: 3px double #38bdf8;
          border-bottom: 3px double #38bdf8;
        }
        .grand-num {
          color: #facc15;
          font-size: 12pt;
        }
        .grand-customs {
          color: #34d399;
          font-size: 13pt;
        }

        /* سطر فاصل ناعم */
        .separator-row td {
          background-color: #f1f5f9;
          height: 8px;
          padding: 0;
          border: none;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-mono { font-family: Consolas, monospace; }
        .text-slate { color: #64748b; }
        .text-muted { color: #94a3b8; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <td colspan="12" class="report-header-title">
              تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)
            </td>
          </tr>
          <tr>
            <td colspan="6" class="report-meta-box">
              <strong>تاريخ الإصدار:</strong> ${new Date().toISOString().slice(0, 10)} | 
              <strong>إجمالي الأكواد:</strong> ${dataset.length} كود | 
              <strong>إجمالي الحركات:</strong> ${grandSubItemsCount} حركة
            </td>
            <td colspan="6" class="report-meta-box" style="text-align: left;">
              <strong>إجمالي الكراتين:</strong> ${grandCartons.toLocaleString('en-US')} | 
              <strong>إجمالي الجمرك ($):</strong> $${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${bodyHtml}
          ${grandTotalHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Shipment_GroupBy_Report_${new Date().toISOString().slice(0, 10)}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * تصدير تقرير الحركات (Group-By Export) بصيغة CSV قياسية ومطابقة تماماً لـ 12 عموداً
 */
export function exportGroupByCSV(dataset: AggregatedShipment[]) {
  // نفس الـ 12 عموداً بالضبط لمنع أي اختلاف أو تكرار
  const headers = [
    'نوع السجل / البيان',
    'الكود (Code)',
    'رقم الحاوية (Container)',
    'نوع الشحنة (Type)',
    'رقم الحركة / التسلسل',
    'نوع البضاعة (Goods Type)',
    'عدد الكراتين (Cartons)',
    'الوزن كجم (Weight)',
    'الحجم CBM (Volume)',
    'سعر البيع $ (Selling Price)',
    'مبلغ الجمرك $ (Customs USD)',
    'رقم الفاتورة (Invoice No)',
  ];

  const formatCell = (val: string | number | undefined | null) => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('\n') || str.includes('"')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows: (string | number)[][] = [];

  let grandCartons = 0;
  let grandWeight = 0;
  let grandVolume = 0;
  let grandCustoms = 0;
  let grandSubItemsCount = 0;

  dataset.forEach((group, groupIdx) => {
    grandCartons += group.totalCartons;
    grandWeight += group.totalWeight;
    grandVolume += group.totalVolume;
    grandCustoms += group.totalCustomsUSD;
    grandSubItemsCount += group.items.length;

    // التحقق من قاعدة عدم التكرار (Single-Movement Clean Logic)
    if (group.items.length === 1) {
      // الكود يحتوي على حركة فرعية واحدة فقط -> سطر واحد مباشر بدون تكرار
      const sub = group.items[0];
      rows.push([
        `● حركة مستقلة [${groupIdx + 1}]`,
        group.code,
        group.containerNo || '-',
        group.shipmentType,
        sub.no || 1,
        sub.goodsType || '-',
        group.totalCartons,
        group.totalWeight.toFixed(2),
        group.totalVolume.toFixed(3),
        `$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}`,
        `$${group.totalCustomsUSD.toFixed(2)}`,
        sub.invoiceNo || '-',
      ]);
    } else {
      // الكود يحتوي على حركتين أو أكثر -> الحفاظ على الهيكل المجمع الكامل
      // 1. صف الكود الرئيسي المجمع (Master Code Row) - 12 عموداً بدقة
      rows.push([
        `▶ كود رئيسي مجمّع [${groupIdx + 1}]`,
        group.code,
        group.containerNo || '-',
        group.shipmentType,
        `إجمالي ${group.items.length} حركات`,
        `[كافة بضائع الكود: ${group.code}]`,
        group.totalCartons,
        group.totalWeight.toFixed(2),
        group.totalVolume.toFixed(3),
        `$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}`,
        `$${group.totalCustomsUSD.toFixed(2)}`,
        '-',
      ]);

      // 2. صفوف الحركات والسجلات الفرعية المرتبطة بهذا الكود (Sub-Items Grouped) - 12 عموداً بدقة
      group.items.forEach((sub, subIdx) => {
        rows.push([
          `   ↳ حركة فرعية (#${subIdx + 1})`,
          group.code,
          group.containerNo || '-',
          group.shipmentType,
          sub.no || subIdx + 1,
          sub.goodsType || '-',
          sub.cartons,
          Number(sub.weight || 0).toFixed(2),
          Number(sub.volume || 0).toFixed(3),
          `$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}`,
          `$${Number(sub.customsAmountUSD || 0).toFixed(2)}`,
          sub.invoiceNo || '-',
        ]);
      });

      // 3. صف المجموع الفرعي الخاص بهذا الكود (Sub-Total Row) - 12 عموداً بدقة
      rows.push([
        `∑ مجموع الكود (${group.code})`,
        group.code,
        group.containerNo || '-',
        group.shipmentType,
        `${group.items.length} حركات فرعية`,
        `--- ملخص إجمالي الكود ---`,
        group.totalCartons,
        group.totalWeight.toFixed(2),
        group.totalVolume.toFixed(3),
        '-',
        `$${group.totalCustomsUSD.toFixed(2)}`,
        '-',
      ]);

      // سطر فاصل فارغ (12 عموداً فارغاً) بين كل كود وآخر
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
  });

  // 4. صف الإجمالي العام النهائي (Grand Total Row) - 12 عموداً بدقة
  rows.push([
    '=== الإجمالي العام لكافة الأكواد ===',
    `${dataset.length} كود مجمّع`,
    '-',
    '-',
    `${grandSubItemsCount} حركة فرعية إجمالية`,
    'إجمالي كافة البضائع والسجلات',
    grandCartons,
    grandWeight.toFixed(2),
    grandVolume.toFixed(3),
    '-',
    `$${grandCustoms.toFixed(2)}`,
    '-',
  ]);

  const csvContent =
    '\uFEFF' +
    [
      headers.map(formatCell).join(','),
      ...rows.map((row) => row.map(formatCell).join(',')),
    ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Shipment_GroupBy_Report_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * الدالة الرئيسية لتصدير تقرير الحركات (Group-By Export)
 * تتيح اختيار التنسيق ('excel' الافتراضي المنسق والمظلل، أو 'csv' النصي)
 */
export function exportGroupByReport(
  dataset: AggregatedShipment[],
  format: 'excel' | 'csv' = 'excel'
) {
  if (format === 'excel') {
    exportGroupByExcel(dataset);
  } else {
    exportGroupByCSV(dataset);
  }
}
