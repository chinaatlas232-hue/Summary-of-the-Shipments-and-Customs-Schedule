import { AggregatedShipment } from '../types';
import { formatDisplayCode } from './printGroupByReport';

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
 * الأعمدة الـ 12 المرتبة بدقة متطابقة تماماً مع مواصفات تقرير الحركات المنسق (Group-By Code)
 */
export const GROUP_BY_12_HEADERS = [
  'التسلسل',
  'رقم الحاوية',
  'نوع الشحنة',
  'رقم الفاتورة',
  'نوع البضاعة',
  'بيان الحركة',
  'عدد الكراتين',
  'الوزن كجم',
  'الحجم CBM',
  'سعر البيع $',
  'مبلغ الجمرك $',
  'الكود الرئيسي',
];

/**
 * تصدير تقرير الحركات (Group-By Export) بصيغة Excel ملون ومظلل بهيدرات وتنسيق محاسبي راقي
 * 
 * المعايير:
 * 1. عنوان التقرير البارز: "تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)"
 * 2. شريط معلومات التقرير العلوي (تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك).
 * 3. 12 عموداً مرتبة بدقة.
 * 4. الشرط الأساسي لعرض الكود: كتابة الكود حصراً داخل أقواس واضحة: (B133).
 * 5. التنسيق اللوني: تظليل دافئ وناعم للصفوف الرئيسية والمجاميع، وزيبرا سترابينغ للحركات الفرعية، وصف داكن للمجموع النهائي.
 */
