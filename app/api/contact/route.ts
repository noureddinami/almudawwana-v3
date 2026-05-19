import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'الحقول المطلوبة ناقصة' }, { status: 422 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 422 });
    }

    // Rate limiting: max 3 messages per email per hour (check in DB)
    const supabase = createPublicClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('created_at', oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'لقد أرسلت عدة رسائل مؤخراً. يرجى الانتظار قليلاً.' }, { status: 429 });
    }

    // Save to database
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || null,
        message: message.trim(),
        status: 'new',
      });

    if (error) {
      console.error('Contact insert error:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء الإرسال' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'حدث خطأ أثناء الإرسال' }, { status: 500 });
  }
}
