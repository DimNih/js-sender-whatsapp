const express = require('express');
const multer = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());

// Endpoint untuk mengirim file ke WhatsApp
app.post('/send', upload.array('files'), async (req, res) => {
    try {
        const number = req.body.number;
        const files = req.files;

        if (!/^[1-9]\d{9,14}$/.test(number)) {
            throw new Error('Format nomor tidak valid');
        }

        // Menjalankan Puppeteer dengan sesi yang tersimpan
        const browser = await puppeteer.launch({
            headless: false,
            userDataDir: "./whatsapp-session", // Menyimpan sesi login
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36');

        console.log("Membuka WhatsApp Web...");
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });

        // Menunggu hingga WhatsApp Web siap digunakan
        try {
            await page.waitForSelector("canvas[aria-label='Scan me!']", { timeout: 10000 });
            console.log("Silakan scan QR code dalam 20 detik...");
            await delay(20000);
        } catch (err) {
            console.log("WhatsApp sudah login...");
        }

        // Membuka chat dengan nomor tujuan
        console.log(`Mengirim pesan ke ${number}...`);
        await page.goto(`https://web.whatsapp.com/send?phone=${number}`, { waitUntil: 'networkidle2' });
        await delay(5000);

        for (const file of files) {
            const filePath = path.resolve(file.path);

            // Menunggu tombol lampiran tersedia dan mengkliknya
            await page.waitForSelector("span[data-testid='clip']", { timeout: 10000 });
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click("span[data-testid='clip']")
            ]);

            // Memilih file dan menunggu tombol kirim tersedia
            await fileChooser.accept([filePath]);
            await page.waitForSelector("span[data-testid='send']", { timeout: 10000 });
            await page.click("span[data-testid='send']");
            await delay(3000);

            // Menghapus file setelah dikirim
            fs.unlinkSync(filePath);
        }

        console.log("Semua file berhasil dikirim.");
        await browser.close();
        res.json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Fungsi delay untuk menunggu proses selesai
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
