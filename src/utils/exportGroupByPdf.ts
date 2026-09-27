import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AggregatedShipment } from '../types';
import { formatDisplayCode } from './printGroupByReport';
import { LOGISTICS_LOGO_BASE64 } from '../assets/logoBase64';

export interface ExportPdfOptions {
  searchQuery?: string;
  totalMasterCount?: number;
  filename?: string;
  openInNewTab?: boolean;
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

/**
 * تصدير تقرير الحركات المنسق (Group-By Report) كملف PDF عالي الدقة عبر jsPDF و html2canvas
 * مع ترويسة رسمية وشعار الشركة، وتطبيق قاعدة أرقام التسلسل الصحيحة (Integer-Only Sequence)
 * والأعمدة الـ 12 والتظليلات المعتمدة.
 */
export async function exportGroupByPdf(
  dataset: AggregatedShipment[],
  options?: ExportPdfOptions
): Promise<void> {
  if (!dataset || dataset.length === 0) {
    alert('لا توجد بيانات متاحة لتصدير ملف الـ PDF!');
    return;
  }

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

    const formattedCode = formatDisplayCode(group.code);

    // تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic)
    if (group.items.length === 1) {
      const sub = group.items[0];
      const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

      tableRowsHtml += `
        <tr style="background-color: #ffffff; border-bottom: 1px solid #cbd5e1;">
          <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #334155;">${groupIdx + 1}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #1e293b;">${escapeHtml(group.containerNo || '-')}</td>
          <td style="text-align: center; padding: 5px; border: 1px solid #e2e8f0;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; ${group.shipmentType === 'جوي' ? 'background-color: #e0e7ff; color: #3730a3;' : 'background-color: #dcfce7; color: #166534;'}">
              ${escapeHtml(group.shipmentType)}
            </span>
          </td>
          <td style="text-align: center; font-family: monospace; padding: 5px; border: 1px solid #e2e8f0; color: #475569;">${escapeHtml(sub.invoiceNo || '-')}</td>
          <td style="text-align: right; padding: 5px; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${escapeHtml(sub.goodsType || '-')}</td>
          <td style="text-align: right; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; background-color: #f8fafc; color: #475569;">● حركة مستقلة</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #0f172a;">${group.totalCartons.toLocaleString('en-US')}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #334155;">${group.totalWeight.toFixed(2)}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #334155;">${group.totalVolume.toFixed(3)}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #1e293b;">$${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}</td>
          <td style="text-align: left; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0; color: #047857; font-family: monospace;">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 5px; border: 1px solid #e2e8f0;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;">
              ${escapeHtml(formattedCode)}
            </span>
          </td>
        </tr>
      `;
    } else {
      // أ. صف الكود الرئيسي المجمع (تظليل دافئ وناعم)
      tableRowsHtml += `
        <tr style="background-color: #fffbeb; color: #78350f; font-weight: bold; border-top: 2px solid #f59e0b; border-bottom: 1px solid #fde68a;">
          <td style="text-align: center; font-family: monospace; font-weight: 900; padding: 6px 5px; border: 1px solid #fde68a;">${groupIdx + 1}</td>
          <td style="text-align: center; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a;">${escapeHtml(group.containerNo || '-')}</td>
          <td style="text-align: center; padding: 6px 5px; border: 1px solid #fde68a;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; ${group.shipmentType === 'جوي' ? 'background-color: #e0e7ff; color: #3730a3;' : 'background-color: #dcfce7; color: #166534;'}">
              ${escapeHtml(group.shipmentType)}
            </span>
          </td>
          <td style="text-align: center; color: #94a3b8; padding: 6px 5px; border: 1px solid #fde68a;">-</td>
          <td style="text-align: right; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a;">كافة بضائع الكود ${escapeHtml(formattedCode)}</td>
          <td style="text-align: right; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a; background-color: #fef3c7; color: #92400e;">
            ▶ كود رئيسي مجمّع (${group.items.length} حركات)
          </td>
          <td style="text-align: center; font-weight: 900; padding: 6px 5px; border: 1px solid #fde68a; color: #0f172a;">${group.totalCartons.toLocaleString('en-US')}</td>
          <td style="text-align: center; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a;">${group.totalWeight.toFixed(2)}</td>
          <td style="text-align: center; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a;">${group.totalVolume.toFixed(3)}</td>
          <td style="text-align: center; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a;">$${(group.sellingPriceUSD ?? 325.0).toFixed(2)}</td>
          <td style="text-align: left; font-weight: 900; padding: 6px 5px; border: 1px solid #fde68a; color: #065f46; font-family: monospace;">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px 5px; border: 1px solid #fde68a;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;">
              ${escapeHtml(formattedCode)}
            </span>
          </td>
        </tr>
      `;

      // ب. صفوف الحركات والسجلات الفرعية التابعة للكود (أرقام التسلسل فارغة تماماً Blank للفرعيات)
      group.items.forEach((sub, subIdx) => {
        const isOdd = subIdx % 2 === 1;
        const customsVal = Number(sub.customsAmountUSD || 0);

        tableRowsHtml += `
          <tr style="background-color: ${isOdd ? '#f8fafc' : '#ffffff'}; color: #334155;">
            <!-- قاعدة أرقام التسلسل الصحيحة: خلية التسلسل للحركات الفرعية فارغة تماماً -->
            <td style="text-align: center; padding: 4.5px 5px; border: 1px solid #e2e8f0;">&nbsp;</td>
            <td style="text-align: center; color: #64748b; padding: 4.5px 5px; border: 1px solid #e2e8f0;">${escapeHtml(group.containerNo || '-')}</td>
            <td style="text-align: center; color: #64748b; padding: 4.5px 5px; border: 1px solid #e2e8f0;">${escapeHtml(group.shipmentType)}</td>
            <td style="text-align: center; font-family: monospace; color: #64748b; padding: 4.5px 5px; border: 1px solid #e2e8f0;">${escapeHtml(sub.invoiceNo || '-')}</td>
            <td style="text-align: right; padding: 4.5px 5px; border: 1px solid #e2e8f0; color: #1e293b;">${escapeHtml(sub.goodsType || '-')}</td>
            <td style="text-align: right; font-family: monospace; color: #64748b; padding: 4.5px 5px; border: 1px solid #e2e8f0; padding-right: 12px;">
              ↳ حركة فرعية #${subIdx + 1}
            </td>
            <td style="text-align: center; font-weight: bold; padding: 4.5px 5px; border: 1px solid #e2e8f0; color: #1e293b;">${sub.cartons}</td>
            <td style="text-align: center; font-family: monospace; color: #475569; padding: 4.5px 5px; border: 1px solid #e2e8f0;">${Number(sub.weight || 0).toFixed(2)}</td>
            <td style="text-align: center; font-family: monospace; color: #475569; padding: 4.5px 5px; border: 1px solid #e2e8f0;">${Number(sub.volume || 0).toFixed(3)}</td>
            <td style="text-align: center; font-family: monospace; color: #475569; padding: 4.5px 5px; border: 1px solid #e2e8f0;">$${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}</td>
            <td style="text-align: left; font-weight: bold; color: #059669; font-family: monospace; padding: 4.5px 5px; border: 1px solid #e2e8f0;">$${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: center; font-family: monospace; color: #64748b; font-size: 10px; padding: 4.5px 5px; border: 1px solid #e2e8f0;">${escapeHtml(formattedCode)}</td>
          </tr>
        `;
      });

      // ج. صف المجموع الفرعي الخاص بهذا الكود (تظليل دافئ وناعم)
      tableRowsHtml += `
        <tr style="background-color: #fef3c7; color: #78350f; font-weight: bold; border-top: 1px dashed #d97706; border-bottom: 2px solid #b45309;">
          <td style="text-align: center; font-weight: 900; padding: 5px; border: 1px solid #fde68a;">∑</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #fde68a;">${escapeHtml(group.containerNo || '-')}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #fde68a;">${escapeHtml(group.shipmentType)}</td>
          <td style="text-align: center; color: #94a3b8; padding: 5px; border: 1px solid #fde68a;">-</td>
          <td style="text-align: right; font-weight: bold; padding: 5px; border: 1px solid #fde68a;">ملخص إجمالي الكود</td>
          <td style="text-align: right; font-weight: bold; padding: 5px; border: 1px solid #fde68a;">مجموع الكود ${escapeHtml(formattedCode)}</td>
          <td style="text-align: center; font-weight: 900; padding: 5px; border: 1px solid #fde68a; color: #0f172a;">${group.totalCartons.toLocaleString('en-US')}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #fde68a;">${group.totalWeight.toFixed(2)}</td>
          <td style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid #fde68a;">${group.totalVolume.toFixed(3)}</td>
          <td style="text-align: center; color: #94a3b8; padding: 5px; border: 1px solid #fde68a;">-</td>
          <td style="text-align: left; font-weight: 900; padding: 5px; border: 1px solid #fde68a; color: #065f46; font-family: monospace;">$${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 5px; border: 1px solid #fde68a; color: #78350f;">${escapeHtml(formattedCode)}</td>
        </tr>
      `;
    }
  });

  // صف المجموع النهائي العام في أسفل الجدول (خلفية داكنة واضحة وخط عريض)
  const grandTotalRowHtml = `
    <tr style="background-color: #0f172a; color: #ffffff; font-weight: 900; border-top: 3px double #38bdf8;">
      <td style="text-align: center; color: #facc15; font-family: monospace; padding: 7px 5px; border: 1px solid #1e293b;">===</td>
      <td style="text-align: center; padding: 7px 5px; border: 1px solid #1e293b;">-</td>
      <td style="text-align: center; padding: 7px 5px; border: 1px solid #1e293b;">-</td>
      <td style="text-align: center; padding: 7px 5px; border: 1px solid #1e293b;">-</td>
      <td style="text-align: right; padding: 7px 5px; border: 1px solid #1e293b;">إجمالي كافة السجلات</td>
      <td style="text-align: right; color: #38bdf8; padding: 7px 5px; border: 1px solid #1e293b;">الإجمالي العام (${dataset.length} كود / ${grandSubItemsCount} حركة)</td>
      <td style="text-align: center; color: #facc15; font-family: monospace; padding: 7px 5px; border: 1px solid #1e293b;">${grandCartons.toLocaleString('en-US')}</td>
      <td style="text-align: center; color: #38bdf8; font-family: monospace; padding: 7px 5px; border: 1px solid #1e293b;">${grandWeight.toFixed(2)}</td>
      <td style="text-align: center; color: #f472b6; font-family: monospace; padding: 7px 5px; border: 1px solid #1e293b;">${grandVolume.toFixed(3)}</td>
      <td style="text-align: center; color: #64748b; padding: 7px 5px; border: 1px solid #1e293b;">-</td>
      <td style="text-align: left; color: #4ade80; font-family: monospace; padding: 7px 5px; border: 1px solid #1e293b;">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="text-align: center; color: #facc15; font-family: monospace; padding: 7px 5px; border: 1px solid #1e293b;">(${dataset.length} كود)</td>
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

  const filterText = options?.searchQuery?.trim()
    ? `تصفية بالبحث: "${options.searchQuery}"`
    : 'كافة الأكواد والشحنات';

  const reportInnerHtml = `
    <!-- 1. الهيدر البارز وشعار الشركة والترويسة الرسمية -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%); color: #ffffff; border-radius: 12px; padding: 18px 22px; margin-bottom: 14px; border: 1px solid #334155;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <!-- الشعار الاحترافي للشحن والتخليص -->
          <div style="width: 58px; height: 58px; border-radius: 12px; background-color: #ffffff; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <img src="${LOGISTICS_LOGO_BASE64}" alt="Atlas Logistics Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;" />
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 800; color: #facc15; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
              شركة أطلس للشحن والخدمات اللوجستية والتخليص الجمركي الموحد
            </div>
            <h1 style="margin: 0; font-size: 21px; font-weight: 900; color: #ffffff; letter-spacing: -0.3px;">
              تقرير تجميع الشحنات والحركات التفصيلي (Group-By Code)
            </h1>
            <p style="margin: 3px 0 0 0; font-size: 11px; color: #94a3b8;">
              نظام معالجة وتجميع بيانات الشحنات والرسوم الجمركية وفق قاعدة عدم التكرار (Single-Movement Clean Logic)
            </p>
          </div>
        </div>
        <div>
          <span style="display: inline-block; background-color: #334155; border: 1px solid #475569; color: #f8fafc; padding: 6px 14px; border-radius: 8px; font-size: 11.5px; font-weight: bold;">
            ${escapeHtml(filterText)}
          </span>
        </div>
      </div>

      <!-- شريط معلومات التقرير العلوي (تاريخ الإصدار، إجمالي الحركات، إجمالي الكراتين، وإجمالي الجمرك) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; text-align: center; color: #1e293b;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 2px;">تاريخ الإصدار</div>
          <div style="font-size: 13.5px; font-weight: 900;">${formattedDate}</div>
          <div style="font-size: 9.5px; color: #94a3b8; margin-top: 1px;">${formattedTime}</div>
        </div>
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; text-align: center; color: #92400e;">
          <div style="font-size: 10px; font-weight: bold; color: #b45309; margin-bottom: 2px;">إجمالي الحركات</div>
          <div style="font-size: 15px; font-weight: 900;">${grandSubItemsCount} <span style="font-size: 11px; font-weight: normal;">حركة</span></div>
          <div style="font-size: 9.5px; color: #b45309; margin-top: 1px;">عبر ${dataset.length} كود مجمع</div>
        </div>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; text-align: center; color: #1e40af;">
          <div style="font-size: 10px; font-weight: bold; color: #2563eb; margin-bottom: 2px;">إجمالي الكراتين</div>
          <div style="font-size: 15px; font-weight: 900; font-family: monospace;">${grandCartons.toLocaleString('en-US')} <span style="font-size: 11px; font-family: sans-serif; font-weight: normal;">كرتونة</span></div>
          <div style="font-size: 9.5px; color: #2563eb; margin-top: 1px;">${grandWeight.toFixed(1)} كجم | ${grandVolume.toFixed(2)} CBM</div>
        </div>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 12px; text-align: center; color: #065f46;">
          <div style="font-size: 10px; font-weight: bold; color: #059669; margin-bottom: 2px;">إجمالي الجمرك ($)</div>
          <div style="font-size: 15px; font-weight: 900; font-family: monospace;">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="font-size: 9.5px; color: #059669; margin-top: 1px;">مجموع رسوم الجمرك</div>
        </div>
      </div>
    </div>

    <!-- 2. جدول الأعمدة الـ 12 المعتمد -->
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f172a; color: #ffffff; font-weight: 900; text-align: center; font-size: 10.5px;">
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 4%;">التسلسل</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 9%;">رقم الحاوية</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 6%;">نوع الشحنة</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 8%;">رقم الفاتورة</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 14%; text-align: right;">نوع البضاعة</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 15%; text-align: right;">بيان الحركة</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 7%;">عدد الكراتين</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 7%;">الوزن كجم</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 7%;">الحجم CBM</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 7%;">سعر البيع $</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 9%; text-align: left;">مبلغ الجمرك $</th>
          <th style="padding: 8px 4px; border: 1px solid #334155; width: 7%;">الكود الرئيسي</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        ${grandTotalRowHtml}
      </tbody>
    </table>

    <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px;">
      <div>نظام معالجة وتجميع الشحنات • تم تطبيق قاعدة عدم التكرار (Single-Movement Clean Logic) • الكود معروض بصيغة (Code)</div>
      <div>صفحة تقرير رسمية صادرة من نظام شركة أطلس للخدمات اللوجستية والتخليص الجمركي</div>
    </div>
  `;

  // استخدام iframe معزول تماماً لمنع أي تداخل مع أنماط Tailwind CSS الحديثة (oklch)
  // يضمن هذا عدم مواجهة خطأ "unsupported color function oklch" على الإطلاق
  const iframe = document.createElement('iframe');
  iframe.id = '__pdf_render_isolated_frame__';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '-99999px';
  iframe.style.width = '1240px';
  iframe.style.height = '1400px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'visible';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('تعذر الوصول إلى مستند العرض المخصص لتوليد الـ PDF');
    }

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border-color: #cbd5e1;
      outline-color: transparent;
      text-decoration-color: currentColor;
    }
    html, body {
      background-color: #ffffff !important;
      color: #1e293b !important;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
      direction: rtl !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 1240px !important;
    }
    #pdf-content-wrapper {
      width: 1240px;
      padding: 24px 30px;
      background-color: #ffffff;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="pdf-content-wrapper">
    ${reportInnerHtml}
  </div>
</body>
</html>`);
    iframeDoc.close();

    // انتظار تحميل الخطوط الجاهزة والتخطيط
    if (iframeDoc.fonts && iframeDoc.fonts.ready) {
      try {
        await iframeDoc.fonts.ready;
      } catch {
        // متابعة التنفيذ في حال عدم توفر الإنترنت للخطوط
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    const renderElement = iframeDoc.getElementById('pdf-content-wrapper') || iframeDoc.body;

    // التقاط صورة الكانفاس بدقة عالية Scale 2 مع معالجة الألوان الآمنة
    const canvas = await html2canvas(renderElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1240,
      onclone: (clonedDoc) => {
        // حماية إضافية ضد أي قواعد ألوان غير مدعومة
        const styles = Array.from(clonedDoc.querySelectorAll('style, link[rel="stylesheet"]'));
        styles.forEach((s) => {
          if (s.textContent && s.textContent.includes('oklch')) {
            s.remove();
          }
        });
      },
    });

    // إعداد مستند A4 أفقي (Landscape) عبر jsPDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm
    const margin = 6; // 6mm margin

    const printableWidth = pageWidth - margin * 2; // 285 mm
    const printableHeight = pageHeight - margin * 2; // 198 mm

    const imgWidth = printableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // إذا كان التقرير يلائم صفحة واحدة
    if (imgHeight <= printableHeight) {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      // إذا كان التقرير طويلاً، يتم تقسيمه على صفحات متعددة بشكل سلس ونظيف
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');

      const pxPerPage = Math.floor((canvas.width * printableHeight) / printableWidth);
      pageCanvas.width = canvas.width;
      pageCanvas.height = pxPerPage;

      let renderedHeight = 0;
      let pageIdx = 0;

      while (renderedHeight < canvas.height) {
        if (pageIdx > 0) {
          pdf.addPage('a4', 'landscape');
        }

        const currentSliceHeight = Math.min(pxPerPage, canvas.height - renderedHeight);
        pageCanvas.height = currentSliceHeight;

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, currentSliceHeight);
          pageCtx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            currentSliceHeight,
            0,
            0,
            canvas.width,
            currentSliceHeight
          );

          const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const sliceMmHeight = (currentSliceHeight * printableWidth) / canvas.width;
          pdf.addImage(sliceImgData, 'JPEG', margin, margin, printableWidth, sliceMmHeight);
        }

        renderedHeight += currentSliceHeight;
        pageIdx++;
      }
    }

    const defaultFilename = `Shipment_GroupBy_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    const finalFilename = options?.filename || defaultFilename;

    try {
      // 1. توليد كائن Blob مباشر من المستند
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // 2. إذا طُلب فتحه مباشرة للمعاينة
      if (options?.openInNewTab) {
        window.open(blobUrl, '_blank');
      }

      // 3. محاولة التنزيل التلقائي عبر رابط مخفي (أكثر الطرق توافقاً مع المتصفحات وبيئات الـ Iframe)
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = finalFilename;
      downloadLink.target = '_blank';
      downloadLink.rel = 'noopener noreferrer';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // تنظيف الرابط بعد مهلة
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
      }, 60000);

      // طريقة احتياطية ثانوية عبر pdf.save المباشرة
      try {
        pdf.save(finalFilename);
      } catch (saveErr) {
        console.warn('pdf.save direct call failed, relying on blob download:', saveErr);
      }
    } catch (blobErr) {
      console.warn('Blob generation error, falling back to pdf.save:', blobErr);
      pdf.save(finalFilename);
    }
  } catch (error) {
    console.error('Error generating PDF via jsPDF:', error);
    alert('حدث خطأ أثناء تصدير ملف الـ PDF. يرجى تجربة خيار الطباعة المباشرة.');
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
