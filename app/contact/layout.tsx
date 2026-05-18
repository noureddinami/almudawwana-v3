import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق المدوّنة — أرسل رسالتك أو استفسارك وسنرد عليك في أقرب وقت.',
  openGraph: {
    title: 'تواصل معنا | المدوّنة',
    description: 'تواصل مع فريق المدوّنة — أرسل رسالتك أو استفسارك',
    url: 'https://almudawwana-v3.vercel.app/contact',
    type: 'website',
    locale: 'ar_MA',
  },
  alternates: {
    canonical: 'https://almudawwana-v3.vercel.app/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
