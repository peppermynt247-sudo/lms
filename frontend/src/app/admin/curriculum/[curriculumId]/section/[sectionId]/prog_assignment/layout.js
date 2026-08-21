import { ProgAssignmentProvider } from '@/contexts/progAssignmentCourses';

export default function ProgAssignmentLayout({ children }) {
  return <ProgAssignmentProvider>{children}</ProgAssignmentProvider>;
} 