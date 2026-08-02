import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scholaris — CAP Allotment Ingestion & Seat Analytics Portal',
  description: 'Internal college administration ERP for CAP provisional seat allotment parsing, department seat analytics, and candidate auditing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
