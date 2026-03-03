import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import RoleGuard from '@/components/RoleGuard';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zimlymart Admin',
  robots: { index: false, follow: false }, // Never index admin
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
