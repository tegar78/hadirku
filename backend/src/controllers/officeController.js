const prisma = require('../config/prisma');

async function getOfficeSettings(req, res) {
  try {
    let office = await prisma.officeSetting.findFirst();
    if (!office) {
      office = await prisma.officeSetting.create({
        data: {
          officeName: 'Kantor Pusat HadirKu Jakarta',
          latitude: -6.2088,
          longitude: 106.8456,
          radiusMeters: 50.0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: office,
    });
  } catch (error) {
    console.error('getOfficeSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan lokasi kantor.',
    });
  }
}

async function updateOfficeSettings(req, res) {
  try {
    const { officeName, latitude, longitude, radiusMeters } = req.body;

    if (!officeName || latitude === undefined || longitude === undefined || !radiusMeters) {
      return res.status(400).json({
        success: false,
        message: 'Nama kantor, latitude, longitude, dan radius wajib diisi.',
      });
    }

    let office = await prisma.officeSetting.findFirst();
    if (office) {
      office = await prisma.officeSetting.update({
        where: { id: office.id },
        data: {
          officeName,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusMeters: parseFloat(radiusMeters),
        },
      });
    } else {
      office = await prisma.officeSetting.create({
        data: {
          officeName,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusMeters: parseFloat(radiusMeters),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pengaturan kantor berhasil disimpan.',
      data: office,
    });
  } catch (error) {
    console.error('updateOfficeSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui pengaturan kantor.',
    });
  }
}

module.exports = {
  getOfficeSettings,
  updateOfficeSettings,
};
