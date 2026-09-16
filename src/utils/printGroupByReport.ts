import { AggregatedShipment } from '../types';

export interface PrintReportFilterInfo {
  searchQuery?: string;
  containerNo?: string;
  totalMasterCount?: number;
}

/**
 * دالة مساعدة لضمان كتابة الكود داخل أقواس واضحة حصراً: (B133)
 */
export function formatDisplayCode(code: unknown): string {
  if (code === null || code === undefined || code === '') return '(-)';
  const trimmed = String(code).trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed;
  }
  return `(${trimmed})`;
}

/**
 * دالة طباعة وتصدير تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)
 * مطابقة تماماً للمواصفات المعتمدة:
 * 1. الهيدر البارز وشريط المعلومات العلوي (تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك).
 * 2. الأعمدة الـ 12 المرتبة بدقة وعرض الكود داخل أقواس حصراً (B133).
 * 3. التنسيق اللوني الراقي: تظليل دافئ وناعم للصفوف الرئيسية والمجاميع، زيبرا سترابينغ للحركات الفرعية، وخلفية داكنة واضحة للمجموع النهائي.
 * 4. تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic).
 */
export function printGroupByReport(
  dataset: AggregatedShipment[],
  filterInfo?: PrintReportFilterInfo
): Promise<void> {
  return new Promise((resolve) => {
    // 1. حساب الإحصائيات العامة الشاملة
    let grandCartons = 0;
    let grandWeight = 0;
    let grandVolume = 0;
    let grandCustoms = 0;
    let grandSubItemsCount = 0;

    let tableRowsHtml = '';

    dataset.forEach((group, groupIdx) => {
      grandCartons += group.totalCartons;
      grandWeight += group.totalWeight;
      grandVolume += group.totalVolume;
      grandCustoms += group.totalCustomsUSD;
      grandSubItemsCount += group.items.length;

      const formattedCode = formatDisplayCode(group.code);

      // تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic)
      if (group.items.length === 1) {
        // حركة فرعية واحدة فقط -> عرض سطر واحد فقط دون تكرار صفوف المجاميع
        const sub = group.items[0];
        const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

        tableRowsHtml += `
          <tr class="single-row">
            <td class="col-seq text-center font-mono font-bold">${groupIdx + 1}</td>
            <td class="col-container text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
            <td class="col-shipment text-center">
              <span class="badge ${group.shipmentType === 'جوي' ? 'badge-air' : 'badge-sea'}">
                ${escapeHtml(group.shipmentType)}
              </span>
            </td>
            <td class="col-invoice text-center font-mono">${escapeHtml(sub.invoiceNo || '-')}</td>
            <td class="col-goods text-right font-medium">${escapeHtml(sub.goodsType || '-')}</td>
            <td class="col-type text-right single-tag">● حركة مستقلة</td>
            <td class="col-cartons text-center font-bold text-navy">${group.totalCartons.toLocaleString('en-US')}</td>
            <td class="col-weight text-center font-bold">${group.totalWeight.toFixed(2)}</td>
            <td class="col-volume text-center font-bold">${group.totalVolume.toFixed(3)}</td>
            <td class="col-price text-center font-bold">$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}</td>
            <td class="col-customs text-left font-bold text-emerald">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="col-code text-center font-mono font-bold text-code">${escapeHtml(formattedCode)}</td>
          </tr>
        `;
      } else {
        // حركتان أو أكثر -> الحفاظ على الهيكل المجمع الكامل (صف كود رئيسي + حركات فرعية + مجموع الكود)
        // أ. صف الكود الرئيسي المجمع (تظليل دافئ ناعم مع خط عريض)
        tableRowsHtml += `
          <tr class="master-row">
            <td class="col-seq text-center font-mono font-bold">${groupIdx + 1}</td>
            <td class="col-container text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
            <td class="col-shipment text-center">
              <span class="badge ${group.shipmentType === 'جوي' ? 'badge-air' : 'badge-sea'}">
                ${escapeHtml(group.shipmentType)}
              </span>
            </td>
            <td class="col-invoice text-center text-slate font-bold">-</td>
            <td class="col-goods text-right font-bold">كافة بضائع الكود ${escapeHtml(formattedCode)}</td>
            <td class="col-type text-right font-bold master-tag">▶ كود رئيسي مجمّع (${group.items.length} حركات)</td>
            <td class="col-cartons text-center font-bold text-navy">${group.totalCartons.toLocaleString('en-US')}</td>
            <td class="col-weight text-center font-bold">${group.totalWeight.toFixed(2)}</td>
            <td class="col-volume text-center font-bold">${group.totalVolume.toFixed(3)}</td>
            <td class="col-price text-center font-bold">$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}</td>
            <td class="col-customs text-left font-bold text-emerald">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="col-code text-center font-mono font-bold text-code">${escapeHtml(formattedCode)}</td>
          </tr>
        `;

        // ب. صفوف الحركات والسجلات الفرعية التابعة للكود (تنسيق متبادل Zebra Striping مع محاذاة دقيقة)
        group.items.forEach((sub, subIdx) => {
          const isOdd = subIdx % 2 === 1;
          const rowClass = isOdd ? 'sub-row sub-row-odd' : 'sub-row sub-row-even';
          const customsVal = Number(sub.customsAmountUSD || 0);

          tableRowsHtml += `
            <tr class="${rowClass}">
              <td class="col-seq text-center font-mono text-slate text-xs">${groupIdx + 1}.${subIdx + 1}</td>
              <td class="col-container text-center text-slate">${escapeHtml(group.containerNo || '-')}</td>
              <td class="col-shipment text-center text-slate">${escapeHtml(group.shipmentType)}</td>
              <td class="col-invoice text-center font-mono text-slate">${escapeHtml(sub.invoiceNo || '-')}</td>
              <td class="col-goods text-right">${escapeHtml(sub.goodsType || '-')}</td>
              <td class="col-type text-right text-slate sub-indent">&nbsp;&nbsp;&nbsp;↳ حركة فرعية #${subIdx + 1}</td>
              <td class="col-cartons text-center font-bold">${sub.cartons}</td>
              <td class="col-weight text-center">${Number(sub.weight || 0).toFixed(2)}</td>
              <td class="col-volume text-center">${Number(sub.volume || 0).toFixed(3)}</td>
              <td class="col-price text-center">$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}</td>
              <td class="col-customs text-left font-bold text-sub-emerald">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="col-code text-center font-mono text-slate">${escapeHtml(formattedCode)}</td>
            </tr>
          `;
        });

        // ج. صف المجموع الفرعي الخاص بهذا الكود (تظليل دافئ وناعم مع خط عريض)
        tableRowsHtml += `
          <tr class="subtotal-row">
            <td class="col-seq text-center font-bold">∑</td>
            <td class="col-container text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
            <td class="col-shipment text-center font-bold">${escapeHtml(group.shipmentType)}</td>
            <td class="col-invoice text-center font-bold text-slate">-</td>
            <td class="col-goods text-right font-bold">ملخص إجمالي الكود</td>
            <td class="col-type text-right font-bold">مجموع الكود ${escapeHtml(formattedCode)}</td>
            <td class="col-cartons text-center font-bold text-navy">${group.totalCartons.toLocaleString('en-US')}</td>
            <td class="col-weight text-center font-bold">${group.totalWeight.toFixed(2)}</td>
            <td class="col-volume text-center font-bold">${group.totalVolume.toFixed(3)}</td>
            <td class="col-price text-center font-bold text-slate">-</td>
            <td class="col-customs text-left font-bold text-emerald">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="col-code text-center font-mono font-bold text-code">${escapeHtml(formattedCode)}</td>
          </tr>
          <tr class="separator-row">
            <td colspan="12" class="separator-cell"></td>
          </tr>
        `;
      }
    });

    // صف المجموع النهائي العام في أسفل الجدول (بخلفية داكنة واضحة وخط عريض)
    const grandTotalRowHtml = `
      <tr class="grand-total-row">
        <td class="col-seq text-center font-bold text-gold">===</td>
        <td class="col-container text-center font-bold">-</td>
        <td class="col-shipment text-center font-bold">-</td>
        <td class="col-invoice text-center font-bold">-</td>
        <td class="col-goods text-right font-bold text-white">إجمالي كافة السجلات</td>
        <td class="col-type text-right font-bold text-sky">الإجمالي العام (${dataset.length} كود / ${grandSubItemsCount} حركة)</td>
        <td class="col-cartons text-center font-bold text-gold">${grandCartons.toLocaleString('en-US')}</td>
        <td class="col-weight text-center font-bold text-sky">${grandWeight.toFixed(2)}</td>
        <td class="col-volume text-center font-bold text-pink">${grandVolume.toFixed(3)}</td>
        <td class="col-price text-center font-bold text-slate">-</td>
        <td class="col-customs text-left font-bold text-lightgreen">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="col-code text-center font-mono font-bold text-gold">(${dataset.length} كود)</td>
      </tr>
    `;

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

    let filterBadge = 'كافة الأكواد والشحنات';
    if (filterInfo?.containerNo) {
      filterBadge = `تصفية بالحاوية: ${filterInfo.containerNo}`;
    } else if (filterInfo?.searchQuery && filterInfo.searchQuery.trim()) {
      filterBadge = `بحث: "${filterInfo.searchQuery}"`;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير_تجميع_الشحنات_والحركات_التفصيلي_Group_By_Code</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 7mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 10px 14px;
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            font-size: 11px;
            direction: rtl;
          }

          /* 1. تنسيق الهيدر والترويسة (Report Header) */
          .report-header-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%);
            color: #ffffff;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 12px;
            border: 1px solid #334155;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          }
          .report-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #334155;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }
          .report-title-row h1 {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: -0.3px;
          }
          .report-title-row p {
            margin: 0;
            font-size: 11.5px;
            color: #94a3b8;
          }
          .report-filter-badge {
            background-color: #334155;
            border: 1px solid #475569;
            color: #f8fafc;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
          }

          /* شريط معلومات التقرير العلوي: تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك */
          .report-info-bar {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .info-card {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 9px 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .info-card.card-date {
            background-color: #f8fafc;
            border-color: #cbd5e1;
            color: #1e293b;
          }
          .info-card.card-movements {
            background-color: #fffbeb;
            border-color: #fde68a;
            color: #92400e;
          }
          .info-card.card-cartons {
            background-color: #eff6ff;
            border-color: #bfdbfe;
            color: #1e40af;
          }
          .info-card.card-customs {
            background-color: #ecfdf5;
            border-color: #a7f3d0;
            color: #065f46;
          }
          .info-label {
            font-size: 10.5px;
            font-weight: 700;
            opacity: 0.85;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 16px;
            font-weight: 900;
            font-family: 'Cairo', sans-serif;
          }
          .info-sub {
            font-size: 9.5px;
            opacity: 0.75;
          }

          /* 2. هيكل وتصميم الجدول (Group-By Layout) للأعمدة الـ 12 */
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            border: 1px solid #cbd5e1;
            margin-top: 4px;
          }
          table.data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 800;
            padding: 8px 5px;
            border: 1px solid #334155;
            font-size: 10.5px;
            text-align: center;
          }
          table.data-table td {
            padding: 5.5px 5px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }

          /* 3. التنسيق اللوني والبصري (Professional Styling) */
          /* تظليل صفوف الحركات الرئيسية والمجاميع بلون خلفية دافئ وناعم مع خط عريض */
          .master-row {
            background-color: #fffbeb !important; /* دافئ وناعم */
            color: #78350f !important;
            font-weight: 800 !important;
            border-top: 2px solid #f59e0b !important;
            border-bottom: 1px solid #fde68a !important;
          }
          .master-tag {
            background-color: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #fde68a;
          }
          .subtotal-row {
            background-color: #fef3c7 !important; /* دافئ وناعم */
            color: #78350f !important;
            font-weight: 800 !important;
            border-top: 1px dashed #d97706 !important;
            border-bottom: 2px solid #b45309 !important;
          }

          /* صفوف الحركات الفرعية بخلفية بيضاء أو رمادية فاتحة جداً متبادلة (Zebra Striping) */
          .sub-row-even {
            background-color: #ffffff !important;
          }
          .sub-row-odd {
            background-color: #f8fafc !important; /* رمادية فاتحة جداً */
          }
          .sub-indent {
            font-family: Consolas, Monaco, monospace;
            color: #64748b;
            font-size: 10px;
          }

          /* حركة مستقلة */
          .single-row {
            background-color: #ffffff;
            border-bottom: 1px solid #cbd5e1;
          }
          .single-tag {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
          }

          /* الفاصل بين المجموعات */
          .separator-row {
            height: 5px;
            background-color: #f8fafc;
          }
          .separator-cell {
            padding: 0 !important;
            border: none !important;
            height: 5px;
            background-color: #f8fafc;
          }

          /* صف المجموع النهائي في أسفل الجدول بخلفية داكنة واضحة وخط عريض */
          .grand-total-row {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: 900 !important;
            font-size: 11.5px !important;
            border-top: 3px double #38bdf8 !important;
            border-bottom: 3px double #38bdf8 !important;
          }

          /* شرط عرض الكود داخل أقواس واضحة حصراً: (B133) */
          .text-code {
            color: #0369a1;
            font-weight: 800;
            background-color: #f0f9ff;
            padding: 2px 5px;
            border-radius: 4px;
            border: 1px solid #bae6fd;
            display: inline-block;
          }

          .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
          }
          .badge-air { background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
          .badge-sea { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 800; }
          .font-medium { font-weight: 600; }
          .font-mono { font-family: Consolas, Monaco, monospace; }
          .text-navy { color: #0f172a; }
          .text-emerald { color: #047857; }
          .text-sub-emerald { color: #059669; }
          .text-slate { color: #64748b; }
          .text-sky { color: #38bdf8; }
          .text-gold { color: #facc15; }
          .text-pink { color: #f472b6; }
          .text-lightgreen { color: #4ade80; }

          .footer-note {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <!-- 1. تنسيق الهيدر والترويسة (Report Header) -->
        <div class="report-header-box">
          <div class="report-title-row">
            <div>
              <h1>تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)</h1>
              <p>نظام معالجة وتجميع بيانات الشحنات والرسوم الجمركية وفق قاعدة عدم التكرار (Single-Movement Clean Logic)</p>
            </div>
            <div>
              <span class="report-filter-badge">${filterBadge}</span>
            </div>
          </div>

          <!-- شريط معلومات التقرير العلوي (تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك) -->
          <div class="report-info-bar">
            <div class="info-card card-date">
              <div class="info-label">تاريخ الإصدار</div>
              <div class="info-value" style="font-size: 14px;">${formattedDate}</div>
              <div class="info-sub">الساعة ${formattedTime}</div>
            </div>
            <div class="info-card card-movements">
              <div class="info-label">إجمالي الحركات</div>
              <div class="info-value">${grandSubItemsCount}</div>
              <div class="info-sub">عبر ${dataset.length} كود مجمع</div>
            </div>
            <div class="info-card card-cartons">
              <div class="info-label">إجمالي الكراتين</div>
              <div class="info-value">${grandCartons.toLocaleString('en-US')}</div>
              <div class="info-sub">كرتونة (Carton)</div>
            </div>
            <div class="info-card card-customs">
              <div class="info-label">إجمالي الجمرك ($)</div>
              <div class="info-value">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div class="info-sub">بالدولار الأمريكي</div>
            </div>
          </div>
        </div>

        <!-- 2. هيكل وتصميم الجدول (Group-By Layout) للأعمدة الـ 12 المرتبة بدقة -->
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 4%;">التسلسل</th>
              <th style="width: 9%;">رقم الحاوية</th>
              <th style="width: 6%;">نوع الشحنة</th>
              <th style="width: 8%;">رقم الفاتورة</th>
              <th style="width: 14%;">نوع البضاعة</th>
              <th style="width: 15%;">بيان الحركة</th>
              <th style="width: 7%;">عدد الكراتين</th>
              <th style="width: 7%;">الوزن كجم</th>
              <th style="width: 7%;">الحجم CBM</th>
              <th style="width: 7%;">سعر البيع $</th>
              <th style="width: 9%;">مبلغ الجمرك $</th>
              <th style="width: 7%;">الكود الرئيسي</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            ${grandTotalRowHtml}
          </tbody>
        </table>

        <div class="footer-note">
          <div>نظام معالجة وتجميع الشحنات • تم تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic) • الكود معروض بصيغة (Code)</div>
          <div>صفحة تقرير رسمية • مطابقة للحسابات والمعايير الجمركية المعتمدة</div>
        </div>
      </body>
      </html>
    `;

    // استخدام نافذة طباعة مخصصة أو iframe لتشغيل الطباعة المباشرة وحفظ الـ PDF
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print window error:', e);
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      }, 500);
    } else {
      resolve();
    }
  });
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