export function exportGroupByExcel(dataset: AggregatedShipment[]) {
  const headers = GROUP_BY_12_HEADERS;

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

    const formattedCode = formatDisplayCode(group.code);

    // التحقق من قاعدة عدم التكرار (Single-Movement Clean Logic)
    if (group.items.length === 1) {
      // 1. الكود يحتوي على حركة فرعية واحدة فقط -> سطر واحد فقط نظيف ومباشر بدون تكرار
      const sub = group.items[0];
      const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

      bodyHtml += `
        <tr class="single-row">
          <td class="text-center font-bold seq-cell">${groupIdx + 1}</td>
          <td class="text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
          <td class="text-center font-bold">${escapeHtml(group.shipmentType)}</td>
          <td class="text-center font-mono">${escapeHtml(sub.invoiceNo || '-')}</td>
          <td class="text-right font-medium">${escapeHtml(sub.goodsType || '-')}</td>
          <td class="text-right single-level-cell">● حركة مستقلة</td>
          <td class="text-center font-bold num-cell">${group.totalCartons.toLocaleString('en-US')}</td>
          <td class="text-center font-bold num-cell">${group.totalWeight.toFixed(2)}</td>
          <td class="text-center font-bold num-cell">${group.totalVolume.toFixed(3)}</td>
          <td class="text-center font-bold num-cell">$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}</td>
          <td class="text-left font-bold customs-cell">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-center font-bold code-cell">${escapeHtml(formattedCode)}</td>
        </tr>
      `;
    } else {
      // 2. الكود يحتوي على حركتين أو أكثر -> الحفاظ على سلوك العرض المجمع الطبيعي الكامل
      // أ. صف الكود الرئيسي المجمّع (تظليل دافئ وناعم بلون كهرماني/أصفر فاتح مع خط عريض)
      bodyHtml += `
        <tr class="master-row">
          <td class="text-center font-bold seq-cell">${groupIdx + 1}</td>
          <td class="text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
          <td class="text-center font-bold">${escapeHtml(group.shipmentType)}</td>
          <td class="text-center font-bold text-slate">-</td>
          <td class="text-right font-bold">كافة بضائع الكود ${escapeHtml(formattedCode)}</td>
          <td class="text-right font-bold level-cell">▶ كود رئيسي مجمّع (${group.items.length} حركات)</td>
          <td class="text-center font-bold num-cell">${group.totalCartons.toLocaleString('en-US')}</td>
          <td class="text-center font-bold num-cell">${group.totalWeight.toFixed(2)}</td>
          <td class="text-center font-bold num-cell">${group.totalVolume.toFixed(3)}</td>
          <td class="text-center font-bold num-cell">$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}</td>
          <td class="text-left font-bold customs-cell">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-center font-bold code-cell">${escapeHtml(formattedCode)}</td>
        </tr>
      `;

      // ب. صفوف الحركات والسجلات الفرعية التابعة للكود (تنسيق متبادل Zebra Striping)
      group.items.forEach((sub, subIdx) => {
        const isOdd = subIdx % 2 === 1;
        const rowClass = isOdd ? 'sub-row-odd' : 'sub-row-even';
        const customsVal = Number(sub.customsAmountUSD || 0);

        bodyHtml += `
          <tr class="${rowClass}">
            <td class="text-center font-mono text-slate seq-cell">${groupIdx + 1}.${subIdx + 1}</td>
            <td class="text-center text-slate">${escapeHtml(group.containerNo || '-')}</td>
            <td class="text-center text-slate">${escapeHtml(group.shipmentType)}</td>
            <td class="text-center font-mono text-slate">${escapeHtml(sub.invoiceNo || '-')}</td>
            <td class="text-right">${escapeHtml(sub.goodsType || '-')}</td>
            <td class="text-right sub-level-cell">&nbsp;&nbsp;&nbsp;↳ حركة فرعية #${subIdx + 1}</td>
            <td class="text-center font-bold">${sub.cartons}</td>
            <td class="text-center">${Number(sub.weight || 0).toFixed(2)}</td>
            <td class="text-center">${Number(sub.volume || 0).toFixed(3)}</td>
            <td class="text-center">$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}</td>
            <td class="text-left font-bold sub-customs-cell">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-center font-mono text-slate">${escapeHtml(formattedCode)}</td>
          </tr>
        `;
      });

      // ج. صف المجموع الفرعي الخاص بكل كود (تظليل دافئ وناعم + خط عريض بارز)
      bodyHtml += `
        <tr class="subtotal-row">
          <td class="text-center font-bold seq-cell">∑</td>
          <td class="text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
          <td class="text-center font-bold">${escapeHtml(group.shipmentType)}</td>
          <td class="text-center font-bold text-muted">-</td>
          <td class="text-right font-bold">ملخص إجمالي الكود</td>
          <td class="text-right font-bold">مجموع الكود ${escapeHtml(formattedCode)}</td>
          <td class="text-center font-bold num-cell">${group.totalCartons.toLocaleString('en-US')}</td>
          <td class="text-center font-bold num-cell">${group.totalWeight.toFixed(2)}</td>
          <td class="text-center font-bold num-cell">${group.totalVolume.toFixed(3)}</td>
          <td class="text-center font-bold text-muted">-</td>
          <td class="text-left font-bold customs-cell">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-center font-bold code-cell">${escapeHtml(formattedCode)}</td>
        </tr>
      `;

      // سطر فاصل ناعم بين كل كود وآخر
      bodyHtml += `
        <tr class="separator-row">
          <td colspan="12" class="separator-cell">&nbsp;</td>
        </tr>
      `;
    }
  });

  // 4. صف الإجمالي العام النهائي في أسفل الجدول (تظليل كحلي داكن فاخر + خط عريض ملون)
  const grandTotalHtml = `
    <tr class="grandtotal-row">
      <td class="text-center font-bold seq-cell">===</td>
      <td class="text-center font-bold">-</td>
      <td class="text-center font-bold">-</td>
      <td class="text-center font-bold">-</td>
      <td class="text-right font-bold">إجمالي كافة السجلات</td>
      <td class="text-right font-bold grand-title">الإجمالي العام (${dataset.length} كود / ${grandSubItemsCount} حركة)</td>
      <td class="text-center font-bold grand-num">${grandCartons.toLocaleString('en-US')}</td>
      <td class="text-center font-bold grand-weight">${grandWeight.toFixed(2)}</td>
      <td class="text-center font-bold grand-volume">${grandVolume.toFixed(3)}</td>
      <td class="text-center font-bold text-muted">-</td>
      <td class="text-left font-bold grand-customs">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="text-center font-bold grand-code">(${dataset.length} كود)</td>
    </tr>
  `;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // بناء كود HTML المتكامل لـ Microsoft Excel مع التنسيق الدافئ والناعم
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
          background-color: #0f172a;
          color: #ffffff;
          font-weight: bold;
          font-size: 11pt;
          padding: 10px 8px;
          border: 1px solid #334155;
          text-align: center;
          white-space: nowrap;
        }
        td {
          padding: 7px 8px;
          font-size: 10pt;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        
        /* ترويسة التقرير في أعلى الملف (Report Header) */
        .report-header-title {
          font-size: 18pt;
          font-weight: 900;
          color: #ffffff;
          text-align: center;
          padding: 16px;
          background-color: #0f172a;
          border-bottom: 2px solid #38bdf8;
        }
        .report-meta-box {
          font-size: 10.5pt;
          color: #1e293b;
          padding: 10px 14px;
          background-color: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
        }

        /* 1. تظليل صف الكود الرئيسي (تنسيق دافئ وناعم) */
        .master-row td {
          background-color: #fffbeb !important;
          color: #78350f !important;
          font-weight: bold;
          font-size: 10.5pt;
          border-top: 2px solid #f59e0b;
          border-bottom: 1px solid #fde68a;
        }
        .level-cell {
          background-color: #fef3c7 !important;
          color: #92400e !important;
          font-weight: bold;
        }
        .code-cell {
          color: #0369a1 !important;
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

        /* سطر الحركة المفردة المستقلة (Single-Movement Clean Row) */
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

        /* 2. تظليل صفوف الحركات الفرعية (Zebra Striping) */
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

        /* 3. تظليل صف مجموع الكود (تنسيق دافئ وناعم) */
        .subtotal-row td {
          background-color: #fef3c7 !important;
          color: #78350f !important;
          font-weight: bold;
          font-size: 10.5pt;
          border-top: 1px dashed #d97706;
          border-bottom: 2px solid #b45309;
        }

        /* 4. تظليل صف الإجمالي العام النهائي في الأسفل */
        .grandtotal-row td {
          background-color: #0f172a !important;
          color: #ffffff !important;
          font-weight: bold;
          font-size: 11.5pt;
          border-top: 3px double #38bdf8;
          border-bottom: 3px double #38bdf8;
        }
        .grand-title {
          color: #38bdf8;
        }
        .grand-num {
          color: #facc15;
          font-size: 12pt;
        }
        .grand-weight {
          color: #7dd3fc;
        }
        .grand-volume {
          color: #f472b6;
        }
        .grand-customs {
          color: #4ade80;
          font-size: 13pt;
        }
        .grand-code {
          color: #facc15;
        }

        /* سطر فاصل ناعم */
        .separator-row td {
          background-color: #f8fafc;
          height: 6px;
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
          <!-- شريط معلومات التقرير العلوي (تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك) -->
          <tr>
            <td colspan="3" class="report-meta-box">
              <strong>تاريخ الإصدار:</strong> ${dateStr}
            </td>
            <td colspan="3" class="report-meta-box">
              <strong>إجمالي الحركات:</strong> ${grandSubItemsCount} حركة (${dataset.length} كود)
            </td>
            <td colspan="3" class="report-meta-box">
              <strong>إجمالي الكراتين:</strong> ${grandCartons.toLocaleString('en-US')} كرتونة
            </td>
            <td colspan="3" class="report-meta-box" style="text-align: left;">
              <strong>إجمالي الجمرك:</strong> $${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  const headers = GROUP_BY_12_HEADERS;

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

    const formattedCode = formatDisplayCode(group.code);

    // التحقق من قاعدة عدم التكرار (Single-Movement Clean Logic)
    if (group.items.length === 1) {
      // الكود يحتوي على حركة فرعية واحدة فقط -> سطر واحد مباشر بدون تكرار
      const sub = group.items[0];
      rows.push([
        groupIdx + 1,
        group.containerNo || '-',
        group.shipmentType,
        sub.invoiceNo || '-',
        sub.goodsType || '-',
        '● حركة مستقلة',
        group.totalCartons,
        group.totalWeight.toFixed(2),
        group.totalVolume.toFixed(3),
        `$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}`,
        `$${group.totalCustomsUSD.toFixed(2)}`,
        formattedCode,
      ]);
    } else {
      // الكود يحتوي على حركتين أو أكثر -> الحفاظ على الهيكل المجمع الكامل
      // 1. صف الكود الرئيسي المجمع (Master Code Row)
      rows.push([
        groupIdx + 1,
        group.containerNo || '-',
        group.shipmentType,
        '-',
        `كافة بضائع الكود ${formattedCode}`,
        `▶ كود رئيسي مجمّع (${group.items.length} حركات)`,
        group.totalCartons,
        group.totalWeight.toFixed(2),
        group.totalVolume.toFixed(3),
        `$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}`,
        `$${group.totalCustomsUSD.toFixed(2)}`,
        formattedCode,
      ]);

      // 2. صفوف الحركات والسجلات الفرعية المرتبطة بهذا الكود (Sub-Items Grouped)
      group.items.forEach((sub, subIdx) => {
        rows.push([
          `${groupIdx + 1}.${subIdx + 1}`,
          group.containerNo || '-',
          group.shipmentType,
          sub.invoiceNo || '-',
          sub.goodsType || '-',
          `   ↳ حركة فرعية #${subIdx + 1}`,
          sub.cartons,
          Number(sub.weight || 0).toFixed(2),
          Number(sub.volume || 0).toFixed(3),
          `$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}`,
          `$${Number(sub.customsAmountUSD || 0).toFixed(2)}`,
          formattedCode,
        ]);
      });

      // 3. صف المجموع الفرعي الخاص بهذا الكود (Sub-Total Row)
      rows.push([
        '∑',
        group.containerNo || '-',
        group.shipmentType,
        '-',
        'ملخص إجمالي الكود',
        `مجموع الكود ${formattedCode}`,
        group.totalCartons,
        group.totalWeight.toFixed(2),
        group.totalVolume.toFixed(3),
        '-',
        `$${group.totalCustomsUSD.toFixed(2)}`,
        formattedCode,
      ]);

      // سطر فاصل فارغ (12 عموداً فارغاً) بين كل كود وآخر
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    }
  });

  // 4. صف الإجمالي العام النهائي (Grand Total Row)
  rows.push([
    '===',
    '-',
    '-',
    '-',
    'إجمالي كافة السجلات',
    `الإجمالي العام (${dataset.length} كود / ${grandSubItemsCount} حركة)`,
    grandCartons,
    grandWeight.toFixed(2),
    grandVolume.toFixed(3),
    '-',
    `$${grandCustoms.toFixed(2)}`,
    `(${dataset.length} كود)`,
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
