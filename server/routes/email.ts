import { Express, Request, Response } from "express";
import sgMail from "@sendgrid/mail";
import { authenticate } from "../middleware/auth";
import { log } from "../vite";

/**
 * Configura las rutas relacionadas con el envío de emails
 */
export function setupEmailRoutes(app: Express) {
  // Inicializar SendGrid con la API key
  const sendgridApiKey = process.env.VITE_SENDGRID_API_KEY;
  if (sendgridApiKey) {
    sgMail.setApiKey(sendgridApiKey);
  } else {
    log("Warning: SendGrid API Key not found", "email-service");
  }

  /**
   * Endpoint para enviar perfil de artista por email
   * Requiere autenticación del usuario
   */
  app.post("/api/email/send-profile", authenticate, async (req: Request, res: Response) => {
    try {
      const {
        to,
        contactName,
        contactCompany,
        artistName,
        artistBio,
        customMessage,
        artistGenre,
        socialLinks,
        userId
      } = req.body;

      // Validación básica
      if (!to || !artistName || !customMessage) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Verificar si el usuario autenticado coincide con el userId
      if (req.user?.uid !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: User ID mismatch"
        });
      }

      // Construir el email HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(to right, #ff7e33, #f059a0); padding: 20px; color: white; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { font-size: 12px; color: #777; margin-top: 30px; text-align: center; }
            .social-links { margin-top: 20px; }
            .social-links a { display: inline-block; margin-right: 10px; color: #ff7e33; text-decoration: none; }
            .message { white-space: pre-line; background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Perfil Artístico: ${artistName}</h1>
            <p>${artistGenre || 'Música'}</p>
          </div>
          <div class="content">
            <p>Estimado/a ${contactName},</p>
            
            <div class="message">${customMessage}</div>
            
            <h3>Sobre el artista:</h3>
            <p>${artistBio}</p>
            
            <div class="social-links">
              ${socialLinks.spotify ? `<a href="${socialLinks.spotify}" target="_blank">Spotify</a>` : ''}
              ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" target="_blank">Instagram</a>` : ''}
              ${socialLinks.youtube ? `<a href="${socialLinks.youtube}" target="_blank">YouTube</a>` : ''}
            </div>
            
            <div class="footer">
              <p>Este correo fue enviado a través de Boostify Music - Plataforma de promoción y distribución musical</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Configuración del email
      const msg = {
        to,
        from: 'no-reply@boostifymusic.com', // Debe ser un dominio verificado en SendGrid
        subject: `Perfil artístico para ${contactCompany}`,
        text: customMessage,
        html: htmlContent,
      };

      // Enviar el email
      await sgMail.send(msg);

      // Registro de actividad
      log(`Email sent to ${to} for user ${userId}`, "email-service");

      return res.status(200).json({
        success: true,
        message: "Profile email sent successfully"
      });
    } catch (error) {
      console.error("Error sending profile email:", error);
      
      return res.status(500).json({
        success: false,
        message: "Error sending email",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}