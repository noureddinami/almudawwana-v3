import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/code-requests — submit a new code request (public, no auth required)
 * Stores in Supabase `code_requests` table.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, codeTitle, codeLink, notes } = await req.json()

    if (!name?.trim() || !email?.trim() || !codeTitle?.trim()) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة ناقصة (الاسم، البريد، عنوان النص)' },
        { status: 422 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase.from('code_requests').insert({
      name: name.trim(),
      email: email.trim(),
      code_title: codeTitle.trim(),
      code_link: codeLink?.trim() || null,
      notes: notes?.trim() || null,
      status: 'pending',
    }).select().single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء حفظ الطلب' },
        { status: 500 }
      )
    }

    // Try to send email notification (non-blocking)
    try {
      const nodemailer = require('nodemailer')
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })

        await transporter.sendMail({
          from: `"المدوّنة" <${process.env.SMTP_USER}>`,
          to: '9anoni@gmail.com',
          replyTo: email,
          subject: `طلب إضافة نص قانوني: ${codeTitle}`,
          html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#059669;border-bottom:2px solid #d1fae5;padding-bottom:12px">
                طلب إضافة نص قانوني جديد
              </h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#64748b;width:120px">عنوان النص</td>
                    <td style="padding:8px 0;font-weight:600">${codeTitle}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">الرابط</td>
                    <td style="padding:8px 0">${codeLink ? `<a href="${codeLink}">${codeLink}</a>` : '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">الاسم</td>
                    <td style="padding:8px 0">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">البريد</td>
                    <td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
              </table>
              ${notes ? `<div style="margin-top:16px;background:#f0fdf4;border-right:4px solid #10b981;padding:12px;border-radius:8px;white-space:pre-wrap">${notes}</div>` : ''}
            </div>
          `,
        })
      }
    } catch (emailErr) {
      // Email is optional — request is already saved in DB
      console.warn('Email notification failed:', emailErr)
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: any) {
    console.error('Code request error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
