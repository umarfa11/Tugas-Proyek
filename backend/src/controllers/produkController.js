const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Fungsi bantuan untuk mengekstrak public_id dari URL Cloudinary
const extractPublicId = (url) => {
  if (!url) return null;
  // Contoh URL: https://res.cloudinary.com/demo/image/upload/v1234567890/tugas-proyek-produk/produk-12345.jpg
  const parts = url.split('/');
  const filename = parts[parts.length - 1]; // produk-12345.jpg
  const folder = parts[parts.length - 2]; // tugas-proyek-produk
  const publicId = filename.split('.')[0];
  return `${folder}/${publicId}`;
};

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
      select: { id: true, gambar: true }
    });

    if (productsToDelete.length === 0) return;

    console.log(`[CLEANUP] Found ${productsToDelete.length} expired deactivated products. Attempting deletion...`);

    for (const item of productsToDelete) {
      try {
        await prisma.produk.delete({
          where: { id: item.id }
        });
        
        if (item.gambar && item.gambar.includes('cloudinary')) {
           const publicId = extractPublicId(item.gambar);
           if (publicId) {
             await cloudinary.uploader.destroy(publicId);
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
    const { namaProduk, harga, hargaModal, stok, kategori } = req.body;
    
    if (!namaProduk || harga == null || stok == null || !kategori) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // req.file.path berisi URL gambar dari Cloudinary
    const gambar = req.file ? req.file.path : null;

    const produk = await prisma.produk.create({
      data: {
        namaProduk,
        kategori,
        harga: Number(harga),
        hargaModal: hargaModal ? Number(hargaModal) : 0,
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
    const { namaProduk, harga, hargaModal, stok, kategori } = req.body;

    const produkId = parseInt(id);
    const existing = await prisma.produk.findUnique({ where: { id: produkId } });

    if (!existing) {
      return res.status(404).json({ message: 'Produk not found' });
    }

    const dataToUpdate = {
      namaProduk: namaProduk || existing.namaProduk,
      kategori: kategori || existing.kategori,
      harga: harga != null ? Number(harga) : existing.harga,
      hargaModal: hargaModal != null ? Number(hargaModal) : existing.hargaModal,
      stok: stok != null ? Number(stok) : existing.stok
    };

    if (req.file) {
      dataToUpdate.gambar = req.file.path; // URL dari Cloudinary
      if (existing.gambar && existing.gambar.includes('cloudinary')) {
         const publicId = extractPublicId(existing.gambar);
         if (publicId) await cloudinary.uploader.destroy(publicId);
      }
    } else if (req.body.removeImage === 'true') {
      dataToUpdate.gambar = null;
      if (existing.gambar && existing.gambar.includes('cloudinary')) {
         const publicId = extractPublicId(existing.gambar);
         if (publicId) await cloudinary.uploader.destroy(publicId);
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
