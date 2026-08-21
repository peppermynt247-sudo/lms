import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';




export async function POST(req) {
  try {
    const { email, certificate } = await req.json();


    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

        // Send email to the digital marketing team
        await transporter.sendMail({
            from: `"ABC Courses" <${process.env.GMAIL_USERNAME}>`,
            to: process.env.GMAIL_USERNAME,
            subject: "Student Downloaded Certificate",
            text: `A student has downloaded their workshop certificate.\n\nStudent Email: ${email}\nCertificate Link: ${certificate}`,
          });

    // Return a success response
    return NextResponse.json(
      { message: 'Emails sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);

    return NextResponse.json(
      { message: 'Failed to send emails.', error: error.message },
      { status: 500 }
    );
  }
}
