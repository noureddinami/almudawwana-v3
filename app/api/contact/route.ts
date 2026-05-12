import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'الحقول المطلوبة ناقصة' }, { status: 422 });
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from:    `"المدوّنة - تواصل" <${process.env.SMTP_USER}>`,
    to:      '9anoni@gmail.com',
    replyTo: email,
    subject: subject?.trim() || `رسالة جديدة من ${name}`,
    text: `الاسم: ${name}\nالبريد: ${email}\n\n${message}`,
    html: `
      <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:12px">
          رسالة جديدة — المدوّنة
        </h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#64748b;width:100px">الاسم</td>
              <td style="padding:8px 0;font-weight:600">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">البريد</td>
              <td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          ${subject ? `<tr><td style="padding:8px 0;color:#64748b">الموضوع</td>
              <td style="padding:8px 0">${subject}</td></tr>` : ''}
        </table>
        <div style="margin-top:20px;background:#f8fafc;border-right:4px solid #3b82f6;
                    padding:16px;border-radius:8px;white-space:pre-wrap;line-height:1.8">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center">
          منصة المدوّنة — البريد الوارد
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
