const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');

// Background job to clean up deactivated products older than 30 days
const cleanupDeactivatedProducts = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find all products that have been deactivated for more than 30 days
    const productsToDelete = await prisma.produk.findMany({
      where: {
        deactivatedAt: {
          lt: thirtyDaysAgo
        }
      },
      select: { id: true }
    });

    if (productsToDelete.length === 0) return;

    console.log(`[CLEANUP] Found ${productsToDelete.length} expired deactivated products. Attempting deletion...`);

    for (const item of productsToDelete) {
      try {
        const itemData = await prisma.produk.findUnique({ where: { id: item.id }});
        await prisma.produk.delete({
          where: { id: item.id }
        });
        if (itemData && itemData.gambar) {
          const imagePath = path.join(__dirname, '../../uploads', itemData.gambar);
          try {
            if (fs.existsSync(imagePath) && fs.lstatSync(imagePath).isFile()) {
              fs.unlinkSync(imagePath);
            }
          } catch (fileErr) {
            console.error(`[CLEANUP] Failed to delete image file ${itemData.gambar}:`, fileErr);
          }
        }
        console.log(`[CLEANUP] Product ID ${item.id} permanently deleted.`);
      } catch (err) {
        // If it fails (due to Foreign Key constraint), we ignore it so it remains soft-deleted (deactivated)
        console.warn(`[CLEANUP] Could not permanently delete Product ID ${item.id} due to constraints (order history). Kept as deactivated.`);
      }
    }
  } catch (error) {
    console.error("[CLEANUP ERROR] Failed to run cleanup job:", error);
  }
};

const getAllProduk = async (req, res) => {
  try {
    // Run cleanup in background without blocking response
    cleanupDeactivatedProducts().catch(err => console.error("Error in cleanup job:", err));

    const produk = await prisma.produk.findMany({
      where: {
        deactivatedAt: null
      }
    });
    res.status(200).json(produk);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDeactivatedProduk = async (req, res) => {
  try {
    const produk = await prisma.produk.findMany({
      where: {
        deactivatedAt: {
          not: null
        }
      }
    });
    res.status(200).json(produk);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createProduk = async (req, res) => {
  try {
    const { namaProduk, harga, stok, kategori } = req.body;
    
    if (!namaProduk || harga == null || stok == null || !kategori) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const gambar = req.file ? req.file.filename : null;

    const produk = await prisma.produk.create({
      data: {
        namaProduk,
        kategori,
        harga: Number(harga),
        stok: Number(stok),
        gambar
      }
    });

    res.status(201).json({ message: 'Produk created', produk });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaProduk, harga, stok, kategori } = req.body;

    const produkId = parseInt(id);
    const existing = await prisma.produk.findUnique({ where: { id: produkId } });

    if (!existing) {
      return res.status(404).json({ message: 'Produk not found' });
    }

    const dataToUpdate = {
      namaProduk: namaProduk || existing.namaProduk,
      kategori: kategori || existing.kategori,
      harga: harga != null ? Number(harga) : existing.harga,
      stok: stok != null ? Number(stok) : existing.stok
    };

    if (req.file) {
      dataToUpdate.gambar = req.file.filename;
      if (existing.gambar) {
        const oldPath = path.join(__dirname, '../../uploads', existing.gambar);
        try {
          if (fs.existsSync(oldPath) && fs.lstatSync(oldPath).isFile()) {
            fs.unlinkSync(oldPath);
          }
        } catch (fileErr) {
          console.error("Failed to delete old image file:", fileErr);
        }
      }
    } else if (req.body.removeImage === 'true') {
      dataToUpdate.gambar = null;
      if (existing.gambar) {
        const oldPath = path.join(__dirname, '../../uploads', existing.gambar);
        try {
          if (fs.existsSync(oldPath) && fs.lstatSync(oldPath).isFile()) {
            fs.unlinkSync(oldPath);
          }
        } catch (fileErr) {
          console.error("Failed to delete old image file:", fileErr);
        }
      }
    }

    const produk = await prisma.produk.update({
      where: { id: produkId },
      data: dataToUpdate
    });

    res.status(200).json({ message: 'Produk updated', produk });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const produkId = parseInt(id);

    const existing = await prisma.produk.findUnique({ where: { id: produkId } });
    if (!existing) {
      return res.status(404).json({ message: 'Produk not found' });
    }

    // Soft delete: set deactivated_at timestamp
    await prisma.produk.update({
      where: { id: produkId },
      data: {
        deactivatedAt: new Date()
      }
    });

    res.status(200).json({ message: 'Produk deactivated successfully for 30 days' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const restoreProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const produkId = parseInt(id);

    const existing = await prisma.produk.findUnique({ where: { id: produkId } });
    if (!existing) {
      return res.status(404).json({ message: 'Produk not found' });
    }

    // Restore product by setting deactivatedAt to null
    const produk = await prisma.produk.update({
      where: { id: produkId },
      data: {
        deactivatedAt: null
      }
    });

    res.status(200).json({ message: 'Produk restored successfully', produk });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllProduk,
  getDeactivatedProduk,
  createProduk,
  updateProduk,
  deleteProduk,
  restoreProduk
};
