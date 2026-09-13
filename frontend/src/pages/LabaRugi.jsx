import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Activity, Receipt,
  Soup, Printer, Download, RefreshCw, FileSpreadsheet, Eye, Info,
  Percent, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2,
  AlertCircle, Filter, Search, Coffee, ShoppingBag, Wallet,
  CreditCard, ChevronDown, ChevronUp, Layers, HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import { saveLabaRugiCache, getLabaRugiCache, usePWAStatus } from '../services/pwaService';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFA07A', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

const LabaRugi = () => {
  const { isOnline } = usePWAStatus();

  // State Filter Periode
  const [preset, setPreset] = useState('bulan_ini');
  
  // Tanggal default: bulan berjalan
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // State Laporan
  const [laporan, setLaporan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);

  // State UI
  const [chartTab, setChartTab] = useState('komparasi'); // 'komparasi', 'tren', 'beban'
  const [showRincianBeban, setShowRincianBeban] = useState(true);

  // State Modal Drill-Down Transaksi Sumber
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownType, setDrillDownType] = useState('penjualan'); // 'penjualan' | 'beban'
  const [drillDownData, setDrillDownData] = useState(null);
  const [isDrillDownLoading, setIsDrillDownLoading] = useState(false);
  const [drillDownSearch, setDrillDownSearch] = useState('');

  // Format Mata Uang Rupiah
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Format Persentase
  const formatPercent = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0%';
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${num.toFixed(1)}%`;
  };

  // Format Tanggal Tampilan
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Fetch Laporan Laba Rugi
  const fetchLaporan = useCallback(async (forcedPreset = preset, customStart = startDate, customEnd = endDate) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    const cacheKey = `${forcedPreset}_${customStart}_${customEnd}`;

    try {
      let url = `/laba-rugi?preset=${forcedPreset}`;
      if (forcedPreset === 'custom' || (customStart && customEnd)) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await api.get(url);
      setLaporan(res.data);
      setIsOfflineData(false);
      setCacheTimestamp(new Date().toISOString());

      // Simpan di cache lokal untuk ketersediaan offline aman
      saveLabaRugiCache(cacheKey, res.data);
    } catch (err) {
      console.warn('Error fetching laba rugi, trying local cache...', err);
      // Cek cache lokal
      const cached = getLabaRugiCache(cacheKey);
      if (cached && cached.data) {
        setLaporan(cached.data);
        setIsOfflineData(true);
        setCacheTimestamp(cached.timestamp);
      } else {
        setIsError(true);
        setErrorMessage(err.response?.data?.message || 'Gagal memuat laporan laba rugi. Periksa sambungan server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [preset, startDate, endDate]);

  // Handle Preset Change
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    const now = new Date();

    if (newPreset === 'hari_ini') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
      fetchLaporan('hari_ini', todayStr, todayStr);
    } else if (newPreset === 'minggu_ini') {
      const end = now.toISOString().split('T')[0];
      const startD = new Date(now);
      startD.setDate(startD.getDate() - 6);
      const start = startD.toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
      fetchLaporan('minggu_ini', start, end);
    } else if (newPreset === 'bulan_ini') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
      fetchLaporan('bulan_ini', start, end);
    } else if (newPreset === 'tahun_ini') {
      const start = `${now.getFullYear()}-01-01`;
      const end = `${now.getFullYear()}-12-31`;
      setStartDate(start);
      setEndDate(end);
      fetchLaporan('tahun_ini', start, end);
    } else {
      // Custom mode: fetch dengan start & end saat ini
      fetchLaporan('custom', startDate, endDate);
    }
  };

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    setPreset('custom');
    fetchLaporan('custom', startDate, endDate);
  };

  // Muat pertama kali
  useEffect(() => {
    fetchLaporan();
  }, []);

  // Auto-sync saat kembali online
  useEffect(() => {
    if (isOnline && isOfflineData) {
      fetchLaporan();
    }
  }, [isOnline, isOfflineData, fetchLaporan]);

  // Buka Modal Drill-Down Transaksi Sumber
  const handleOpenDrillDown = async (type) => {
    setDrillDownType(type);
    setIsDrillDownOpen(true);
    setIsDrillDownLoading(true);
    setDrillDownSearch('');

    try {
      let url = `/laba-rugi/transaksi-sumber?type=${type}&preset=${preset}`;
      if (preset === 'custom') {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      setDrillDownData(res.data);
    } catch (err) {
      console.error('Error fetching drill-down data:', err);
    } finally {
      setIsDrillDownLoading(false);
    }
  };

  // Filter Data Transaksi Sumber
  const filteredDrillDownList = useMemo(() => {
    if (!drillDownData || !drillDownData.data) return [];
    if (!drillDownSearch.trim()) return drillDownData.data;

    const query = drillDownSearch.toLowerCase();
    if (drillDownType === 'penjualan') {
      return drillDownData.data.filter(item =>
        item.namaPembeli?.toLowerCase().includes(query) ||
        String(item.nomorAntrian).includes(query) ||
        item.items?.some(it => it.namaProduk?.toLowerCase().includes(query))
      );
    } else {
      return drillDownData.data.filter(item =>
        item.keterangan?.toLowerCase().includes(query) ||
        item.kategori?.toLowerCase().includes(query)
      );
    }
  }, [drillDownData, drillDownSearch, drillDownType]);

  // Ekspor Excel Profesional
  const handleExportExcel = () => {
    if (!laporan) return;

    const { ringkasan, breakdownKategori, breakdownBeban, perbandingan, periode } = laporan;

    // Sheet 1: Laporan Laba Rugi
    const summaryData = [
      ['LAPORAN LABA RUGI - KASIR BAKSOKU'],
      [`Periode: ${formatDateDisplay(periode.start)} s/d ${formatDateDisplay(periode.end)}`],
      [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
      [''],
      ['KOMPONEN KEUANGAN', 'NOMINAL (IDR)', 'PERSENTASE / RASIO', 'PERIODE LALU', 'PERTUMBUHAN (%)'],
      ['1. PENDAPATAN USAHA'],
      ...breakdownKategori.map(k => [
        `   - Penjualan ${k.kategori}`,
        k.pendapatan,
        `${((k.pendapatan / (ringkasan.totalPendapatan || 1)) * 100).toFixed(1)}%`,
        '-',
        '-'
      ]),
      ['TOTAL PENDAPATAN', ringkasan.totalPendapatan, '100.0%', perbandingan?.pendapatan?.sebelumnya || 0, formatPercent(perbandingan?.pendapatan?.persentase)],
      [''],
      ['2. HARGA POKOK PENJUALAN (HPP)'],
      ...breakdownKategori.map(k => [
        `   - Modal Pokok ${k.kategori}`,
        k.hpp,
        `${((k.hpp / (ringkasan.totalHargaModal || 1)) * 100).toFixed(1)}%`,
        '-',
        '-'
      ]),
      ['TOTAL HPP', ringkasan.totalHargaModal, `${ringkasan.rasio.hppRatioPct}%`, perbandingan?.hpp?.sebelumnya || 0, formatPercent(perbandingan?.hpp?.persentase)],
      [''],
      ['3. LABA KOTOR (GROSS PROFIT)', ringkasan.labaKotor, `${ringkasan.rasio.grossMarginPct}%`, perbandingan?.labaKotor?.sebelumnya || 0, formatPercent(perbandingan?.labaKotor?.persentase)],
      [''],
      ['4. BEBAN OPERASIONAL'],
      ...breakdownBeban.map(b => [
        `   - ${b.kategori}`,
        b.total,
        `${((b.total / (ringkasan.totalPengeluaran || 1)) * 100).toFixed(1)}%`,
        '-',
        '-'
      ]),
      ['TOTAL BEBAN OPERASIONAL', ringkasan.totalPengeluaran, `${ringkasan.rasio.expenseRatioPct}%`, perbandingan?.totalPengeluaran?.sebelumnya || 0, formatPercent(perbandingan?.totalPengeluaran?.persentase)],
      [''],
      ['5. LABA OPERASIONAL (EBIT)', ringkasan.labaOperasional, `${ringkasan.rasio.netMarginPct}%`, '-', '-'],
      ['6. PENDAPATAN / BEBAN LAINNYA', 0, '0.0%', '-', '-'],
      [''],
      ['LABA BERSIH (NET PROFIT)', ringkasan.labaBersih, `${ringkasan.rasio.netMarginPct}%`, perbandingan?.labaBersih?.sebelumnya || 0, formatPercent(perbandingan?.labaBersih?.persentase)],
      ['STATUS KINERJA', ringkasan.status.toUpperCase(), '', '', '']
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Laba Rugi');

    const fileName = `Laporan_Laba_Rugi_Baksoku_${startDate}_sd_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Cetak Laporan (Print PDF)
  const handlePrint = () => {
    window.print();
  };

  const ringkasan = laporan?.ringkasan;
  const perbandingan = laporan?.perbandingan;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Offline Alert Badge */}
      {isOfflineData && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-amber-500 shrink-0" />
            <span>
              Menampilkan <strong>data cache offline</strong> tersimpan ({formatDateDisplay(cacheTimestamp)}). Laporan akan diperbarui otomatis begitu server terhubung.
            </span>
          </div>
          <button
            onClick={() => fetchLaporan()}
            className="flex items-center gap-1 font-semibold underline hover:text-amber-900 ml-2 shrink-0"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      )}

      {/* Header & Aksi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark tracking-tight">Laporan Laba Rugi</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Terintegrasi Real-Time
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Perhitungan otomatis pendapatan, HPP, beban operasional, dan laba bersih berdasarkan data transaksi aktual.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            icon={Eye}
            onClick={() => handleOpenDrillDown('penjualan')}
            className="text-xs h-10 px-3.5 bg-white shadow-xs"
          >
            Transaksi Sumber
          </Button>
          <Button
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportExcel}
            disabled={!laporan || isLoading}
            className="text-xs h-10 px-3.5 bg-white shadow-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            Export Excel
          </Button>
          <Button
            variant="secondary"
            icon={Printer}
            onClick={handlePrint}
            disabled={!laporan || isLoading}
            className="text-xs h-10 px-3.5 shadow-xs"
          >
            Cetak Laporan
          </Button>
        </div>
      </div>

      {/* Print-Only Header (Formal Letterhead) */}
      <div className="hidden print:block border-b-2 border-dark pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">KASIR BAKSOKU</h1>
            <p className="text-sm font-semibold text-gray-700">LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Periode: {formatDateDisplay(laporan?.periode?.start)} s/d {formatDateDisplay(laporan?.periode?.end)}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            <p>Status: Laporan Sah Terverifikasi Sistem</p>
          </div>
        </div>
      </div>

      {/* Filter Periode & Presets */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-gray-100 print:hidden space-y-4">
        {/* Presets Button Group */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl">
            {[
              { id: 'hari_ini', label: 'Hari Ini' },
              { id: 'minggu_ini', label: '7 Hari Terakhir' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
              { id: 'tahun_ini', label: 'Tahun Ini' },
              { id: 'custom', label: 'Kustom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  preset === p.id
                    ? 'bg-white text-dark font-bold shadow-xs'
                    : 'text-gray-500 hover:text-dark hover:bg-white/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 font-medium">
            Periode: <strong className="text-dark font-semibold">{formatDateDisplay(startDate)}</strong> s/d <strong className="text-dark font-semibold">{formatDateDisplay(endDate)}</strong>
          </div>
        </div>

        {/* Custom Range Picker Form */}
        {preset === 'custom' && (
          <form onSubmit={handleCustomFilterSubmit} className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:flex-1 space-y-1">
              <label className="text-xs font-semibold text-gray-500">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                required
              />
            </div>
            <div className="w-full sm:flex-1 space-y-1">
              <label className="text-xs font-semibold text-gray-500">Tanggal Akhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                required
              />
            </div>
            <Button type="submit" icon={Filter} className="w-full sm:w-auto h-[38px] px-4 text-xs">
              Terapkan
            </Button>
          </form>
        )}
      </div>

      {/* Loading State */}
      {isLoading && !laporan ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium animate-pulse">Menghitung seluruh transaksi keuangan...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-8 rounded-3xl border border-red-200 text-center space-y-3">
          <AlertCircle size={40} className="text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-800">Gagal Memuat Laporan Laba Rugi</h3>
          <p className="text-xs text-red-600 max-w-md mx-auto">{errorMessage}</p>
          <Button onClick={() => fetchLaporan()} variant="outline" className="mt-2 text-xs">
            Coba Lagi
          </Button>
        </div>
      ) : ringkasan ? (
        <div className="space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Pendapatan */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pendapatan</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-dark tracking-tight">
                {formatRupiah(ringkasan.totalPendapatan)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {perbandingan?.pendapatan?.persentase >= 0 ? (
                  <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <ArrowUpRight size={13} /> {formatPercent(perbandingan?.pendapatan?.persentase)}
                  </span>
                ) : (
                  <span className="flex items-center font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                    <ArrowDownRight size={13} /> {formatPercent(perbandingan?.pendapatan?.persentase)}
                  </span>
                )}
                <span className="text-gray-400 text-[11px] truncate">vs periode lalu</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-[11px] text-gray-500">
                <span>{ringkasan.jumlahPesanan} Transaksi</span>
                <span>AOV: {formatRupiah(ringkasan.aov)}</span>
              </div>
            </div>

            {/* Card 2: Harga Pokok Penjualan (HPP) */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">HPP (Modal Terjual)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Soup size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-dark tracking-tight">
                {formatRupiah(ringkasan.totalHargaModal)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
                  Rasio: {ringkasan.rasio.hppRatioPct}%
                </span>
                <span className="text-gray-400 text-[11px]">dari omzet</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-[11px] text-gray-500">
                <span>{ringkasan.jumlahItemTerjual} Item Terjual</span>
                <button
                  onClick={() => handleOpenDrillDown('penjualan')}
                  className="text-primary hover:underline font-medium"
                >
                  Rincian HPP &rarr;
                </button>
              </div>
            </div>

            {/* Card 3: Laba Kotor */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Laba Kotor</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatRupiah(ringkasan.labaKotor)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  Margin: {ringkasan.rasio.grossMarginPct}%
                </span>
                <span className="text-gray-400 text-[11px]">Laba Kotor / Omzet</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-[11px] text-gray-500">
                <span>Pendapatan - HPP</span>
                <span className="font-medium text-emerald-700">Untung Kotor</span>
              </div>
            </div>

            {/* Card 4: Total Beban Operasional */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Beban Operasional</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-dark tracking-tight">
                {formatRupiah(ringkasan.totalPengeluaran)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                  Rasio: {ringkasan.rasio.expenseRatioPct}%
                </span>
                <span className="text-gray-400 text-[11px]">dari omzet</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-[11px] text-gray-500">
                <span>{ringkasan.jumlahPengeluaran} Biaya Dicatat</span>
                <button
                  onClick={() => handleOpenDrillDown('beban')}
                  className="text-primary hover:underline font-medium"
                >
                  Rincian Beban &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Hero Highlight Card: LABA BERSIH (Net Profit) */}
          <div
            className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden ${
              ringkasan.labaBersih >= 0
                ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-500/15'
                : 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 shadow-rose-500/15'
            }`}
          >
            <div className="absolute -top-12 -right-12 opacity-10 pointer-events-none">
              {ringkasan.labaBersih >= 0 ? <TrendingUp size={240} /> : <TrendingDown size={240} />}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                  <Sparkles size={14} />
                  <span>Kinerja Bersih Periode Ini</span>
                </div>
                <h2 className="text-base sm:text-lg font-medium opacity-90">
                  {ringkasan.labaBersih >= 0 ? 'Surplus / Laba Bersih' : 'Defisit / Rugi Bersih'}
                </h2>
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">
                  {formatRupiah(ringkasan.labaBersih)}
                </div>
                <p className="text-xs sm:text-sm opacity-80 mt-2 max-w-xl">
                  {ringkasan.labaBersih >= 0
                    ? `Perusahaan berhasil membukukan laba bersih dengan Net Profit Margin ${ringkasan.rasio.netMarginPct}%.`
                    : `Pengeluaran operasional melebihi laba kotor pada periode ini, terjadi defisit modal.`}
                </p>
              </div>

              {/* Formula & Comparison Mini-Box */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 min-w-[240px]">
                <div className="text-xs font-semibold opacity-75 uppercase tracking-wider">Perhitungan Bersih:</div>
                <div className="text-xs flex justify-between">
                  <span className="opacity-80">Laba Kotor:</span>
                  <span className="font-bold">{formatRupiah(ringkasan.labaKotor)}</span>
                </div>
                <div className="text-xs flex justify-between">
                  <span className="opacity-80">Beban Operasional:</span>
                  <span className="font-bold text-rose-200">- {formatRupiah(ringkasan.totalPengeluaran)}</span>
                </div>
                <div className="border-t border-white/20 pt-2 text-xs flex justify-between font-bold">
                  <span>Laba Bersih Akhir:</span>
                  <span>{formatRupiah(ringkasan.labaBersih)}</span>
                </div>
                {perbandingan?.labaBersih && (
                  <div className="mt-1 text-[11px] opacity-90 text-right">
                    Tren: <strong>{formatPercent(perbandingan.labaBersih.persentase)}</strong> ({formatRupiah(perbandingan.labaBersih.selisih)})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visualisasi Grafik Tren (Recharts) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-xs print:hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                <h3 className="font-bold text-dark text-base">Grafik Visualisasi Finansial</h3>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setChartTab('komparasi')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartTab === 'komparasi' ? 'bg-white text-dark font-bold shadow-xs' : 'text-gray-500 hover:text-dark'
                  }`}
                >
                  Pendapatan vs Beban
                </button>
                <button
                  onClick={() => setChartTab('tren')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartTab === 'tren' ? 'bg-white text-dark font-bold shadow-xs' : 'text-gray-500 hover:text-dark'
                  }`}
                >
                  Tren Laba Bersih
                </button>
                <button
                  onClick={() => setChartTab('beban')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartTab === 'beban' ? 'bg-white text-dark font-bold shadow-xs' : 'text-gray-500 hover:text-dark'
                  }`}
                >
                  Komposisi Beban
                </button>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="h-[280px] sm:h-[340px] w-full pt-2">
              {chartTab === 'komparasi' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laporan.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip
                      formatter={(val) => formatRupiah(val)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="pendapatan" name="Pendapatan" fill="#4ECDC4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hpp" name="HPP (Modal)" fill="#FFA07A" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pengeluaran" name="Beban Operasional" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartTab === 'tren' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={laporan.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip
                      formatter={(val) => formatRupiah(val)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="labaBersih" name="Laba Bersih" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLaba)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartTab === 'beban' && (
                laporan.breakdownBeban?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={laporan.breakdownBeban}
                        dataKey="total"
                        nameKey="kategori"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {laporan.breakdownBeban.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => formatRupiah(val)} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                    <Receipt size={36} className="text-gray-300 mb-2" />
                    <p>Belum ada catatan beban operasional pada periode ini.</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* TABEL LAPORAN LABA RUGI BERSTANDAR FORMAL */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden print:border-none print:shadow-none">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50 print:hidden">
              <div>
                <h3 className="text-base font-bold text-dark">Rincian Laporan Keuangan Formal</h3>
                <p className="text-xs text-gray-400">Pernyataan laba rugi berjenjang dengan subtotal dan rasio akuntansi</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Kalkulasi:</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1">
                  <CheckCircle2 size={13} /> Seimbang (Balanced)
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">
                    <th className="pb-3 px-3">Komponen Laba Rugi</th>
                    <th className="pb-3 px-3 text-right">Rincian</th>
                    <th className="pb-3 px-3 text-right">Subtotal</th>
                    <th className="pb-3 px-3 text-right">Total Akuntansi</th>
                    <th className="pb-3 px-3 text-right">% Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {/* BAGIAN 1: PENDAPATAN */}
                  <tr className="bg-gray-50/70 font-bold text-dark">
                    <td colSpan={5} className="py-2.5 px-3 uppercase text-xs tracking-wider text-gray-700">
                      I. PENDAPATAN USAHA (REVENUE)
                    </td>
                  </tr>
                  {laporan.breakdownKategori?.map((kat) => (
                    <tr key={`rev-${kat.kategori}`} className="text-gray-600 hover:bg-gray-50/40">
                      <td className="py-2.5 px-3 pl-8">Penjualan {kat.kategori} ({kat.qty} porsi/item)</td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{formatRupiah(kat.pendapatan)}</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right text-xs text-gray-400">
                        {((kat.pendapatan / (ringkasan.totalPendapatan || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {/* Total Pendapatan */}
                  <tr className="font-bold text-dark border-t border-gray-200 bg-blue-50/30">
                    <td className="py-3 px-3 pl-4">TOTAL PENDAPATAN BERSIH</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right text-blue-700 font-extrabold">{formatRupiah(ringkasan.totalPendapatan)}</td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-blue-600">100.0%</td>
                  </tr>

                  {/* BAGIAN 2: HPP */}
                  <tr className="bg-gray-50/70 font-bold text-dark">
                    <td colSpan={5} className="py-2.5 px-3 uppercase text-xs tracking-wider text-gray-700">
                      II. HARGA POKOK PENJUALAN (HPP / COGS)
                    </td>
                  </tr>
                  {laporan.breakdownKategori?.map((kat) => (
                    <tr key={`hpp-${kat.kategori}`} className="text-gray-600 hover:bg-gray-50/40">
                      <td className="py-2.5 px-3 pl-8">Beban Modal Bahan {kat.kategori}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{formatRupiah(kat.hpp)}</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right text-xs text-gray-400">
                        {((kat.hpp / (ringkasan.totalPendapatan || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {/* Total HPP */}
                  <tr className="font-bold text-dark border-t border-gray-200 bg-amber-50/30">
                    <td className="py-3 px-3 pl-4">TOTAL HARGA POKOK PENJUALAN</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right text-amber-700 font-extrabold">({formatRupiah(ringkasan.totalHargaModal)})</td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-amber-600">{ringkasan.rasio.hppRatioPct}%</td>
                  </tr>

                  {/* LABA KOTOR */}
                  <tr className="font-extrabold text-base bg-emerald-50/60 border-y-2 border-emerald-200 text-emerald-900">
                    <td className="py-3.5 px-3">LABA KOTOR USAHA (GROSS PROFIT) [I - II]</td>
                    <td className="py-3.5 px-3 text-right">-</td>
                    <td className="py-3.5 px-3 text-right">-</td>
                    <td className="py-3.5 px-3 text-right text-emerald-700">{formatRupiah(ringkasan.labaKotor)}</td>
                    <td className="py-3.5 px-3 text-right text-xs font-bold text-emerald-700">{ringkasan.rasio.grossMarginPct}%</td>
                  </tr>

                  {/* BAGIAN 3: BEBAN OPERASIONAL */}
                  <tr className="bg-gray-50/70 font-bold text-dark">
                    <td colSpan={5} className="py-2.5 px-3 uppercase text-xs tracking-wider text-gray-700">
                      III. BEBAN OPERASIONAL (OPERATING EXPENSES)
                    </td>
                  </tr>
                  {laporan.breakdownBeban?.length > 0 ? (
                    laporan.breakdownBeban.map((beban) => (
                      <tr key={`beban-${beban.kategori}`} className="text-gray-600 hover:bg-gray-50/40">
                        <td className="py-2.5 px-3 pl-8">Beban {beban.kategori} ({beban.count} catatan)</td>
                        <td className="py-2.5 px-3 text-right text-gray-500">{formatRupiah(beban.total)}</td>
                        <td className="py-2.5 px-3 text-right">-</td>
                        <td className="py-2.5 px-3 text-right">-</td>
                        <td className="py-2.5 px-3 text-right text-xs text-gray-400">
                          {((beban.total / (ringkasan.totalPendapatan || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="text-gray-400 italic">
                      <td colSpan={5} className="py-2.5 px-3 pl-8">Tidak ada biaya operasional tercatat pada periode ini.</td>
                    </tr>
                  )}
                  {/* Total Beban */}
                  <tr className="font-bold text-dark border-t border-gray-200 bg-rose-50/30">
                    <td className="py-3 px-3 pl-4">TOTAL BEBAN OPERASIONAL</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right text-rose-700 font-extrabold">({formatRupiah(ringkasan.totalPengeluaran)})</td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-rose-600">{ringkasan.rasio.expenseRatioPct}%</td>
                  </tr>

                  {/* LABA OPERASIONAL */}
                  <tr className="font-bold text-dark bg-gray-50 border-t border-gray-200">
                    <td className="py-3 px-3">LABA OPERASIONAL (EBIT)</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right font-extrabold">{formatRupiah(ringkasan.labaOperasional)}</td>
                    <td className="py-3 px-3 text-right text-xs font-bold">{ringkasan.rasio.netMarginPct}%</td>
                  </tr>

                  {/* BAGIAN 4: LAIN-LAIN */}
                  <tr className="text-gray-500 text-xs">
                    <td className="py-2 px-3 pl-8">IV. Pendapatan / (Beban) Non-Operasional Lainnya</td>
                    <td className="py-2 px-3 text-right">Rp 0</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right">0.0%</td>
                  </tr>

                  {/* TOTAL AKHIR: LABA BERSIH */}
                  <tr className={`font-black text-lg border-y-3 ${
                    ringkasan.labaBersih >= 0
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
                      : 'bg-rose-100 text-rose-950 border-rose-500'
                  }`}>
                    <td className="py-4 px-3">
                      {ringkasan.labaBersih >= 0 ? 'LABA BERSIH SEBELUM PAJAK (NET INCOME)' : 'RUGI BERSIH (NET LOSS)'}
                    </td>
                    <td className="py-4 px-3 text-right">-</td>
                    <td className="py-4 px-3 text-right">-</td>
                    <td className={`py-4 px-3 text-right ${
                      ringkasan.labaBersih >= 0 ? 'text-emerald-800' : 'text-rose-800'
                    }`}>
                      {formatRupiah(ringkasan.labaBersih)}
                    </td>
                    <td className="py-4 px-3 text-right text-sm font-extrabold">
                      {ringkasan.rasio.netMarginPct}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Print Signatures */}
            <div className="hidden print:flex justify-between items-center p-8 pt-16 mt-8 text-xs text-center">
              <div>
                <p className="font-semibold text-gray-800 mb-16">Disiapkan oleh,</p>
                <p className="border-t border-dark pt-1 font-bold">Kasir / Bagian Keuangan</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-16">Disetujui & Diverifikasi oleh,</p>
                <p className="border-t border-dark pt-1 font-bold">Pemilik Usaha (Owner)</p>
              </div>
            </div>
          </div>

          {/* Breakdown Produk Terlaris & Kontribusi Margin */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
            {/* Top Profit */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-dark text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span>Top 5 Produk Penyumbang Laba Terbesar</span>
                </h4>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {laporan.topProduk?.byProfit?.map((p, idx) => (
                  <div key={`p-prof-${p.id}`} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-dark">{p.namaProduk}</p>
                        <p className="text-[11px] text-gray-400">{p.qty} terjual &bull; Omzet: {formatRupiah(p.pendapatan)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatRupiah(p.laba)}</p>
                      <p className="text-[10px] text-gray-400">Margin: {p.pendapatan > 0 ? ((p.laba / p.pendapatan) * 100).toFixed(0) : 0}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metode Pembayaran Breakdown */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-dark text-sm flex items-center gap-2">
                  <Wallet size={16} className="text-blue-500" />
                  <span>Realisasi Kas Berdasarkan Metode Bayar</span>
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-600 mb-1 text-xs font-semibold">
                    <CreditCard size={14} />
                    <span>QRIS Statis</span>
                  </div>
                  <div className="text-lg font-black text-dark">
                    {formatRupiah(laporan.breakdownMetodeBayar?.qris?.nominal)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {laporan.breakdownMetodeBayar?.qris?.count || 0} transaksi lunas
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1 text-xs font-semibold">
                    <DollarSign size={14} />
                    <span>Tunai (Cash)</span>
                  </div>
                  <div className="text-lg font-black text-dark">
                    {formatRupiah(laporan.breakdownMetodeBayar?.tunai?.nominal)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {laporan.breakdownMetodeBayar?.tunai?.count || 0} transaksi lunas
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-500 flex items-center gap-2">
                <Info size={14} className="text-gray-400 shrink-0" />
                <span>Semua pesanan berstatus selesai diakui sebagai pembayaran lunas di awal (*upfront payment*).</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL DRILL-DOWN TRANSAKSI SUMBER (AUDITABILITAS) */}
      <Modal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        title={`Audit Transaksi Sumber: ${drillDownType === 'penjualan' ? 'Pendapatan & HPP' : 'Beban Operasional'}`}
        size="4xl"
      >
        <div className="space-y-4">
          {/* Sub Header & Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => handleOpenDrillDown('penjualan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  drillDownType === 'penjualan' ? 'bg-white text-dark shadow-xs' : 'text-gray-500'
                }`}
              >
                Pesanan Selesai ({drillDownData?.type === 'penjualan' ? drillDownData?.data?.length : '...'})
              </button>
              <button
                onClick={() => handleOpenDrillDown('beban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  drillDownType === 'beban' ? 'bg-white text-dark shadow-xs' : 'text-gray-500'
                }`}
              >
                Pengeluaran Operasional ({drillDownData?.type === 'beban' ? drillDownData?.data?.length : '...'})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={drillDownSearch}
                onChange={(e) => setDrillDownSearch(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Loading Indicator */}
          {isDrillDownLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
              <p className="text-xs text-gray-400">Mengambil catatan transaksi...</p>
            </div>
          ) : drillDownType === 'penjualan' ? (
            /* TABEL PENJUALAN */
            <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10 text-gray-400 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-2 px-3">No. Antrian</th>
                    <th className="py-2 px-3">Pelanggan</th>
                    <th className="py-2 px-3">Waktu Selesai</th>
                    <th className="py-2 px-3">Detail Item Pesanan</th>
                    <th className="py-2 px-3 text-right">Modal (HPP)</th>
                    <th className="py-2 px-3 text-right">Total Bayar</th>
                    <th className="py-2 px-3 text-right">Laba Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredDrillDownList.length > 0 ? (
                    filteredDrillDownList.map((order) => (
                      <tr key={`ord-${order.id}`} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold inline-flex items-center justify-center">
                            #{order.nomorAntrian}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-dark truncate max-w-[120px]">
                          {order.namaPembeli}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                          {formatDateDisplay(order.completedAt)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 max-w-[200px]">
                          {order.items?.map((it, i) => (
                            <span key={`it-${i}`} className="inline-block mr-1">
                              {it.jumlah}x {it.namaProduk}
                              {i < order.items.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500 whitespace-nowrap">
                          {formatRupiah(order.totalModal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-dark whitespace-nowrap">
                          {formatRupiah(order.totalHarga)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {formatRupiah(order.labaKotor)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Tidak ada transaksi penjualan yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABEL BEBAN OPERASIONAL */
            <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10 text-gray-400 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Tanggal</th>
                    <th className="py-2 px-3">Kategori Beban</th>
                    <th className="py-2 px-3">Keterangan Pengeluaran</th>
                    <th className="py-2 px-3 text-right">Nominal Beban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredDrillDownList.length > 0 ? (
                    filteredDrillDownList.map((exp) => (
                      <tr key={`exp-${exp.id}`} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 text-gray-400">#{exp.id}</td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                          {formatDateDisplay(exp.tanggal)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-semibold text-[10px]">
                            {exp.kategori}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-dark font-medium">{exp.keterangan}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                          {formatRupiah(exp.nominal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Tidak ada catatan beban operasional pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>Menampilkan <strong>{filteredDrillDownList.length}</strong> catatan</span>
            <Button variant="outline" onClick={() => setIsDrillDownOpen(false)} className="text-xs h-8 px-3">
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LabaRugi;
