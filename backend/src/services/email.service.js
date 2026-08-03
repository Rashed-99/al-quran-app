import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST) {
    // No SMTP configured - log instead of sending, so local dev / early
    // deploys don't crash the weekly job before email is set up.
    transporter = {
      sendMail: async (opts) => {
        console.log('[email.service] SMTP not configured, would have sent:', opts);
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT || 587,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendWeeklyLeaderboardEmail({ to, username, groupName, rank, versesRead }) {
  const subject =
    rank === 1
      ? `You're #1 in ${groupName} this week! 🎉`
      : `Your weekly recap for ${groupName}`;

  const text =
    rank === 1
      ? `Assalamu alaikum ${username},\n\nMashaAllah, you finished #1 in "${groupName}" this week with ${versesRead} verses read. Keep it up!`
      : `Assalamu alaikum ${username},\n\nThis week in "${groupName}" you read ${versesRead} verses, finishing #${rank}. Keep going!`;

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
  });
}
