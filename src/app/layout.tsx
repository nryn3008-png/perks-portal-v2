import type { Metadata } from 'next';
import { Mulish } from 'next/font/google';
import '@/styles/globals.css';

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-mulish',
});

export const metadata: Metadata = {
  title: 'Perks Portal',
  description: 'Discover and redeem exclusive startup perks from your VC portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mulish.variable}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
