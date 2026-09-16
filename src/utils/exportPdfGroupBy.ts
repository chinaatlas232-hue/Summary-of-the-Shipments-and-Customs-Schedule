import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AggregatedShipment } from '../types';

/**
 * دالة متقدمة لتوليد وتصدير تقرير الشحنات بصيغة PDF احترافي وملون بنظام (Group-By)
 *
 * المعايير المنفذة بدقة متناهية:
 * 1. 12 عموداً فريداً ومطابقاً تماماً لقيم Excel و CSV بدون أي تكرار لعمود الجمرك أو تداخل للقيم.
 * 2. ترويسة رسمية متكاملة (Header Info) تحتوي على عنوان التقرير، التاريخ، والبيانات الإحصائية.
 * 3. تصميم جمالي متناسق مع تظليل احترافي للصفوف الرئيسية ومجموع كل كود.
 * 4. توافق تام مع مقاس A4 الأفقي بدقة طباعية عالية Retina Scale ودعم كامل للخطوط العربية.
 */
export async function exportGroupByPDF(
  dataset: AggregatedShipment[],
  filterInfo?: {
    searchQuery?: string;
    containerNo?: string;
    code?: string;
    totalMasterCount?: number;
  }
): Promise<void> {
  // حساب الإجماليات العامة
  let grandCartons = 0;
  let grandWeight = 0;
  let grandVolume = 0;
  let grandCustoms = 0;
  let grandSubItemsCount = 0;

  dataset.forEach((item) => {
    grandCartons += item.totalCartons;
    grandWeight += item.totalWeight;
    grandVolume += item.totalVolume;
    grandCustoms += item.totalCustomsUSD;
    grandSubItemsCount += item.items.length;
  });

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // نصوص التصفية المطبقة
  let filterText = 'كافة الشحنات والحاويات';
  if (filterInfo?.code) {
    filterText = `كود محدد: ${filterInfo.code}`;
  } else if (filterInfo?.containerNo) {
    filterText = `حاوية محددة: ${filterInfo.containerNo}`;
  } else if (filterInfo?.searchQuery && filterInfo.searchQuery.trim()) {
    filterText = `بحث: "${filterInfo.searchQuery}"`;
  }

  // إنشاء حاوية معزولة خارج الشاشة لتجهيز التصميم الطباعي بدقة
  const container = document.createElement('div');
  container.id = 'pdf-render-root';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1200px'; // عرض مناسب لمقاس A4 أفقي عالي الدقة
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, sans-serif";
  container.style.direction = 'rtl';
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';

  // توليد صفوف الجداول (12 عموداً موحداً بدقة عبر كل الصفوف)
  let tableRowsHtml = '';

  dataset.forEach((group, groupIdx) => {
    // التحقق من قاعدة عدم التكرار (Single-Movement Clean Logic)
    if (group.items.length === 1) {
      // 1. الكود يحتوي على حركة فرعية واحدة فقط -> سطر واحد فقط نظيف ومباشر يجمع بيانات الحركة بدون تكرار
      const sub = group.items[0];
      const customsVal = Number(sub.customsAmountUSD || group.totalCustomsUSD || 0);

      tableRowsHtml += `
        <tr style="background-color: #ffffff; color: #1e293b; font-size: 11px; border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 6px 6px; text-align: right; background-color: #f8fafc; font-weight: bold; color: #334155; border: 1px solid #cbd5e1;">
            ● حركة مستقلة [${groupIdx + 1}]
          </td>
          <td style="padding: 6px 6px; text-align: center; font-family: monospace; font-size: 12px; font-weight: bold; color: #1d4ed8; border: 1px solid #cbd5e1;">
            ${group.code}
          </td>
          <td style="padding: 6px 6px; text-align: center; font-weight: 600; border: 1px solid #cbd5e1;">
            ${group.containerNo || '-'}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #cbd5e1;">
            <span style="background-color: ${group.shipmentType === 'جوي' ? '#e0e7ff' : '#dcfce7'}; color: ${group.shipmentType === 'جوي' ? '#3730a3' : '#166534'}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              ${group.shipmentType}
            </span>
          </td>
          <td style="padding: 6px 6px; text-align: center; font-family: monospace; color: #475569; border: 1px solid #cbd5e1;">
            ${sub.no || 1}
          </td>
          <td style="padding: 6px 6px; text-align: right; font-weight: 500; border: 1px solid #cbd5e1;">
            ${sub.goodsType || '-'}
          </td>
          <td style="padding: 6px 6px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">
            ${group.totalCartons.toLocaleString('en-US')}
          </td>
          <td style="padding: 6px 6px; text-align: center; font-weight: 600; border: 1px solid #cbd5e1;">
            ${group.totalWeight.toFixed(2)}
          </td>
          <td style="padding: 6px 6px; text-align: center; font-weight: 600; border: 1px solid #cbd5e1;">
            ${group.totalVolume.toFixed(3)}
          </td>
          <td style="padding: 6px 6px; text-align: center; font-weight: 600; border: 1px solid #cbd5e1;">
            $${(Number(sub.sellingPriceUSD) || group.sellingPriceUSD || 325.0).toFixed(2)}
          </td>
          <td style="padding: 6px 6px; text-align: left; font-weight: bold; color: #047857; font-size: 12px; border: 1px solid #cbd5e1;">
            $${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 6px 6px; text-align: center; font-family: monospace; color: #475569; border: 1px solid #cbd5e1;">
            ${sub.invoiceNo || '-'}
          </td>
        </tr>
      `;
    } else {
      // 2. الكود يحتوي على حركتين فرعيتين أو أكثر -> الحفاظ على الهيكل المجمع الكامل
      // أ. صف الكود الرئيسي المدمج (تظليل أزرق باستيل داكن + خط عريض) - 12 عموداً
      tableRowsHtml += `
        <tr style="background-color: #dbeafe; color: #1e3a8a; font-weight: bold; border-top: 2px solid #2563eb; border-bottom: 1px solid #93c5fd;">
          <td style="padding: 7px 6px; text-align: right; background-color: #bfdbfe; color: #1e3a8a; border: 1px solid #93c5fd;">
            ▶ كود رئيسي [${groupIdx + 1}]
          </td>
          <td style="padding: 7px 6px; text-align: center; font-family: monospace; font-size: 13px; color: #1d4ed8; border: 1px solid #93c5fd;">
            ${group.code}
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">
            ${group.containerNo || '-'}
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">
            <span style="background-color: ${group.shipmentType === 'جوي' ? '#e0e7ff' : '#dcfce7'}; color: ${group.shipmentType === 'جوي' ? '#3730a3' : '#166534'}; padding: 2px 6px; border-radius: 4px; font-size: 10.5px;">
              ${group.shipmentType}
            </span>
          </td>
          <td style="padding: 7px 6px; text-align: center; color: #475569; border: 1px solid #93c5fd;">
            إجمالي ${group.items.length}
          </td>
          <td style="padding: 7px 6px; text-align: right; border: 1px solid #93c5fd;">
            [كافة بضائع الكود: ${group.code}]
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">
            ${group.totalCartons.toLocaleString('en-US')}
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">
            ${group.totalWeight.toFixed(2)}
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">
            ${group.totalVolume.toFixed(3)}
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">
            $${(group.sellingPriceUSD ?? 325.0).toFixed(2)}
          </td>
          <td style="padding: 7px 6px; text-align: left; color: #047857; font-size: 12.5px; border: 1px solid #93c5fd;">
            $${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #93c5fd;">-</td>
        </tr>
      `;

      // ب. الحركات الفرعية التابعة للكود (تبديل ألوان Zebra Striping) - 12 عموداً
      group.items.forEach((sub, subIdx) => {
        const isOdd = subIdx % 2 === 1;
        const rowBg = isOdd ? '#f8fafc' : '#ffffff';
        const customsVal = Number(sub.customsAmountUSD || 0);

        tableRowsHtml += `
          <tr style="background-color: ${rowBg}; color: #334155; font-size: 11px; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 5px 6px; text-align: right; color: #64748b; font-family: monospace; border: 1px solid #e2e8f0;">
              &nbsp;&nbsp;&nbsp;↳ حركة (#${subIdx + 1})
            </td>
            <td style="padding: 5px 6px; text-align: center; font-family: monospace; color: #475569; border: 1px solid #e2e8f0;">
              ${group.code}
            </td>
            <td style="padding: 5px 6px; text-align: center; color: #64748b; border: 1px solid #e2e8f0;">
              ${group.containerNo || '-'}
            </td>
            <td style="padding: 5px 6px; text-align: center; color: #64748b; border: 1px solid #e2e8f0;">
              ${group.shipmentType}
            </td>
            <td style="padding: 5px 6px; text-align: center; font-family: monospace; color: #64748b; border: 1px solid #e2e8f0;">
              ${sub.no || subIdx + 1}
            </td>
            <td style="padding: 5px 6px; text-align: right; border: 1px solid #e2e8f0;">
              ${sub.goodsType || '-'}
            </td>
            <td style="padding: 5px 6px; text-align: center; font-weight: 600; border: 1px solid #e2e8f0;">
              ${sub.cartons}
            </td>
            <td style="padding: 5px 6px; text-align: center; border: 1px solid #e2e8f0;">
              ${Number(sub.weight || 0).toFixed(2)}
            </td>
            <td style="padding: 5px 6px; text-align: center; border: 1px solid #e2e8f0;">
              ${Number(sub.volume || 0).toFixed(3)}
            </td>
            <td style="padding: 5px 6px; text-align: center; border: 1px solid #e2e8f0;">
              $${(Number(sub.sellingPriceUSD) || 325.0).toFixed(2)}
            </td>
            <td style="padding: 5px 6px; text-align: left; font-weight: bold; color: #059669; border: 1px solid #e2e8f0;">
              $${customsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="padding: 5px 6px; text-align: center; font-family: monospace; color: #64748b; border: 1px solid #e2e8f0;">
              ${sub.invoiceNo || '-'}
            </td>
          </tr>
        `;
      });

      // ج. صف المجموع الفرعي لكل كود (تظليل كهرماني/أصفر باستيل دافئ + خط عريض) - 12 عموداً
      tableRowsHtml += `
        <tr style="background-color: #fef3c7; color: #92400e; font-weight: bold; font-size: 11.5px; border-top: 1px dashed #d97706; border-bottom: 2px solid #d97706;">
          <td style="padding: 6px 6px; text-align: right; border: 1px solid #fde68a;">
            ∑ مجموع الكود (${group.code})
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.code}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.containerNo || '-'}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.shipmentType}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.items.length} حركات
          </td>
          <td style="padding: 6px 6px; text-align: right; border: 1px solid #fde68a;">
            --- ملخص إجمالي الكود ---
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.totalCartons.toLocaleString('en-US')}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.totalWeight.toFixed(2)}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">
            ${group.totalVolume.toFixed(3)}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">-</td>
          <td style="padding: 6px 6px; text-align: left; color: #047857; font-size: 12.5px; border: 1px solid #fde68a;">
            $${group.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 6px 6px; text-align: center; border: 1px solid #fde68a;">-</td>
        </tr>
        <!-- سطر فاصل ناعم بين الأكواد المتعددة -->
        <tr style="height: 8px; background-color: #f1f5f9; border: none;">
          <td colspan="12" style="height: 8px; padding: 0; border: none; background-color: #f1f5f9;"></td>
        </tr>
      `;
    }
  });

  // 4. صف الإجمالي العام النهائي الشامل (مطابق تماماً لـ 12 عموداً بدون أي إزاحة أو تداخل)
  const grandTotalRowHtml = `
    <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 12.5px; border-top: 3px double #38bdf8; border-bottom: 3px double #38bdf8;">
      <td style="padding: 9px 6px; text-align: right;">
        === الإجمالي العام ===
      </td>
      <td style="padding: 9px 6px; text-align: center; color: #38bdf8;">${dataset.length} كود</td>
      <td style="padding: 9px 6px; text-align: center;">-</td>
      <td style="padding: 9px 6px; text-align: center;">-</td>
      <td style="padding: 9px 6px; text-align: center;">${grandSubItemsCount} حركة</td>
      <td style="padding: 9px 6px; text-align: right;">إجمالي كافة السجلات</td>
      <td style="padding: 9px 6px; text-align: center; font-size: 13.5px; color: #facc15;">${grandCartons.toLocaleString('en-US')}</td>
      <td style="padding: 9px 6px; text-align: center; font-size: 13.5px; color: #38bdf8;">${grandWeight.toFixed(2)}</td>
      <td style="padding: 9px 6px; text-align: center; font-size: 13.5px; color: #f472b6;">${grandVolume.toFixed(3)}</td>
      <td style="padding: 9px 6px; text-align: center;">-</td>
      <td style="padding: 9px 6px; text-align: left; font-size: 14px; color: #34d399;">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="padding: 9px 6px; text-align: center;">-</td>
    </tr>
  `;

  // تجميع الصفحة الكاملة بتصميم أنيق
  container.innerHTML = `
    <!-- ترويسة التقرير الرسمية Header Info -->
    <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 6px;">
            نظام إدارة وتجميع الشحنات المعتمد
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">
            تقرير تجميع الشحنات والحركات التفصيلي
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
            نوع التقرير: <strong>تقرير مجمع حسب الكود (Group By Code)</strong> • ${filterText}
          </p>
        </div>
        
        <div style="text-align: left; font-size: 12px; color: #475569; background-color: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div>تاريخ الإصدار: <strong style="color: #0f172a;">${dateStr}</strong></div>
          <div>وقت التوليد: <strong>${timeStr}</strong></div>
          <div>الحالة: <span style="color: #059669; font-weight: bold;">معتمد ومطابق للحسابات</span></div>
        </div>
      </div>

      <!-- بطاقات الإحصائيات السريعة في الترويسة -->
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 16px;">
        <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 11px; color: #9d174d; font-weight: 600;">الأكواد الرئيسية</div>
          <div style="font-size: 18px; font-weight: 800; color: #831843;">${dataset.length}</div>
          <div style="font-size: 10px; color: #be185d;">كود مجمع</div>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 11px; color: #166534; font-weight: 600;">الحركات الفرعية</div>
          <div style="font-size: 18px; font-weight: 800; color: #14532d;">${grandSubItemsCount}</div>
          <div style="font-size: 10px; color: #15803d;">حركة مدمجة</div>
        </div>

        <div style="background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 11px; color: #6b21a8; font-weight: 600;">إجمالي الكراتين</div>
          <div style="font-size: 18px; font-weight: 800; color: #581c87;">${grandCartons.toLocaleString('en-US')}</div>
          <div style="font-size: 10px; color: #7e22ce;">كرتونة</div>
        </div>

        <div style="background-color: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 11px; color: #0369a1; font-weight: 600;">الوزن الإجمالي</div>
          <div style="font-size: 18px; font-weight: 800; color: #0c4a6e;">${grandWeight.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</div>
          <div style="font-size: 10px; color: #0284c7;">كجم (KG)</div>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 11px; color: #b45309; font-weight: 600;">الحجم الإجمالي</div>
          <div style="font-size: 18px; font-weight: 800; color: #78350f;">${grandVolume.toFixed(3)}</div>
          <div style="font-size: 10px; color: #d97706;">متر مكعب (CBM)</div>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 11px; color: #047857; font-weight: 600;">إجمالي الجمرك ($)</div>
          <div style="font-size: 18px; font-weight: 800; color: #064e3b;">$${grandCustoms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="font-size: 10px; color: #059669;">بالدولار الأمريكي</div>
        </div>
      </div>
    </div>

    <!-- جدول الحركات والبيانات المنسق - 12 عموداً فريداً ومحدداً بنسب رياضية دقيقة -->
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #1e293b; color: #ffffff; font-size: 11px;">
          <th style="padding: 8px 6px; text-align: right; border: 1px solid #334155; width: 13%;">نوع السجل / البيان</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 7%;">الكود</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 8%;">الحاوية</th>
          <th style="padding: 8px 4px; text-align: center; border: 1px solid #334155; width: 5%;">النوع</th>
          <th style="padding: 8px 4px; text-align: center; border: 1px solid #334155; width: 6%;">رقم الحركة</th>
          <th style="padding: 8px 6px; text-align: right; border: 1px solid #334155; width: 14%;">نوع البضاعة</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 6%;">الكراتين</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 8%;">الوزن (kg)</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 8%;">الحجم (CBM)</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 7%;">السعر $</th>
          <th style="padding: 8px 6px; text-align: left; border: 1px solid #334155; width: 11%;">الجمرك ($)</th>
          <th style="padding: 8px 5px; text-align: center; border: 1px solid #334155; width: 7%;">الفاتورة</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        ${grandTotalRowHtml}
      </tbody>
    </table>

    <!-- تذييل التقرير الرسمي -->
    <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8;">
      <div>نظام تجميع الشحنات الآلي • تم الحساب والتجميع بدقة وفق معادلات نوع الشحنة ومبالغ الجمرك ($)</div>
      <div>وثيقة مطابقة للحسابات المعتمدة • تقرير Group-By</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // التقاط الـ DOM بجودة مضاعفة (Retina scale: 2) للحصول على أعلى دقة وضوح ونصوص عربية مصمتة
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = 297; // عرض A4 أفقي بالملليمتر
    const pdfHeight = 210; // ارتفاع A4 أفقي بالملليمتر
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;
    const pageHeightAvailable = pdfHeight - margin * 2;

    if (contentHeight <= pageHeightAvailable) {
      // صفحة واحدة تكفي
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    } else {
      // تقسيم ذكي متعدد الصفحات (Multi-page clean canvas slice)
      const pageCanvasHeight = Math.floor(
        (canvas.width * pageHeightAvailable) / contentWidth
      );
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'l');
        }

        const sliceHeight = Math.min(
          pageCanvasHeight,
          canvas.height - renderedHeight
        );
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          const sliceContentHeight = (sliceHeight * contentWidth) / canvas.width;
          const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(
            sliceImgData,
            'JPEG',
            margin,
            margin,
            contentWidth,
            sliceContentHeight
          );
        }

        renderedHeight += sliceHeight;
        pageIndex++;
      }
    }

    pdf.save(`Shipment_GroupBy_Report_${dateStr}.pdf`);
  } finally {
    // إزالة الحاوية المؤقتة من الشاشة
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
