/**
 * Resend Email Service
 * Handles all email communications for Boostify Music platform
 * Supports artist generation notifications, welcome emails, and platform events
 */

import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = 'Boostify Music <noreply@boostifymusic.com>';
const SUPPORT_EMAIL = 'support@boostifymusic.com';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ArtistGeneratedEmailData {
  userEmail: string;
  userName: string;
  artistName: string;
  artistSlug: string;
  profileImageUrl?: string;
  genres: string[];
  songsCount: number;
  tokenSymbol?: string;
}

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
}

export interface TokenPurchaseEmailData {
  userEmail: string;
  userName: string;
  artistName: string;
  tokenAmount: number;
  tokenSymbol: string;
  transactionHash: string;
}

export interface SongTokenizedEmailData {
  userEmail: string;
  userName: string;
  artistName: string;
  songTitle: string;
  tokenId: string;
}

/**
 * Send email when a new AI artist is generated
 */
export async function sendArtistGeneratedEmail(data: ArtistGeneratedEmailData): Promise<EmailResult> {
  try {
    const artistUrl = `https://boostifymusic.com/artists/${data.artistSlug}`;
    const boostiswapUrl = `https://boostifymusic.com/boostiswap`;
    
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: `🎵 Your AI Artist "${data.artistName}" is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your AI Artist is Ready</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎵 BOOSTIFY MUSIC</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                        Hey ${data.userName}! 🎉
                      </h2>
                      
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Great news! Your AI-powered artist <strong style="color: #EC4899;">"${data.artistName}"</strong> has been successfully generated and is now live on Boostify Music!
                      </p>
                      
                      ${data.profileImageUrl ? `
                      <div style="text-align: center; margin-bottom: 30px;">
                        <img src="${data.profileImageUrl}" alt="${data.artistName}" style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid #8B5CF6; object-fit: cover;">
                      </div>
                      ` : ''}
                      
                      <!-- Stats -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 15px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1);">
                            <div style="color: #8B5CF6; font-size: 28px; font-weight: bold;">${data.songsCount}</div>
                            <div style="color: #a0a0a0; font-size: 12px; text-transform: uppercase;">Songs</div>
                          </td>
                          <td style="padding: 15px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1);">
                            <div style="color: #EC4899; font-size: 28px; font-weight: bold;">${data.genres.length}</div>
                            <div style="color: #a0a0a0; font-size: 12px; text-transform: uppercase;">Genres</div>
                          </td>
                          <td style="padding: 15px; text-align: center;">
                            <div style="color: #10B981; font-size: 28px; font-weight: bold;">${data.tokenSymbol || 'BTF'}</div>
                            <div style="color: #a0a0a0; font-size: 12px; text-transform: uppercase;">Token</div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                        <strong style="color: #ffffff;">Genres:</strong> ${data.genres.join(', ')}
                      </p>
                      
                      <!-- CTA Buttons -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                        <tr>
                          <td style="padding-right: 10px;">
                            <a href="${artistUrl}" style="display: block; background: linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 15px 25px; border-radius: 8px; font-weight: bold; text-align: center;">
                              View Artist Profile →
                            </a>
                          </td>
                          <td style="padding-left: 10px;">
                            <a href="${boostiswapUrl}" style="display: block; background: linear-gradient(90deg, #EC4899 0%, #DB2777 100%); color: white; text-decoration: none; padding: 15px 25px; border-radius: 8px; font-weight: bold; text-align: center;">
                              Trade Tokens 🪙
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                        Your artist's tokens are now available on BoostiSwap! Start trading and let the world discover your music.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #0f0f1a; padding: 25px; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        © 2025 Boostify Music. All rights reserved.<br>
                        <a href="https://boostifymusic.com" style="color: #8B5CF6; text-decoration: none;">boostifymusic.com</a>
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
      console.error('❌ Resend error sending artist generated email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Artist generated email sent to:', data.userEmail);
    return { success: true, messageId: result?.id };
  } catch (error: any) {
    console.error('❌ Error sending artist generated email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: `🎵 Welcome to Boostify Music, ${data.userName}!`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px;">🎵 BOOSTIFY MUSIC</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #ffffff; margin: 0 0 20px 0;">Welcome, ${data.userName}! 🎉</h2>
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                        You've just joined the future of music! With Boostify Music, you can:
                      </p>
                      <ul style="color: #a0a0a0; font-size: 14px; line-height: 2;">
                        <li>🤖 Generate AI-powered artists with unique music</li>
                        <li>🪙 Trade artist tokens on BoostiSwap</li>
                        <li>🎬 Create stunning music videos</li>
                        <li>📱 Build your artist's social media presence</li>
                        <li>🛍️ Launch merchandise collections</li>
                      </ul>
                      <a href="https://boostifymusic.com/my-artists" style="display: inline-block; background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin-top: 20px;">
                        Create Your First Artist →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #0f0f1a; padding: 25px; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        © 2025 Boostify Music. All rights reserved.
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
      console.error('❌ Resend error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Welcome email sent to:', data.userEmail);
    return { success: true, messageId: result?.id };
  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email when user purchases artist tokens
 */
export async function sendTokenPurchaseEmail(data: TokenPurchaseEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: `🪙 Token Purchase Confirmed - ${data.tokenAmount} ${data.tokenSymbol}`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(90deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px;">🪙 Purchase Confirmed!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #ffffff; margin: 0 0 20px 0;">Hey ${data.userName}! 🎉</h2>
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                        Your token purchase has been confirmed on the Polygon blockchain!
                      </p>
                      <table width="100%" style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <tr>
                          <td style="color: #a0a0a0; padding: 10px;">Artist:</td>
                          <td style="color: #ffffff; padding: 10px; font-weight: bold;">${data.artistName}</td>
                        </tr>
                        <tr>
                          <td style="color: #a0a0a0; padding: 10px;">Amount:</td>
                          <td style="color: #10B981; padding: 10px; font-weight: bold; font-size: 24px;">${data.tokenAmount} ${data.tokenSymbol}</td>
                        </tr>
                        <tr>
                          <td style="color: #a0a0a0; padding: 10px;">Transaction:</td>
                          <td style="padding: 10px;">
                            <a href="https://polygonscan.com/tx/${data.transactionHash}" style="color: #8B5CF6; text-decoration: none; font-size: 12px;">
                              ${data.transactionHash.substring(0, 20)}...
                            </a>
                          </td>
                        </tr>
                      </table>
                      <a href="https://boostifymusic.com/boostiswap" style="display: inline-block; background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                        View Your Portfolio →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #0f0f1a; padding: 25px; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 Boostify Music</p>
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
      return { success: false, error: error.message };
    }

    console.log('✅ Token purchase email sent to:', data.userEmail);
    return { success: true, messageId: result?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send email when a song is tokenized
 */
export async function sendSongTokenizedEmail(data: SongTokenizedEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: `🎵 Song Tokenized: "${data.songTitle}" is now on-chain!`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px;">🎵 Song Tokenized!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #ffffff; margin: 0 0 20px 0;">Hey ${data.userName}! 🎉</h2>
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                        Your song <strong style="color: #F59E0B;">"${data.songTitle}"</strong> by <strong>${data.artistName}</strong> has been successfully tokenized on the Polygon blockchain!
                      </p>
                      <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="color: #a0a0a0; margin: 0 0 10px 0; font-size: 14px;">Token ID</p>
                        <p style="color: #F59E0B; margin: 0; font-size: 18px; font-weight: bold;">${data.tokenId}</p>
                      </div>
                      <p style="color: #6b7280; font-size: 14px;">
                        This song is now part of the BTF-2300 ecosystem and can earn royalties from streams and trades.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #0f0f1a; padding: 25px; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 Boostify Music</p>
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
      return { success: false, error: error.message };
    }

    console.log('✅ Song tokenized email sent to:', data.userEmail);
    return { success: true, messageId: result?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send generic notification email
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string,
  ctaText?: string,
  ctaUrl?: string
): Promise<EmailResult> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px;">🎵 BOOSTIFY MUSIC</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #ffffff; margin: 0 0 20px 0;">${title}</h2>
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">${message}</p>
                      ${ctaText && ctaUrl ? `
                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin-top: 20px;">
                          ${ctaText}
                        </a>
                      ` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #0f0f1a; padding: 25px; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 Boostify Music</p>
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
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default {
  sendArtistGeneratedEmail,
  sendWelcomeEmail,
  sendTokenPurchaseEmail,
  sendSongTokenizedEmail,
  sendNotificationEmail
};
