import { AggregatedShipment } from '../types';

export interface PrintReportFilterInfo {
  searchQuery?: string;
  containerNo?: string;
  totalMasterCount?: number;
}

/**
 * دالة طباعة وتصدير تقرير الحركات التفصيلي (Group-By) بصيغة PDF عالية الدقة عبر محرك الطباعة المباشر
 * تدعم قاعدة عدم التكرار (Single-Movement Clean Logic) بدقة تامة لـ 12 عموداً موحداً.
 */
export function printGroupByReport(
  dataset: AggregatedShipment[],
  filterInfo?: PrintReportFilterInfo
): Promise<void> {
  return new Promise((resolve) => {
    // 1. حساب الإحصائيات العامة
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

      // تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic)
      if (group.items.length === 1) {
        // حركة فرعية واحدة فقط -> عرض سطر واحد فقط دون تكرار صفوف المجاميع
        const sub = group.items[0];
        const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

        tableRowsHtml += `
          <tr class="single-row">
            <td class="col-type text-right single-tag">● حركة مستقلة [${groupIdx + 1}]</td>
            <td class="col-code text-center font-mono font-bold text-blue">${escapeHtml(group.code)}</td>
            <td class="col-container text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
            <td class="col-shipment text-center">
              <span class="badge ${group.shipmentType === 'جوي' ? 'badge-air' : 'badge-sea'}">
                ${escapeHtml(group.shipmentType)}
              </span>
            </td>
            <td class="col-subno text-center font-mono">${escapeHtml(sub.no || 1)}</td>
            <td class="col-goods text-right font-medium">${escapeHtml(sub.goodsType || '-')}</td>
            <td class="col-cartons text-center font-bold text-navy">${group.totalCartons.toLocaleString('en-US')}</td>
            <td class="col-weight text-center font-bold">${group.totalWeight.toFixed(2)}</td>
            <td class="col-volume text-center font-bold">${group.totalVolume.toFixed(3)}</td>
            <td class="col-price text-center font-bold">$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}</td>
            <td class="col-customs text-left font-bold text-emerald">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="col-invoice text-center font-mono text-slate">${escapeHtml(sub.invoiceNo || '-')}</td>
          </tr>
        `;
      } else {
        // حركتان أو أكثر -> الحفاظ على الهيكل المجمع الكامل (كود رئيسي + حركات فرعية + مجموع الكود)
        // أ. صف الكود الرئيسي المجمع
        tableRowsHtml += `
          <tr class="master-row">
            <td class="col-type text-right font-bold master-tag">▶ كود رئيسي [${groupIdx + 1}]</td>
            <td class="col-code text-center font-mono font-bold text-blue">${escapeHtml(group.code)}</td>
            <td class="col-container text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
            <td class="col-shipment text-center">
              <span class="badge ${group.shipmentType === 'جوي' ? 'badge-air' : 'badge-sea'}">
                ${escapeHtml(group.shipmentType)}
              </span>
            </td>
            <td class="col-subno text-center font-bold text-slate">إجمالي ${group.items.length}</td>
            <td class="col-goods text-right font-bold">[كافة بضائع الكود: ${escapeHtml(group.code)}]</td>
            <td class="col-cartons text-center font-bold text-navy">${group.totalCartons.toLocaleString('en-US')}</td>
            <td class="col-weight text-center font-bold">${group.totalWeight.toFixed(2)}</td>
            <td class="col-volume text-center font-bold">${group.totalVolume.toFixed(3)}</td>
            <td class="col-price text-center font-bold">$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}</td>
            <td class="col-customs text-left font-bold text-emerald">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="col-invoice text-center text-slate font-bold">-</td>
          </tr>
        `;

        // ب. صفوف الحركات والسجلات الفرعية التابعة للكود
        group.items.forEach((sub, subIdx) => {
          const isOdd = subIdx % 2 === 1;
          const rowClass = isOdd ? 'sub-row sub-row-odd' : 'sub-row sub-row-even';
          const customsVal = Number(sub.customsAmountUSD || 0);

          tableRowsHtml += `
            <tr class="${rowClass}">
              <td class="col-type text-right text-slate sub-indent">&nbsp;&nbsp;&nbsp;↳ حركة (#${subIdx + 1})</td>
              <td class="col-code text-center font-mono text-slate">${escapeHtml(group.code)}</td>
              <td class="col-container text-center text-slate">${escapeHtml(group.containerNo || '-')}</td>
              <td class="col-shipment text-center text-slate">${escapeHtml(group.shipmentType)}</td>
              <td class="col-subno text-center font-mono text-slate">${escapeHtml(sub.no || subIdx + 1)}</td>
              <td class="col-goods text-right">${escapeHtml(sub.goodsType || '-')}</td>
              <td class="col-cartons text-center font-bold">${sub.cartons}</td>
              <td class="col-weight text-center">${Number(sub.weight || 0).toFixed(2)}</td>
              <td class="col-volume text-center">${Number(sub.volume || 0).toFixed(3)}</td>
              <td class="col-price text-center">$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}</td>
              <td class="col-customs text-left font-bold text-sub-emerald">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="col-invoice text-center font-mono text-slate">${escapeHtml(sub.invoiceNo || '-')}</td>
            </tr>
          `;
        });

        // ج. صف المجموع الفرعي الخاص بهذا الكود
        tableRowsHtml += `
          <tr class="subtotal-row">
            <td class="col-type text-right font-bold">∑ مجموع الكود (${escapeHtml(group.code)})</td>
            <td class="col-code text-center font-bold font-mono">${escapeHtml(group.code)}</td>
            <td class="col-container text-center font-bold">${escapeHtml(group.containerNo || '-')}</td>
            <td class="col-shipment text-center font-bold">${escapeHtml(group.shipmentType)}</td>
            <td class="col-subno text-center font-bold">${group.items.length} حركات</td>
            <td class="col-goods text-right font-bold">--- ملخص إجمالي الكود ---</td>
            <td class="col-cartons text-center font-bold text-navy">${group.totalCartons.toLocaleString('en-US')}</td>
            <td class="col-weight text-center font-bold">${group.totalWeight.toFixed(2)}</td>
            <td class="col-volume text-center font-bold">${group.totalVolume.toFixed(3)}</td>
            <td class="col-price text-center font-bold text-slate">-</td>
            <td class="col-customs text-left font-bold text-emerald">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="col-invoice text-center font-bold text-slate">-</td>
          </tr>
          <tr class="separator-row">
            <td colspan="12" class="separator-cell"></td>
          </tr>
        `;
      }
    });

    // صف الإجمالي العام النهائي الشامل
    const grandTotalRowHtml = `
      <tr class="grand-total-row">
        <td class="col-type text-right font-bold text-sky">=== الإجمالي العام ===</td>
        <td class="col-code text-center font-bold text-sky">${dataset.length} كود</td>
        <td class="col-container text-center font-bold">-</td>
        <td class="col-shipment text-center font-bold">-</td>
        <td class="col-subno text-center font-bold">${grandSubItemsCount} حركة</td>
        <td class="col-goods text-right font-bold">إجمالي كافة السجلات</td>
        <td class="col-cartons text-center font-bold text-gold">${grandCartons.toLocaleString('en-US')}</td>
        <td class="col-weight text-center font-bold text-sky">${grandWeight.toFixed(2)}</td>
        <td class="col-volume text-center font-bold text-pink">${grandVolume.toFixed(3)}</td>
        <td class="col-price text-center font-bold text-slate">-</td>
        <td class="col-customs text-left font-bold text-lightgreen">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="col-invoice text-center font-bold">-</td>
      </tr>
    `;

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10);
    const formattedTime = now.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let filterBadge = 'كافة الأكواد والحركات';
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
        <title>تقرير_الشحنات_والحركات_المجمع_${formattedDate}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 12px;
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            font-size: 11px;
            direction: rtl;
          }
          .header-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%);
            color: #ffffff;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 12px;
            border: 1px solid #334155;
          }
          .header-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #334155;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header-title-row h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 800;
            color: #ffffff;
          }
          .header-title-row p {
            margin: 0;
            font-size: 11px;
            color: #94a3b8;
          }
          .badges-row {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .hdr-badge {
            background-color: #334155;
            border: 1px solid #475569;
            color: #f8fafc;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 10.5px;
            font-weight: 600;
          }
          .hdr-badge.primary {
            background-color: #2563eb;
            border-color: #3b82f6;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
          }
          .kpi-card {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 8px 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .kpi-card.kpi-blue { background-color: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
          .kpi-card.kpi-amber { background-color: #fffbeb; border-color: #fde68a; color: #92400e; }
          .kpi-card.kpi-sky { background-color: #f0f9ff; border-color: #bae6fd; color: #0369a1; }
          .kpi-card.kpi-orange { background-color: #fff7ed; border-color: #fed7aa; color: #9a3412; }
          .kpi-card.kpi-emerald { background-color: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
          .kpi-label { font-size: 10px; font-weight: 600; opacity: 0.85; margin-bottom: 2px; }
          .kpi-value { font-size: 16px; font-weight: 800; font-family: 'Cairo', sans-serif; }
          .kpi-sub { font-size: 9.5px; opacity: 0.75; }

          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            border: 1px solid #cbd5e1;
            margin-top: 6px;
          }
          table.data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            padding: 7px 5px;
            border: 1px solid #334155;
            font-size: 10.5px;
          }
          table.data-table td {
            padding: 5px 5px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          .single-row {
            background-color: #ffffff;
            border-bottom: 1px solid #cbd5e1;
          }
          .single-tag {
            background-color: #f8fafc;
            color: #334155;
            font-weight: bold;
          }
          .master-row {
            background-color: #dbeafe;
            color: #1e3a8a;
            font-weight: bold;
            border-top: 2px solid #2563eb;
            border-bottom: 1px solid #93c5fd;
          }
          .master-tag {
            background-color: #bfdbfe;
            color: #1e3a8a;
          }
          .sub-row-even { background-color: #ffffff; }
          .sub-row-odd { background-color: #f8fafc; }
          .sub-indent {
            font-family: Consolas, monospace;
            color: #64748b;
          }
          .subtotal-row {
            background-color: #fef3c7;
            color: #92400e;
            font-weight: bold;
            border-top: 1px dashed #d97706;
            border-bottom: 2px solid #d97706;
          }
          .separator-row {
            height: 6px;
            background-color: #f1f5f9;
          }
          .separator-cell {
            padding: 0 !important;
            border: none !important;
            height: 6px;
            background-color: #f1f5f9;
          }
          .grand-total-row {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: bold;
            font-size: 11.5px;
            border-top: 3px double #38bdf8;
            border-bottom: 3px double #38bdf8;
          }
          .badge {
            display: inline-block;
            padding: 1.5px 6px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: bold;
          }
          .badge-air { background-color: #e0e7ff; color: #3730a3; }
          .badge-sea { background-color: #dcfce7; color: #166534; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          .font-mono { font-family: Consolas, Monaco, monospace; }
          .text-blue { color: #1d4ed8; }
          .text-navy { color: #0f172a; }
          .text-emerald { color: #047857; }
          .text-sub-emerald { color: #059669; }
          .text-slate { color: #64748b; }
          .text-sky { color: #38bdf8; }
          .text-gold { color: #facc15; }
          .text-pink { color: #f472b6; }
          .text-lightgreen { color: #4ade80; }

          .footer-note {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="header-title-row">
            <div>
              <h1>تقرير تجميع الشحنات والحركات التفصيلي (Group By Code)</h1>
              <p>تقرير إحصائي رسمي بنظام تجميع الحركات المدمجة وحساب الرسوم الجمركية وفق شروط الشحن</p>
            </div>
            <div class="badges-row">
              <span class="hdr-badge primary">تاريخ الإنشاء: ${formattedDate} - ${formattedTime}</span>
              <span class="hdr-badge">${filterBadge}</span>
              <span class="hdr-badge">إجمالي الأكواد: ${dataset.length}</span>
            </div>
          </div>
          <div class="kpi-grid">
            <div class="kpi-card kpi-blue">
              <div class="kpi-label">إجمالي الأكواد المجمعة</div>
              <div class="kpi-value">${dataset.length}</div>
              <div class="kpi-sub">كود شحنة مدمج</div>
            </div>
            <div class="kpi-card kpi-amber">
              <div class="kpi-label">إجمالي الحركات الفرعية</div>
              <div class="kpi-value">${grandSubItemsCount}</div>
              <div class="kpi-sub">حركة مفردة ومجمعة</div>
            </div>
            <div class="kpi-card kpi-sky">
              <div class="kpi-label">إجمالي الكراتين</div>
              <div class="kpi-value">${grandCartons.toLocaleString('en-US')}</div>
              <div class="kpi-sub">كرتونة (Carton)</div>
            </div>
            <div class="kpi-card kpi-orange">
              <div class="kpi-label">الوزن / الحجم</div>
              <div class="kpi-value">${grandWeight.toLocaleString('en-US', { maximumFractionDigits: 1 })} kg</div>
              <div class="kpi-sub">${grandVolume.toFixed(3)} CBM</div>
            </div>
            <div class="kpi-card kpi-emerald">
              <div class="kpi-label">إجمالي مبالغ الجمرك ($)</div>
              <div class="kpi-value">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div class="kpi-sub">بالدولار الأمريكي</div>
            </div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 14%; text-align: right;">نوع السجل / البيان</th>
              <th style="width: 8%; text-align: center;">الكود (Code)</th>
              <th style="width: 8%; text-align: center;">رقم الحاوية</th>
              <th style="width: 5%; text-align: center;">النوع</th>
              <th style="width: 6%; text-align: center;">رقم الحركة</th>
              <th style="width: 14%; text-align: right;">نوع البضاعة</th>
              <th style="width: 6%; text-align: center;">الكراتين</th>
              <th style="width: 7%; text-align: center;">الوزن (kg)</th>
              <th style="width: 7%; text-align: center;">الحجم (CBM)</th>
              <th style="width: 7%; text-align: center;">سعر البيع $</th>
              <th style="width: 11%; text-align: left;">مبلغ الجمرك ($)</th>
              <th style="width: 7%; text-align: center;">رقم الفاتورة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            ${grandTotalRowHtml}
          </tbody>
        </table>

        <div class="footer-note">
          <div>نظام معالجة وتجميع الشحنات • تم تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic)</div>
          <div>صفحة تقرير رسمية • مطابقة للحسابات المعتمدة</div>
        </div>
      </body>
      </html>
    `;

    // استخدام نافذة طباعة مخصصة أو iframe لتشغيل الطباعة مباشرة
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
