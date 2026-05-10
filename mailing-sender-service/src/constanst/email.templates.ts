export const emailTemplate = (name: string, message: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Wrapper Table -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background-color: #f0f2f5;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <!-- Main Container with Shadow -->
          <table role="presentation" style="
            width: 100%;
            max-width: 600px;
            border-collapse: collapse;
            border: 0;
            border-spacing: 0;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.08), 
                        0 4px 6px rgba(0, 0, 0, 0.05),
                        0 1px 3px rgba(0, 0, 0, 0.08);
          ">
            
            <!-- Header Section -->
            <tr>
              <td style="padding: 40px 30px; background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%); border-bottom: 1px solid #e5e7eb;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                  <tr>
                    <td align="center">
                      <h1 style="
                        font-size: 32px; 
                        margin: 0; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
                        font-weight: 700;
                        letter-spacing: -0.5px;
                      ">
                        <span style="color: rgb(28, 174, 79);">CREDIT</span><span style="color:rgb(0, 0, 0); text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);">JAMBO</span>
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Body Section -->
            <tr>
              <td style="padding: 40px 30px; background: #ffffff;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                  <tr>
                    <td style="color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <!-- Greeting -->
                      <h2 style="
                        font-size: 24px; 
                        margin: 0 0 24px 0; 
                        color: #111827;
                        font-weight: 600;
                        line-height: 1.3;
                      ">
                        Hello ${name},
                      </h2>
                      
                      <!-- Message Container with Modern Design -->
                      <div style="
                        background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%);
                        border-radius: 10px;
                        padding: 24px;
                        margin: 20px 0 30px 0;
                        border-left: 4px solid rgb(28, 174, 79);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06),
                                    0 1px 2px rgba(0, 0, 0, 0.04);
                        position: relative;
                      ">
                        <p style="
                          margin: 0; 
                          font-size: 16px; 
                          line-height: 1.6;
                          color: #374151;
                        ">
                          ${message}
                        </p>
                      </div>
                      
                      <!-- Optional: Call-to-Action Button (if needed in future) -->
                      <!-- 
                      <div style="text-align: center; margin-top: 32px;">
                        <a href="#" style="
                          display: inline-block;
                          padding: 12px 32px;
                          background: rgb(28, 174, 79);
                          color: #ffffff;
                          text-decoration: none;
                          border-radius: 6px;
                          font-weight: 600;
                          font-size: 16px;
                          box-shadow: 0 2px 4px rgba(28, 174, 79, 0.2);
                        ">
                          Take Action
                        </a>
                      </div>
                      -->
                      
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer Section -->
            <tr>
              <td style="
                padding: 30px;
                background: rgb(161, 237, 213);
                border-top: 1px solid rgba(255, 255, 255, 0.2);
              ">
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                  <tr>
                    <td align="center">
                      <p style="
                        margin: 0 0 8px 0; 
                        font-size: 14px; 
                        line-height: 1.5;
                        color: #1f2937;
                        font-weight: 500;
                      ">
                         © 2025 Digital Credit & Savings Platform
                      </p>
                      <p style="
                        margin: 0;
                        font-size: 12px;
                        color: #374151;
                        opacity: 0.8;
                      ">
                        All rights reserved
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Invisible Spacer for Better Email Client Rendering -->
    <div style="display: none; max-height: 0; overflow: hidden;">
      &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
  </body>
</html>
`;

// Alternative version with stronger shadows if you prefer more depth
export const emailTemplateStrongerShadow = (name: string, message: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
  </head>
  <body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e5e7eb 0%, #f3f4f6 100%); min-height: 100vh;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
      <tr>
        <td align="center" style="padding: 60px 20px;">
          <!-- Card-style Container with Elevated Shadow -->
          <table role="presentation" style="
            width: 100%;
            max-width: 600px;
            border-collapse: collapse;
            border: 0;
            border-spacing: 0;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
                        0 10px 10px -5px rgba(0, 0, 0, 0.04),
                        0 0 0 1px rgba(0, 0, 0, 0.05);
            transform: translateY(0);
          ">
            
            <!-- Header with Gradient Background -->
            <tr>
              <td style="
                padding: 48px 30px;
                background: linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, #f9fafb 100%);
                border-bottom: 2px solid rgba(28, 174, 79, 0.1);
                position: relative;
              ">
                <!-- Decorative Element -->
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, rgb(28, 174, 79) 0%, rgb(161, 237, 213) 100%);
                "></div>
                
                <h1 style="
                  font-size: 36px; 
                  margin: 0; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
                  font-weight: 800;
                  letter-spacing: -1px;
                  text-align: center;
                ">
                  <span style="color: rgb(28, 174, 79);">CREDIT</span><span style="
                    color:rgb(0, 0, 0); 
                    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15),
                                 1px 1px 3px rgba(0, 0, 0, 0.2);
                    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                  ">JAMBO</span>
                </h1>
              </td>
            </tr>
            
            <!-- Content Body -->
            <tr>
              <td style="padding: 48px 30px; background: #ffffff;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                  <tr>
                    <td>
                      <h2 style="
                        font-size: 26px; 
                        margin: 0 0 28px 0; 
                        color: #111827;
                        font-weight: 600;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                      ">
                        Hello ${name},
                      </h2>
                      
                      <!-- Enhanced Message Box -->
                      <div style="
                        background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
                        border-radius: 12px;
                        padding: 28px;
                        margin: 24px 0 32px 0;
                        border-left: 5px solid rgb(28, 174, 79);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08),
                                    0 2px 4px rgba(0, 0, 0, 0.06),
                                    inset 0 1px 2px rgba(255, 255, 255, 0.5);
                        position: relative;
                        overflow: hidden;
                      ">
                        <!-- Decorative gradient overlay -->
                        <div style="
                          position: absolute;
                          top: 0;
                          right: 0;
                          width: 100px;
                          height: 100px;
                          background: radial-gradient(circle, rgba(28, 174, 79, 0.05) 0%, transparent 70%);
                          border-radius: 50%;
                          transform: translate(30%, -30%);
                        "></div>
                        
                        <p style="
                          margin: 0; 
                          font-size: 16px; 
                          line-height: 1.7;
                          color: #374151;
                          position: relative;
                          z-index: 1;
                        ">
                          ${message}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Modern Footer -->
            <tr>
              <td style="
                padding: 36px 30px;
                background: linear-gradient(135deg, rgb(161, 237, 213) 0%, rgba(161, 237, 213, 0.9) 100%);
                border-top: 1px solid rgba(28, 174, 79, 0.1);
                position: relative;
              ">
                <!-- Subtle pattern overlay -->
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  opacity: 0.05;
                  background-image: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(0, 0, 0, 0.1) 10px,
                    rgba(0, 0, 0, 0.1) 20px
                  );
                "></div>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; position: relative; z-index: 1;">
                  <tr>
                    <td align="center">
                      <p style="
                        margin: 0 0 10px 0; 
                        font-size: 14px; 
                        line-height: 1.5;
                        color: #1f2937;
                        font-weight: 600;
                        letter-spacing: 0.3px;
                      ">
                        © 2025 Digital Credit & Savings Platform
                      </p>
                      <p style="
                        margin: 0;
                        font-size: 12px;
                        color: #374151;
                        opacity: 0.75;
                      ">
                        Keeping track of what matters
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;