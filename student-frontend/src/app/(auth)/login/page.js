import StudentLoginForm from '@/components/sections/Student/StudentLoginForm';

export const metadata = {
  title: 'Sign In | ATOMS LMS',
  description: 'Sign in to the ATOMS LMS student portal.',
};

export default function LoginPage() {
  return <StudentLoginForm />;
}
