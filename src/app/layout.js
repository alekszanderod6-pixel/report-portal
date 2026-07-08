import './globals.css';
import ToastContainer from '@/components/Toast';

export const metadata = {
  title: 'Report Portal | Maintenance - C&I',
  description: 'Weekly Work Summary Report Portal - Sunon Asogli Power, Maintenance Controls & Instrumentations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
