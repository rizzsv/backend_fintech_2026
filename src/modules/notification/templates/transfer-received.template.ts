export interface TransferReceivedPayload {
    amount: string;
    senderAccountNumber: string;
    referenceNumber: string;
    timestamp: Date;
}

export function transferReceivedTemplate(payload: TransferReceivedPayload): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transfer Masuk</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #10b981; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">💰 Transfer Masuk</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                                Anda menerima transfer dari pengguna lain.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #374151;">Jumlah Diterima:</strong>
                                        <span style="color: #10b981; font-size: 18px; font-weight: bold; float: right;">Rp ${payload.amount}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                        <strong style="color: #374151;">Dari Rekening:</strong>
                                        <span style="color: #6b7280; float: right;">${payload.senderAccountNumber}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                        <strong style="color: #374151;">Nomor Referensi:</strong>
                                        <span style="color: #6b7280; float: right;">${payload.referenceNumber}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                        <strong style="color: #374151;">Waktu:</strong>
                                        <span style="color: #6b7280; float: right;">${new Date(payload.timestamp).toLocaleString('id-ID')}</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                Dana telah masuk ke wallet Anda.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                Ini adalah email otomatis. Mohon tidak membalas email ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
