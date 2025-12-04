export const createStaticEmailTemplate = (data: {
    recipientCompany: string;
    recipientName?: string;
    recipientAddress?: string;
    senderName: string;
    senderTitle: string;
    senderCompany: string;
    senderEmail: string;
    senderPhone: string;
    serviceType: string;
    headerColor: string;
    accentColor: string;
    message: string;
    discountCodeCoupon?: string;
}) => {
    const {
        recipientCompany,
        recipientName = "Valued Partner",
        recipientAddress,
        senderName,
        senderTitle,
        senderCompany,
        senderEmail,
        senderPhone,
        serviceType,
        headerColor,
        accentColor,
        message,
        discountCodeCoupon
    } = data;

    const locationContext = recipientAddress ? 
        `While reviewing properties in the ${recipientAddress} area, ` : 
        "While reviewing your property listings, ";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partnership Opportunity - ${senderCompany}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                ${senderCompany.toUpperCase()}
            </h1>
            <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 14px; font-weight: 300;">
                ${serviceType}
            </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px; line-height: 1.6; color: #333333;">
            
            <div style="margin-bottom: 30px;">
                <p style="font-size: 18px; color: ${headerColor}; margin: 0 0 20px 0; font-weight: 600;">
                    Good afternoon ${recipientName ? recipientName : recipientCompany},
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px;">
                    My name is <strong>${senderName}</strong>, ${senderTitle} with ${senderCompany}.
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px;">
                    ${locationContext}I wanted to reach out to discuss potential partnership opportunities.
                </p>
                
                <!-- Custom Message Content -->
                <div style="margin: 0 0 20px 0; font-size: 16px;">
                    ${message.split('\n').map(paragraph => 
                        paragraph.trim() ? `<p style="margin: 0 0 15px 0;">${paragraph}</p>` : ''
                    ).join('')}
                </div>
            </div>

            <!-- Value Proposition Box -->
            <div style="background-color: #f8fafc; border-left: 4px solid ${headerColor}; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 15px 0; color: ${headerColor}; font-size: 18px;">
                    🤝 Partnership Opportunity
                </h3>
                <p style="margin: 0; font-size: 16px; font-style: italic;">
                    We'd be happy to assist with your upcoming needs and explore opportunities to collaborate for future clients who may require our trusted ${serviceType.toLowerCase()}.
                </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="mailto:${senderEmail}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); 
                          color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 50px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(44, 90, 160, 0.3);">
                    📧 Connect With Me Directly
                </a>
            </div>

            <p style="margin: 20px 0 0 0; font-size: 16px;">
                Please feel free to connect with me directly at 
                <a href="mailto:${senderEmail}" style="color: ${headerColor}; text-decoration: none; font-weight: 600;">
                    ${senderEmail}
                </a> or call me at 
                <a href="tel:${senderPhone}" style="color: ${headerColor}; text-decoration: none; font-weight: 600;">
                    ${senderPhone}
                </a> for any inquiries or opportunities.
            </p>

            <p style="margin: 25px 0 0 0; font-size: 16px;">
                Thank you for your time and consideration, and I look forward to the possibility of working together.
            </p>
        </div>

        <!-- Footer/Signature -->
        <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 2px solid #e5e7eb;">
            <div style="text-align: left;">
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${headerColor};">
                    Best regards,
                </p>
                <p style="margin: 10px 0 5px 0; font-size: 16px; font-weight: 600; color: #333333;">
                    ${senderName}
                </p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    ${senderTitle}
                </p>
                <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600; color: ${headerColor};">
                    ${senderCompany}
                </p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                    📧 ${senderEmail} | 📱 ${senderPhone}
                </p>
            </div>
        </div>
        
        <!-- Bottom Border -->
        <div style="height: 8px; background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%);"></div>
    </div>
</body>
</html>
    `;
};
