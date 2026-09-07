// Mock notification provider for local development and CI.
// Lets the flow run end-to-end without any email credentials.

import type { NotificationProvider } from "./types";

export const mockNotifications: NotificationProvider = {
  async sendEmail(to, template) {
    console.log(`[mock email] -> ${to} (${template})`);
  },
  async sendWhatsApp(to, template) {
    console.log(`[mock whatsapp] -> ${to} (${template})`);
  },
};
