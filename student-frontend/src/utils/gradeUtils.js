/**
 * Returns the grade label and Tailwind color class for a given percentage.
 * Used by AssignmentArea (attempt history) and ResultPage (result summary).
 */
export function getGrade(pct) {
  if (pct >= 90) return { label: 'A+', color: 'text-green-600' };
  if (pct >= 75) return { label: 'A',  color: 'text-green-600' };
  if (pct >= 60) return { label: 'B',  color: 'text-[#0c63e4]' };
  if (pct >= 40) return { label: 'C',  color: 'text-amber-600' };
  return               { label: 'D',  color: 'text-red-500'   };
}
