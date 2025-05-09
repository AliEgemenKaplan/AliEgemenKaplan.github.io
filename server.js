require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB bağlantısı başarılı"))
.catch((err) => console.error("MongoDB bağlantı hatası:", err));

// Schema ve model
const MessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// İletişim formu POST işlemi
app.post('/api/messages', async (req, res) => {
  console.log("İSTEK GELDİ ✅", req.body);

  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    console.log("KAYIT BAŞARILI ✅");

    // Mail gönderimi
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kaliegemen@gmail.com',
        pass: process.env.MAIL_PASS
      }
    });

    const mailOptions = {
      from: req.body.email,
      to: 'kaliegemen@gmail.com',
      subject: `[İletişim Formu] ${req.body.subject}`,
      text: `Ad: ${req.body.name}
E-posta: ${req.body.email}

Mesaj:
${req.body.message}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('Mail gönderim hatası:', error);
      } else {
        console.log('Mail gönderildi:', info.response);
      }
    });

    res.status(200).json({ message: 'Mesaj başarıyla kaydedildi ve mail gönderildi!' });
  } catch (err) {
    console.log("HATA OLDU ❌", err);
    res.status(500).json({ error: 'Kayıt veya mail gönderimi başarısız!' });
  }
});

// Tüm mesajları getirme
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ date: -1 });
  res.json(messages);
});

// Mesaj silme
app.delete('/api/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mesaj silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Silme işlemi başarısız' });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
