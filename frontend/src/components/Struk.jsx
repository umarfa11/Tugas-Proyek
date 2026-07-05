import React from 'react';
import { Printer, X } from 'lucide-react';
import Button from './ui/Button';

const Struk = ({ data, onClose }) => {
  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const items = data.cartItems || data.detailPesanan || [];
  const total = data.totalHarga || 0;
  const isTunai = data.pembayaran?.metodeBayar === 'tunai' || data.metodeBayar === 'tunai';
  const bayar = data.nominalDiterima || data.pembayaran?.nominalDiterima || 0;
  const kembali = data.kembalian || data.pembayaran?.kembalian || 0;
  const metode = data.pembayaran?.metodeBayar || data.metodeBayar || '-';

  const htmlContent = `
    <html>
      <head>
        <title>Struk - KASIR BAKSOKU</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'JetBrains Mono', 'Courier New', monospace; 
            font-size: 12px; 
            width: 58mm; /* Standard 58mm thermal paper */
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
          h1 { font-size: 16px; margin-bottom: 2px; }
          p { margin-bottom: 2px; }
          .mt-2 { margin-top: 8px; }
          .mb-2 { margin-bottom: 8px; }
          .queue-title { font-size: 10px; letter-spacing: 1px; }
          .queue-number { font-size: 32px; font-weight: 700; margin: 5px 0; }
          .item-row { margin-bottom: 4px; }
          .item-name { font-weight: 700; margin-bottom: 2px; }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <!-- Header -->
          <div class="text-center mb-2">
            <h1>KASIR BAKSOKU</h1>
            <p style="font-size: 10px;">Sistem Kasir & Antrian Cerdas</p>
            <p style="font-size: 10px;">Jl. Raya Bakso No. 99, Jakarta</p>
          </div>
          
          <div class="divider"></div>
          
          <!-- Nomor Antrian -->
          <div class="text-center mt-2 mb-2">
            <p class="queue-title">NOMOR ANTRIAN</p>
            <div class="queue-number">${data.nomorAntrian || data.pesanan?.nomorAntrian || '-'}</div>
          </div>
          
          <div class="divider"></div>
          
          <!-- Info Transaksi -->
          <div style="font-size: 10px;">
            <div class="flex-between"><span>Tgl:</span><span>${formatDate(data.enteredAt || data.createdAt || new Date())}</span></div>
            <div class="flex-between"><span>Ksr:</span><span>${data.user?.nama || 'Kasir'}</span></div>
            <div class="flex-between"><span>Plg:</span><span>${data.namaPembeli || '-'}</span></div>
          </div>
          
          <div class="divider"></div>
          
          <!-- Items -->
          <div>
            ${items.map(item => `
              <div class="item-row">
                <div class="item-name">${item.namaProduk || item.produk?.namaProduk}</div>
                <div class="flex-between">
                  <span>${item.jumlah} x ${formatRupiah(item.harga || item.produk?.harga || 0)}</span>
                  <span>${formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <!-- Totals -->
          <div>
            <div class="flex-between font-bold">
              <span>TOTAL</span>
              <span>${formatRupiah(total)}</span>
            </div>
            
            ${isTunai ? `
              <div class="flex-between mt-2" style="font-size: 11px;">
                <span>TUNAI</span>
                <span>${formatRupiah(bayar)}</span>
              </div>
              <div class="flex-between font-bold" style="font-size: 11px;">
                <span>KEMBALI</span>
                <span>${formatRupiah(kembali)}</span>
              </div>
            ` : `
              <div class="flex-between mt-2 font-bold" style="font-size: 11px;">
                <span>METODE</span>
                <span style="text-transform: uppercase;">${metode}</span>
              </div>
            `}
          </div>
          
          <div class="divider-bold"></div>
          
          <!-- Footer -->
          <div class="text-center mt-2" style="font-size: 10px;">
            <p>Terima Kasih Atas</p>
            <p>Kunjungan Anda</p>
            <p class="mt-2" style="font-size: 9px;">* Harap simpan struk ini *</p>
            <p style="font-size: 9px;">sebagai nomor antrian</p>
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
      {/* UI Preview (Appears in the Modal before printing) */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-5 mx-auto max-w-sm">
        <div className="flex items-center justify-center bg-gray-50 h-64 overflow-hidden rounded-lg border border-dashed border-gray-300 relative">
          <div className="w-[58mm] bg-white border border-gray-200 shadow-sm p-4 text-[10px] font-mono transform scale-90 origin-top">
             <div className="text-center mb-2">
                <h1 className="font-bold text-sm leading-tight">KASIR BAKSOKU</h1>
                <p className="text-[8px]">Sistem Kasir & Antrian Cerdas</p>
             </div>
             <div className="border-t border-dashed border-black my-2"></div>
             <div className="text-center">
                <p className="text-[8px]">NOMOR ANTRIAN</p>
                <p className="text-2xl font-bold">{data.nomorAntrian || data.pesanan?.nomorAntrian || '-'}</p>
             </div>
             <div className="border-t border-dashed border-black my-2"></div>
             
             {/* Items List for Preview */}
             <div className="space-y-1 mb-2">
                {items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="mb-1">
                    <div className="font-bold text-[8px] truncate">{item.namaProduk || item.produk?.namaProduk}</div>
                    <div className="flex justify-between text-[8px]">
                      <span>{item.jumlah} x {formatRupiah(item.harga || item.produk?.harga || 0)}</span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
                {items.length > 3 && <div className="text-center text-[8px] text-gray-500">... ({items.length - 3} item lainnya)</div>}
             </div>
             
             <div className="border-t border-dashed border-black my-1"></div>
             <div className="flex justify-between mt-1"><span>Total</span><span className="font-bold">{formatRupiah(total)}</span></div>
             <div className="text-center mt-4 text-[8px] italic text-gray-500">Klik 'Cetak Struk' untuk struk asli 58mm</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose} icon={X}>
          Tutup
        </Button>
        <Button variant="primary" className="flex-1" onClick={handlePrint} icon={Printer}>
          Cetak Struk
        </Button>
      </div>
    </div>
  );
};

export default Struk;
