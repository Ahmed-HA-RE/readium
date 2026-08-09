import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailDomain = process.env.EMAIL_DOMAIN;

export { resend, emailDomain };
