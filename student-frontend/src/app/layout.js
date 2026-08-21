import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers/Providers";


export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins"
});

export const metadata = {
  title:
    "ABC Technology Training: Top Technology courses & Certificates [2025]",
  description:
    "Join ABC Technology Training and learn C, Java, and Python with our expert-led courses tailored for undergraduates. Learn tech and web development with hands-on projects. Learn, practice, succeed. Enroll today!",
  keywords:
    "technology training,programming courses,web development,C programming,Java programming,Python programming,technology certificates,expert instructors,hands-on projects",
  openGraph: {
    title:
      "ABC Technology Training: Top Technology courses & Certificates [2025]",
    description:
      "Join ABC Technology Training and learn C, Java, and Python with our expert-led courses tailored for undergraduates. Learn tech and web development with hands-on projects. Learn, practice, succeed. Enroll today!",
    url: "https://abc.courses/",
    type: "website"
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "360 Degree Tech Skilling",
      description: "For Undergrads | 5 levels",
      provider: {
        "@type": "Organization",
        name: "ABC Technology Training",
        url: "https://abc.courses/"
      },
      educationalCredentialAwarded: "Certificate",
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        startDate: "2025-01-01"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "ABC's Full Stack Web Development Course",
      description: "For Undergrads | 5 levels",
      provider: {
        "@type": "Organization",
        name: "ABC Technology Training",
        url: "https://abc.courses/"
      },
      educationalCredentialAwarded: "Certificate",
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        startDate: "2025-01-01"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ABC Technology Training",
      url: "https://abc.courses/",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-9035563111", // Replace with actual number
        email: "queries@abc.courses", // Replace with actual email
        contactType: "Customer Support",
        areaServed: "Worldwide",
        availableLanguage: "English"
      }
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
