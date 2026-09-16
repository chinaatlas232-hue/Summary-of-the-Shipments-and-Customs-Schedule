import { RawShipmentRow, AggregatedShipment } from '../types';

export const INITIAL_RAW_DATA: RawShipmentRow[] = [
  {
    no: 1,
    code: 'B12',
    shippingMark: 'B12-102',
    warehouseReceiptNo: 'RS26040898317',
    goodsType: 'Ladys Dress',
    cartons: 3,
    weight: 127.50,
    volume: 0.513,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 12500,
    customerPaidYuan: 100,
    officePaidYuan: 12400,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 1855,
    entryNo: 'PO-B12-260407-P02',
    invoiceNo: 'B12-102',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 153.90,
  },
  {
    no: 2,
    code: 'B12',
    shippingMark: 'B12-90',
    warehouseReceiptNo: 'RS26040898304',
    goodsType: 'Ladys Dress',
    cartons: 1,
    weight: 20.00,
    volume: 0.098,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 4400,
    customerPaidYuan: 690,
    officePaidYuan: 3710,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 653,
    entryNo: 'PO-B12-260330-P03',
    invoiceNo: 'B12-90',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 29.40,
  },
  {
    no: 3,
    code: 'B12',
    shippingMark: 'B12-95',
    warehouseReceiptNo: 'RS26040898300',
    goodsType: 'Ladys Clothes',
    cartons: 1,
    weight: 66.00,
    volume: 0.383,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 10800,
    customerPaidYuan: 0.00,
    officePaidYuan: 10800,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 1602,
    entryNo: 'PO-B12-260401-P01',
    invoiceNo: 'B12-95',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 114.90,
  },
  {
    no: 4,
    code: 'B1020',
    shippingMark: 'B1020-15',
    warehouseReceiptNo: 'RS26040798220',
    goodsType: 'lady suit',
    cartons: 3,
    weight: 137.35,
    volume: 0.578,
    containerNo: 'RQ6025',
    staff: 'JASMINE',
    totalYuan: 0,
    customerPaidYuan: 0.00,
    officePaidYuan: 0.00,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 0,
    entryNo: 'Client paid',
    invoiceNo: 'B1012-15',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 173.40,
  },
  {
    no: 5,
    code: 'B12',
    shippingMark: 'B12-93',
    warehouseReceiptNo: 'RS26040798202',
    goodsType: 'Ladys Dress,Ladys Shirt',
    cartons: 3,
    weight: 124.00,
    volume: 0.384,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 21350,
    customerPaidYuan: 690,
    officePaidYuan: 20660,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 3168,
    entryNo: 'PO-B12-260330-P06',
    invoiceNo: 'B12-93',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 115.20,
  },
  {
    no: 6,
    code: 'B12',
    shippingMark: 'B12-84',
    warehouseReceiptNo: 'RS26040398107',
    goodsType: 'Ladys Suits',
    cartons: 2,
    weight: 90.00,
    volume: 0.647,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 19695,
    customerPaidYuan: 690,
    officePaidYuan: 19005,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 2922,
    entryNo: 'PO-B12-260328-P04',
    invoiceNo: 'B12-84',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 194.10,
  },
  {
    no: 7,
    code: 'B12',
    shippingMark: 'B12-73',
    warehouseReceiptNo: 'RS26040398100',
    goodsType: 'Ladys Dress',
    cartons: 6,
    weight: 282.00,
    volume: 1.764,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 41700,
    customerPaidYuan: 690,
    officePaidYuan: 41010,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 6187,
    entryNo: 'PO-B12-260326-P06',
    invoiceNo: 'B12-73',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 529.20,
  },
  {
    no: 8,
    code: 'B12',
    shippingMark: 'B12-94',
    warehouseReceiptNo: 'RS26040398036',
    goodsType: 'Ladys Shirt',
    cartons: 8,
    weight: 275.00,
    volume: 1.090,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 40890,
    customerPaidYuan: 690,
    officePaidYuan: 40200,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 6067,
    entryNo: 'PO-B12-260330-P07',
    invoiceNo: 'B12-94',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 327.00,
  },
  {
    no: 9,
    code: 'B12',
    shippingMark: 'B12-88',
    warehouseReceiptNo: 'RS26040398032',
    goodsType: 'Ladys Dress',
    cartons: 2,
    weight: 118.00,
    volume: 0.670,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 8550,
    customerPaidYuan: 690,
    officePaidYuan: 7860,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 1269,
    entryNo: 'PO-B12-260330-P01',
    invoiceNo: 'B12-88',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 201.00,
  },
  {
    no: 10,
    code: 'B12',
    shippingMark: 'B12-70',
    warehouseReceiptNo: 'RS26040297972',
    goodsType: 'Ladys Dress',
    cartons: 5,
    weight: 250.00,
    volume: 1.040,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 34280,
    customerPaidYuan: 690,
    officePaidYuan: 33590,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 5086,
    entryNo: 'PO-B12-260326-P03',
    invoiceNo: 'B12-70',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 312.00,
  },
  {
    no: 11,
    code: 'B12',
    shippingMark: 'B12-87',
    warehouseReceiptNo: 'RS26040297958',
    goodsType: 'Ladys Dress',
    cartons: 5,
    weight: 237.00,
    volume: 0.854,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 25270,
    customerPaidYuan: 690,
    officePaidYuan: 24580,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 3749,
    entryNo: 'PO-B12-260328-P07',
    invoiceNo: 'B12-87',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 256.20,
  },
  {
    no: 12,
    code: 'B12',
    shippingMark: 'B12-69',
    warehouseReceiptNo: 'S26040197880',
    goodsType: 'Ladys Shirt',
    cartons: 3,
    weight: 158.50,
    volume: 0.816,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 24205,
    customerPaidYuan: 757,
    officePaidYuan: 23448,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 3591,
    entryNo: 'PO-B12-260326-P02',
    invoiceNo: 'B12-69',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 244.80,
  },
  {
    no: 13,
    code: 'B12',
    shippingMark: 'B12-64',
    warehouseReceiptNo: 'RS26040197872',
    goodsType: 'Ladys Skirt',
    cartons: 4,
    weight: 168.00,
    volume: 1.082,
    containerNo: 'RQ6025',
    staff: 'Joyce',
    totalYuan: 16280,
    customerPaidYuan: 688,
    officePaidYuan: 15592,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 2415,
    entryNo: 'PO-B12-260325-P05',
    invoiceNo: 'B12-64',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 324.60,
  },
  {
    no: 14,
    code: 'KB399',
    shippingMark: 'KB399-A1',
    warehouseReceiptNo: 'RS26040197864',
    goodsType: 'Mens Top',
    cartons: 24,
    weight: 1375.00,
    volume: 7.826,
    containerNo: 'RQ6025',
    staff: 'NEELU',
    totalYuan: 175241,
    customerPaidYuan: 175241,
    officePaidYuan: 0.00,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 26000,
    entryNo: 'Client paid',
    invoiceNo: 'KB399-A1',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 2347.80,
  },
  {
    no: 15,
    code: 'B1718',
    shippingMark: 'B1718-21',
    warehouseReceiptNo: 'RS26040197836',
    goodsType: 'MAN TOP',
    cartons: 3,
    weight: 108.00,
    volume: 0.417,
    containerNo: 'RQ6025',
    staff: 'Minya',
    totalYuan: 10040,
    customerPaidYuan: 0.00,
    officePaidYuan: 10040,
    internalShippingYuan: 0.00,
    exchangeRate: 6.74,
    invoiceAmountUSD: 1490,
    entryNo: 'PO-B1718-260401-P01',
    invoiceNo: 'B1718-21',
    sellingPriceUSD: 325.00,
    customsAmountUSD: 125.10,
  },
];

