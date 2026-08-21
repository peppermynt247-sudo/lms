import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized | ATOMS LMS Admin',
};

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-red-500 mb-4">403</p>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You do not have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primaryColor text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
