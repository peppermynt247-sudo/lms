import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: 'ATOMS LMS — Admin Panel',
  description: 'Admin panel for ABC Technology Training & Upskilling.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`bg-gray-50 antialiased ${poppins.className}`}>
        <ToastContainer
          position="top-center"
          autoClose={3500}
          hideProgressBar={true}
          closeOnClick
          pauseOnHover
          draggable
          stacked
          toastClassName="atoms-toast"
          bodyClassName="atoms-toast__body"
          progressClassName="atoms-toast__progress"
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
