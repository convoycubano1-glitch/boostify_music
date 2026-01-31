/**
 * Script para enviar un email de prueba usando Brevo
 * Ejecutar: npx tsx scripts/send-test-email.ts
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const TARGET_EMAIL = 'convoycubano@gmail.com';
const FROM_EMAIL = 'info@boostifymusic.com';
const FROM_NAME = 'Boostify Music';

async function sendTestEmail() {
  console.log('📧 Iniciando envío de email de prueba con Brevo...');
  console.log(`📬 Destinatario: ${TARGET_EMAIL}`);
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: TARGET_EMAIL }],
        subject: '🧪 Test Email - Boostify Music',
        htmlContent: `
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
                          <strong style="color: #10B981;">Brevo</strong> está funcionando correctamente.
                        </p>
                        
                        <!-- Status Box -->
                        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                          <p style="color: #10B981; margin: 0; font-size: 16px;">✅ API Key configurada correctamente</p>
                          <p style="color: #10B981; margin: 10px 0 0 0; font-size: 16px;">✅ Servicio de emails operativo</p>
                          <p style="color: #10B981; margin: 10px 0 0 0; font-size: 16px;">✅ Conexión con Brevo exitosa</p>
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
      })
    });

    const result = await response.json();

    if (result.messageId) {
      console.log('✅ Email enviado exitosamente!');
      console.log('📨 Message ID:', result.messageId);
    } else {
      console.error('❌ Error enviando email:', result);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

sendTestEmail();
