import axios from 'axios';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export class PayPalService {
    private async getAccessToken(): Promise<string> {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('PayPal credentials not configured');
        }

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await axios({
            url: `${PAYPAL_API}/v1/oauth2/token`,
            method: 'post',
            data: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data.access_token;
    }

    async createOrder(orderId: string, amount: number, currency: string = 'USD'): Promise<string> {
        const accessToken = await this.getAccessToken();
        const response = await axios({
            url: `${PAYPAL_API}/v2/checkout/orders`,
            method: 'post',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            data: {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: orderId,
                        amount: {
                            currency_code: currency,
                            value: amount.toFixed(2),
                        },
                    },
                ],
            },
        });

        return response.data.id;
    }

    async captureOrder(paypalOrderId: string): Promise<any> {
        const accessToken = await this.getAccessToken();
        const response = await axios({
            url: `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
            method: 'post',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    }
}