/**
 * تحديد نوع الشحنة تلقائياً بناءً على الحاوية أو رقم الشحنة:
 * - إذا كان يبدأ بـ "RQ" يُكتب "بحري"
 * - إذا كان يبدأ بـ "RA" يُكتب "شحنة جوية"
 * - غير ذلك يُكتب نوع آخر أو بحري حسب بادئة الرمز
 */
export function getShipmentType(containerNo: string): string {
  if (!containerNo) return 'غير محدد';
  const clean = containerNo.trim().toUpperCase();
  if (clean.startsWith('RQ')) {
    return 'بحري';
  } else if (clean.startsWith('RA')) {
    return 'شحنة جوية';
  } else {
    return 'بحري / أخرى';
  }
}

/**
 * تجميع البيانات ودمج الأكواد المتكررة داخل نفس الشحنة (رقم الحاوية) حصراً:
 * 1. الاحتفاظ بكل سجلات الجدول دون دمج عشوائي بين الشحنات/الحاويات المختلفة.
 * 2. إذا تكرر نفس الكود ضمن نفس الشحنة/الحاوية فقط، يتم جمع (عدد الكراتين، الوزن، الحجم، ومبلغ الجمرك) الخاص به معاً في صف واحد لتلك الشحنة.
 * 3. استخراج الحقول الـ 7 المطلوبة حصرياً (الكود، الكارتون، الوزن، الحجم، رقم الحاوية، نوع الشحنة، مبلغ الجمرك بالدولار).
 */
