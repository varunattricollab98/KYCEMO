// Notification provider interface. Kept behind an adapter so the email vendor
// (currently Resend) is a config swap, not a rewrite.

export interface NotificationProvider {
  sendEmail(to: string, template: string, data: object): Promise<void>;
  sendWhatsApp(to: string, template: string, data: object): Promise<void>;
}
