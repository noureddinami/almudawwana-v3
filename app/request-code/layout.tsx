import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'طلب إضافة نص قانوني',
  description: 'اطلب إضافة قانون أو مدونة جديدة إلى المنصة — ساهم في إثراء الموسوعة القانونية المغربية.',
  openGraph: {
    title: 'طلب إضافة نص قانوني | المدوّنة',
    description: 'اطلب إضافة قانون أو مدونة جديدة إلى المنصة',
    url: 'https://almudawwana-v3.vercel.app/request-code',
    type: 'website',
    locale: 'ar_MA',
  },
  alternates: {
    canonical: 'https://almudawwana-v3.vercel.app/request-code',
  },
}

export default function RequestCodeLayout({ children }: { children: React.ReactNode }) {
  return children
}