export function aggregateShipments(rows: RawShipmentRow[]): AggregatedShipment[] {
  const map = new Map<string, AggregatedShipment>();

  for (const row of rows) {
    const code = (row.code || '').trim();
    if (!code) continue;

    const containerNo = (row.containerNo || '').trim();
    // المفتاح المركب يضمن حصر التجميع داخل نفس الحاوية/الشحنة فقط
    const groupKey = `${containerNo.toUpperCase()}:::${code}`;

    const rowSellingPrice = Number(row.sellingPriceUSD) && Number(row.sellingPriceUSD) > 0
      ? Number(row.sellingPriceUSD)
      : 325.00;

    const existing = map.get(groupKey);
    if (!existing) {
      map.set(groupKey, {
        code: code,
        totalCartons: Number(row.cartons) || 0,
        totalWeight: Number(row.weight) || 0,
        totalVolume: Number(row.volume) || 0,
        containerNo: containerNo,
        shipmentType: getShipmentType(containerNo),
        totalCustomsUSD: Number(row.customsAmountUSD) || 0,
        sellingPriceUSD: rowSellingPrice,
        rowCount: 1,
        items: [row],
      });
    } else {
      existing.totalCartons += Number(row.cartons) || 0;
      existing.totalWeight += Number(row.weight) || 0;
      existing.totalVolume += Number(row.volume) || 0;
      existing.totalCustomsUSD += Number(row.customsAmountUSD) || 0;
      // متابعة سعر البيع من الجدول إذا وجد في السجلات اللاحقة
      if (Number(row.sellingPriceUSD) && Number(row.sellingPriceUSD) > 0) {
        existing.sellingPriceUSD = Number(row.sellingPriceUSD);
      }
      existing.rowCount += 1;
      existing.items.push(row);
    }
  }

  // Convert map to array and round floats for numerical precision
  return Array.from(map.values()).map(item => ({
    ...item,
    totalWeight: Number(item.totalWeight.toFixed(2)),
    totalVolume: Number(item.totalVolume.toFixed(3)),
    totalCustomsUSD: Number(item.totalCustomsUSD.toFixed(2)),
    sellingPriceUSD: Number(item.sellingPriceUSD.toFixed(2)),
  }));
}

/**
 * Parse raw markdown table or tab-delimited text
 */
