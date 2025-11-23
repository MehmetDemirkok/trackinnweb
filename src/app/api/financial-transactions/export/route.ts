import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoBase64 } from '@/lib/fonts/roboto';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel'; // excel veya pdf
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {
      companyId: user.companyId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.financialTransaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (format === 'pdf') {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      // Font ekle
      doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      
      // PDF metadata ve encoding ayarları
      doc.setProperties({
        title: 'Finansal İşlemler Raporu',
        subject: 'Finansal Rapor',
        author: 'Yurtsever Konaklama Yönetim Sistemi',
        creator: 'TrackInn Web',
        keywords: 'finans, işlem, rapor'
      });
      
      // Türkçe karakter desteği için font ayarları
      doc.setFont('Roboto', 'normal');
      
      // Başlık
      doc.setFontSize(18);
      doc.setFont('Roboto', 'normal');
      doc.text('Finansal İşlemler Raporu', 14, 22);
      
      // Tarih aralığı
      if (startDate || endDate) {
        doc.setFontSize(11);
        doc.setFont('Roboto', 'normal');
        const startDateFormatted = startDate ? new Date(startDate).toLocaleDateString('tr-TR') : 'Başlangıç';
        const endDateFormatted = endDate ? new Date(endDate).toLocaleDateString('tr-TR') : 'Bitiş';
        doc.text(
          `Tarih: ${startDateFormatted} - ${endDateFormatted}`,
          14,
          30
        );
      }

      // Tablo verileri - Fiyatları TL formatında
      const tableData = transactions.map((t) => [
        new Date(t.date).toLocaleDateString('tr-TR'),
        t.type === 'GELIR' ? 'Gelir' : 'Gider',
        getCategoryLabel(t.category),
        t.description || '-',
        `${parseFloat(t.amount.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        t.user?.name || '-',
      ]);

      autoTable(doc, {
        head: [['Tarih', 'Tip', 'Kategori', 'Açıklama', 'Tutar', 'Kullanıcı']],
        body: tableData,
        startY: startDate || endDate ? 35 : 30,
        styles: { 
          fontSize: 10,
          font: 'Roboto',
          fontStyle: 'normal',
          textColor: [0, 0, 0],
          cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
          overflow: 'linebreak',
          cellWidth: 'wrap',
          halign: 'left',
          valign: 'middle',
          lineWidth: 0.2,
          lineColor: [180, 180, 180],
          minCellHeight: 8
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          font: 'Roboto',
          halign: 'center',
          valign: 'middle',
          cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
          lineWidth: 0.2,
          lineColor: [180, 180, 180],
          minCellHeight: 10
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
          textColor: [0, 0, 0]
        },

        columnStyles: {
          0: { halign: 'center', cellWidth: 25, fontSize: 10 },
          1: { halign: 'center', cellWidth: 20, fontSize: 10 },
          2: { halign: 'left', cellWidth: 30, fontSize: 10 },
          3: { halign: 'left', cellWidth: 50, fontSize: 10 },
          4: { halign: 'right', cellWidth: 25, fontSize: 10 },
          5: { halign: 'left', cellWidth: 30, fontSize: 10 }
        },
        margin: { top: startDate || endDate ? 35 : 30, right: 14, bottom: 20, left: 14 },
        showHead: 'everyPage',
        pageBreak: 'auto',
        theme: 'striped',
        horizontalPageBreak: false
      });

      // Toplamlar
      const totalIncome = transactions
        .filter((t) => t.type === 'GELIR')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'GIDER')
        .reduce((sum, t) => sum + t.amount, 0);
      const profit = totalIncome - totalExpense;

      // Son tablo pozisyonunu al
      const finalY = (doc as any).lastAutoTable?.finalY || (startDate || endDate ? 35 : 30) + (tableData.length * 10);
      doc.setFontSize(11);
      doc.setFont('Roboto', 'normal');
      const totalIncomeText = `Toplam Gelir: ${totalIncome.toFixed(2).replace('.', ',')} TL`;
      const totalExpenseText = `Toplam Gider: ${totalExpense.toFixed(2).replace('.', ',')} TL`;
      const profitText = `Net Kar: ${profit.toFixed(2).replace('.', ',')} TL`;
      doc.text(totalIncomeText, 14, finalY + 10);
      doc.text(totalExpenseText, 14, finalY + 16);
      doc.text(profitText, 14, finalY + 22);

      const pdfOutput = doc.output('arraybuffer');
      const pdfBuffer = Buffer.from(pdfOutput);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="finans-raporu-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    } else {
      // Excel export
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Finansal İşlemler');

      // Başlık
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = 'Finansal İşlemler Raporu';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Tarih aralığı
      if (startDate || endDate) {
        worksheet.mergeCells('A2:F2');
        worksheet.getCell('A2').value = `Tarih: ${startDate || 'Başlangıç'} - ${endDate || 'Bitiş'}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
      }

      // Başlık satırı
      const headerRow = worksheet.addRow([
        'Tarih',
        'Tip',
        'Kategori',
        'Açıklama',
        'Tutar',
        'Kullanıcı',
        'Notlar',
      ]);
      headerRow.font = { 
        bold: true, 
        size: 11,
        name: 'Arial',
        color: { argb: 'FFFFFFFF' }
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      headerRow.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true
      };
      headerRow.height = 25;

      // Veri satırları
      transactions.forEach((transaction) => {
        const row = worksheet.addRow([
          new Date(transaction.date).toLocaleDateString('tr-TR'),
          transaction.type === 'GELIR' ? 'Gelir' : 'Gider',
          getCategoryLabel(transaction.category),
          transaction.description || '-',
          transaction.amount,
          transaction.user?.name || '-',
          transaction.notes || '-',
        ]);
        row.font = { 
          size: 10,
          name: 'Arial'
        };
        row.alignment = { 
          vertical: 'middle',
          wrapText: true
        };
        // Tutar sütununu sağa hizala
        row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Toplam satırı
      const totalIncome = transactions
        .filter((t) => t.type === 'GELIR')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'GIDER')
        .reduce((sum, t) => sum + t.amount, 0);
      const profit = totalIncome - totalExpense;

      worksheet.addRow([]);
      const summaryRow = worksheet.addRow([
        '',
        '',
        '',
        'TOPLAM',
        '',
        '',
        '',
      ]);
      summaryRow.font = { bold: true, size: 11, name: 'Arial' };
      summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };

      const incomeRow = worksheet.addRow(['', '', '', 'Toplam Gelir:', totalIncome, '', '']);
      incomeRow.getCell(4).font = { bold: true, size: 10, name: 'Arial' };
      incomeRow.getCell(5).font = { bold: true, size: 10, name: 'Arial' };
      incomeRow.getCell(5).numFmt = '#,##0.00 ₺';
      incomeRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

      const expenseRow = worksheet.addRow(['', '', '', 'Toplam Gider:', totalExpense, '', '']);
      expenseRow.getCell(4).font = { bold: true, size: 10, name: 'Arial' };
      expenseRow.getCell(5).font = { bold: true, size: 10, name: 'Arial' };
      expenseRow.getCell(5).numFmt = '#,##0.00 ₺';
      expenseRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

      const profitRow = worksheet.addRow(['', '', '', 'Net Kar:', profit, '', '']);
      profitRow.getCell(4).font = { bold: true, size: 11, name: 'Arial' };
      profitRow.getCell(5).font = { bold: true, size: 11, name: 'Arial' };
      profitRow.getCell(5).numFmt = '#,##0.00 ₺';
      profitRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      profitRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F2FE' },
      };

      // Sütun genişlikleri ve formatları
      worksheet.getColumn(1).width = 15; // Tarih
      worksheet.getColumn(2).width = 12; // Tip
      worksheet.getColumn(3).width = 20; // Kategori
      worksheet.getColumn(4).width = 40; // Açıklama
      worksheet.getColumn(5).width = 15; // Tutar
      worksheet.getColumn(5).numFmt = '#,##0.00 ₺'; // Para formatı
      worksheet.getColumn(6).width = 20; // Kullanıcı
      worksheet.getColumn(7).width = 30; // Notlar
      
      // Tüm hücreler için border
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="finans-raporu-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export hatası' }, { status: 500 });
  }
}

function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    KONAKLAMA: 'Konaklama',
    TRANSFER: 'Transfer',
    OFIS_GIDERLERI: 'Ofis Giderleri',
    TEDARIKCI_ODEMESI: 'Tedarikçi Ödemesi',
    MAAŞ: 'Maaş',
    VERGI: 'Vergi',
    DİĞER: 'Diğer',
  };
  return labels[category] || category;
}

