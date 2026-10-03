import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { to, otp, secret } = await req.json();

    // A simple secret check so nobody can abuse this endpoint
    if (secret !== process.env.EMAIL_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!to || !otp) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
      },
    });

    await transporter.sendMail({
      from: `"Loomus" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Verify your Loomus account",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #ffffff; border-radius: 12px;">
          <h2 style="color: #3b82f6; margin-bottom: 8px;">Loomus</h2>
          <p style="color: #a0a0a0; font-size: 14px;">Your verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; padding: 20px 0; text-align: center;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px;">This code expires in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Vercel Email API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