export function parseTableText(text: string): RawShipmentRow[] {
  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: RawShipmentRow[] = [];

  let headerFound = false;
  let customsIdx = -1;
  let sellingPriceIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if separator line in markdown |---|---|
    if (/^\|?[-:\s|]+$/.test(line)) {
      continue;
    }

    let cells: string[] = [];
    if (line.includes('|')) {
      cells = line.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
    } else if (line.includes('\t')) {
      cells = line.split('\t').map(c => c.trim());
    } else if (line.includes(',')) {
      cells = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    } else {
      cells = line.split(/\s{2,}/).map(c => c.trim());
    }

    if (cells.length < 3) continue;

    // Detect header line
    if (!headerFound && cells.some(c => c.includes('الكود') || c.toLowerCase().includes('code'))) {
      headerFound = true;
      customsIdx = cells.findIndex(c => c.includes('الجمرك') || c.toLowerCase().includes('custom'));
      sellingPriceIdx = cells.findIndex(c => c.includes('سعر البيع') || c.toLowerCase().includes('selling'));
      continue;
    }

    const cleanNum = (str: string | undefined): number => {
      if (!str) return 0;
      const sanitized = str.replace(/[¥$€,]/g, '').trim();
      const n = parseFloat(sanitized);
      return isNaN(n) ? 0 : n;
    };

    if (cells.length >= 7) {
      let code = cells[1] || cells[0];
      let cartons = cleanNum(cells[5]);
      let weight = cleanNum(cells[6]);
      let volume = cleanNum(cells[7]);
      let containerNo = cells[8] || '';
      
      // Determine customs amount column
      let customsAmountUSD = 0;
      if (customsIdx !== -1 && cells[customsIdx]) {
        customsAmountUSD = cleanNum(cells[customsIdx]);
      } else if (cells.length === 19) {
        // Standard 19-column table where index 15 is مبلغ الجمرك
        customsAmountUSD = cleanNum(cells[15]);
      } else if (cells.length >= 20) {
        // 20-column table where index 19 or 15
        customsAmountUSD = cleanNum(cells[19]) || cleanNum(cells[15]);
      } else {
        // If 7-column condensed table
        code = cells[0];
        cartons = cleanNum(cells[1]);
        weight = cleanNum(cells[2]);
        volume = cleanNum(cells[3]);
        containerNo = cells[4];
        customsAmountUSD = cleanNum(cells[6]);
      }

      // Determine selling price from table
      let sellingPriceUSD = 325.00;
      if (sellingPriceIdx !== -1 && cells[sellingPriceIdx]) {
        const parsed = cleanNum(cells[sellingPriceIdx]);
        if (parsed > 0) sellingPriceUSD = parsed;
      } else if (cells.length >= 19 && cleanNum(cells[18]) > 0) {
        sellingPriceUSD = cleanNum(cells[18]);
      }

      rows.push({
        no: parseInt(cells[0]) || rows.length + 1,
        code,
        shippingMark: cells[2] || '',
        warehouseReceiptNo: cells[3] || '',
        goodsType: cells[4] || '',
        cartons,
        weight,
        volume,
        containerNo,
        staff: cells[9] || '',
        totalYuan: cleanNum(cells[10]),
        customerPaidYuan: cleanNum(cells[11]),
        officePaidYuan: cleanNum(cells[12]),
        internalShippingYuan: cleanNum(cells[13]),
        exchangeRate: cleanNum(cells[14]) || 6.74,
        invoiceAmountUSD: cleanNum(cells[15]),
        entryNo: cells[16] || '',
        invoiceNo: cells[17] || '',
        sellingPriceUSD,
        customsAmountUSD,
      });
    }
  }

  return rows.length > 0 ? rows : INITIAL_RAW_DATA;
}

/**
 * Generate formatted Markdown table with the EXACT 7 requested columns
 */
export function generateMarkdownTable(items: AggregatedShipment[]): string {
  const headers = [
    '| الكود | عدد الكارتون (مجموع) | الوزن (مجموع) كجم | الحجم (مجموع) CBM | رقم الحاوية (أو الشحنة) | نوع الشحنة | مبلغ الجمرك ($) |',
    '|---|---|---|---|---|---|---|',
  ];

  const rows = items.map(item => {
    const amountStr = `$${item.totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `| ${item.code} | ${item.totalCartons.toLocaleString('en-US')} | ${item.totalWeight.toLocaleString('en-US', { minimumFractionDigits: 2 })} | ${item.totalVolume.toFixed(3)} | ${item.containerNo} | ${item.shipmentType} | ${amountStr} |`;
  });

  const totalCartons = items.reduce((acc, i) => acc + i.totalCartons, 0);
  const totalWeight = items.reduce((acc, i) => acc + i.totalWeight, 0);
  const totalVolume = items.reduce((acc, i) => acc + i.totalVolume, 0);
  const totalCustomsUSD = items.reduce((acc, i) => acc + i.totalCustomsUSD, 0);

  const grandAmountStr = `$${totalCustomsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const footer = `| **الإجمالي** | **${totalCartons.toLocaleString('en-US')}** | **${totalWeight.toLocaleString('en-US', { minimumFractionDigits: 2 })}** | **${totalVolume.toFixed(3)}** | **-** | **-** | **${grandAmountStr}** |`;

  return [...headers, ...rows, footer].join('\n');
}
