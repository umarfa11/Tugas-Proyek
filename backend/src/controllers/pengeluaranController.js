const prisma = require('../config/db');

const getAllPengeluaran = async (req, res) => {
  try {
    const pengeluaran = await prisma.pengeluaran.findMany({
      orderBy: { tanggal: 'desc' }
    });
    res.status(200).json(pengeluaran);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPengeluaran = async (req, res) => {
  try {
    const { keterangan, nominal, tanggal } = req.body;

    if (!keterangan || !nominal) {
      return res.status(400).json({ message: 'Keterangan dan nominal diperlukan' });
    }

    const pengeluaran = await prisma.pengeluaran.create({
      data: {
        keterangan,
        nominal: Number(nominal),
        tanggal: tanggal ? new Date(tanggal) : new Date()
      }
    });

    res.status(201).json({ message: 'Pengeluaran dicatat', pengeluaran });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePengeluaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan, nominal, tanggal } = req.body;

    const pengeluaranId = parseInt(id);
    const existing = await prisma.pengeluaran.findUnique({ where: { id: pengeluaranId } });

    if (!existing) {
      return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    }

    const pengeluaran = await prisma.pengeluaran.update({
      where: { id: pengeluaranId },
      data: {
        keterangan: keterangan || existing.keterangan,
        nominal: nominal != null ? Number(nominal) : existing.nominal,
        tanggal: tanggal ? new Date(tanggal) : existing.tanggal
      }
    });

    res.status(200).json({ message: 'Pengeluaran diperbarui', pengeluaran });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePengeluaran = async (req, res) => {
  try {
    const { id } = req.params;
    const pengeluaranId = parseInt(id);

    const existing = await prisma.pengeluaran.findUnique({ where: { id: pengeluaranId } });
    if (!existing) {
      return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    }

    await prisma.pengeluaran.delete({
      where: { id: pengeluaranId }
    });

    res.status(200).json({ message: 'Pengeluaran dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllPengeluaran,
  createPengeluaran,
  updatePengeluaran,
  deletePengeluaran
};
