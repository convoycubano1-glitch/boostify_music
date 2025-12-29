/**
 * Script para enviar un email de prueba
 * Ejecutar: npx tsx scripts/send-test-email.ts
 */

import { Resend } from 'resend';

const RESEND_API_KEY = 're_KBRrLf8o_6CnSiPVBXuCGJ2tvnyxt5W3i';
const TARGET_EMAIL = 'convoycubano@gmail.com';
const FROM_EMAIL = 'Boostify Music <info@boostifymusic.com>';

async function sendTestEmail() {
  console.log('📧 Iniciando envío de email de prueba...');
  console.log(`📬 Destinatario: ${TARGET_EMAIL}`);
  
  const resend = new Resend(RESEND_API_KEY);
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TARGET_EMAIL,
      subject: '🧪 Test Email - Boostify Music',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #F59E0B; font-size: 32px;">🎵 Boostify Music</h1>
                      <p style="color: #888; margin: 10px 0 0 0;">Email de Prueba</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <p style="color: white; font-size: 18px; margin: 0 0 20px 0;">¡Hola!</p>
                      <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Este es un email de prueba para confirmar que el servicio de emails de 
                        <strong style="color: #F59E0B;">Resend</strong> está funcionando correctamente.
                      </p>
                      
                      <!-- Status Box -->
                      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="color: #F59E0B; margin: 0; font-size: 16px;">✅ API Key configurada correctamente</p>
                        <p style="color: #F59E0B; margin: 10px 0 0 0; font-size: 16px;">✅ Servicio de emails operativo</p>
                        <p style="color: #F59E0B; margin: 10px 0 0 0; font-size: 16px;">✅ Conexión con Resend exitosa</p>
                      </div>
                      
                      <p style="color: #888; font-size: 14px; margin: 30px 0 0 0;">
                        Enviado: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: #666; font-size: 12px; margin: 0;">
                        © 2025 Boostify Music. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      return;
    }

    console.log('✅ Email enviado exitosamente!');
    console.log('📨 Message ID:', data?.id);
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

sendTestEmail();
