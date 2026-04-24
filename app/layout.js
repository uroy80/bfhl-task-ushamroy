import './globals.css';

export const metadata = {
  title: 'BFHL — Hierarchy Analyzer',
  description: 'Analyze parent → child edges, detect trees and cycles, and explore hierarchies.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
