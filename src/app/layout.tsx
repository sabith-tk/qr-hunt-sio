import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QR Scavenger Hunt',
  description: 'Gamified QR code scavenger hunt application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
