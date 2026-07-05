import React from 'react';
import { Printer, X } from 'lucide-react';
import Button from './ui/Button';

const RekapStruk = ({ data, stats, filterInfo, onClose }) => {
  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const htmlContent = `
    <html>
      <head>
        <title>Rekap Penjualan - KASIR BAKSOKU</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'JetBrains Mono', 'Courier New', monospace; 
            font-size: 11px; 
            width: 58mm;
            margin: 0 auto;
            color: #000;
            line-height: 1.4;
          }
          .content-wrapper { padding: 10px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .divider-bold { border-top: 2px dashed #000; margin: 8px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          h1 { font-size: 14px; margin-bottom: 2px; }
          .mt-2 { margin-top: 8px; }
          .mb-2 { margin-bottom: 8px; }
          .transaction-item { margin-bottom: 6px; }
          .summary-box { margin: 10px 0; padding: 5px 0; }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <div class="text-center mb-2">
            <h1>KASIR BAKSOKU</h1>
            <p style="font-size: 9px;">REKAP PENJUALAN</p>
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 9px; margin-bottom: 5px;">
            <div class="flex-between"><span>Periode:</span><span>${filterInfo}</span></div>
            <div class="flex-between"><span>Cetak:</span><span>${formatDate(new Date())}</span></div>
          </div>
          
          <div class="divider-bold"></div>
          
          <div class="summary-box font-bold">
            <div class="flex-between"><span>Total Trx:</span><span>${stats.totalTransaksi}</span></div>
            <div class="flex-between mt-2" style="font-size: 10px;"><span>PENDAPATAN:</span><span>${formatRupiah(stats.totalPendapatan)}</span></div>
            <div class="flex-between mt-2" style="font-size: 9px; font-weight: normal;"><span>Tunai:</span><span>${stats.totalTunai} Trx</span></div>
            <div class="flex-between" style="font-size: 9px; font-weight: normal;"><span>QRIS:</span><span>${stats.totalQris} Trx</span></div>
          </div>
          
          <div class="divider-bold"></div>
          
          <div class="text-center mb-2"><span style="font-size: 9px; font-weight: bold;">RINCIAN TRANSAKSI</span></div>
          
          <div>
            ${data.map(item => `
              <div class="transaction-item">
                <div class="flex-between font-bold" style="font-size: 10px;">
                  <span>#${item.nomorAntrian} - ${item.namaPembeli.substring(0, 10)}</span>
                  <span>${formatRupiah(item.totalHarga)}</span>
                </div>
                <div class="flex-between" style="font-size: 8px;">
                  <span>${formatDate(item.completedAt)}</span>
                  <span style="text-transform: uppercase;">${item.pembayaran?.metodeBayar || '-'}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="divider-bold"></div>
          
          <div class="text-center mt-2" style="font-size: 9px;">
            <p>-- Akhir Laporan --</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=500');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div>
      {/* UI Preview */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-5 mx-auto max-w-sm">
        <div className="flex items-center justify-center bg-gray-50 h-72 overflow-hidden rounded-lg border border-dashed border-gray-300 relative">
          <div className="w-[58mm] bg-white border border-gray-200 shadow-sm p-4 text-[10px] font-mono transform scale-90 origin-top">
             <div className="text-center mb-2">
                <h1 className="font-bold text-sm leading-tight">KASIR BAKSOKU</h1>
                <p className="text-[8px]">REKAP PENJUALAN</p>
             </div>
             <div className="border-t border-dashed border-black my-2"></div>
             
             <div className="text-[8px] mb-2 space-y-0.5">
                <div className="flex justify-between"><span>Periode:</span><span>{filterInfo}</span></div>
                <div className="flex justify-between font-bold mt-1"><span>PENDAPATAN:</span><span>{formatRupiah(stats.totalPendapatan)}</span></div>
                <div className="flex justify-between"><span>Total Trx:</span><span>{stats.totalTransaksi}</span></div>
             </div>

             <div className="border-t border-dashed border-black my-2"></div>
             <div className="text-center mb-1"><span className="font-bold text-[8px]">RINCIAN</span></div>
             
             <div className="space-y-2">
                {data.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="text-[8px]">
                    <div className="flex justify-between font-bold">
                      <span className="truncate w-24">#{item.nomorAntrian} - {item.namaPembeli}</span>
                      <span>{formatRupiah(item.totalHarga)}</span>
                    </div>
                  </div>
                ))}
                {data.length > 4 && <div className="text-center text-[8px] text-gray-500">... ({data.length - 4} transaksi)</div>}
             </div>
             
             <div className="text-center mt-4 text-[8px] italic text-gray-500">Klik 'Cetak Rekap' untuk struk asli 58mm</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose} icon={X}>
          Tutup
        </Button>
        <Button variant="primary" className="flex-1" onClick={handlePrint} icon={Printer}>
          Cetak Rekap
        </Button>
      </div>
    </div>
  );
};

export default RekapStruk;
