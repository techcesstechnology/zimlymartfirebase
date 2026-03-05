"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalService = void 0;
const axios_1 = __importDefault(require("axios"));
const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
class PayPalService {
    async getAccessToken() {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            throw new Error('PayPal credentials not configured');
        }
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await (0, axios_1.default)({
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
    async createOrder(orderId, amount, currency = 'USD') {
        const accessToken = await this.getAccessToken();
        const response = await (0, axios_1.default)({
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
    async captureOrder(paypalOrderId) {
        const accessToken = await this.getAccessToken();
        const response = await (0, axios_1.default)({
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
exports.PayPalService = PayPalService;
//# sourceMappingURL=PayPalService.js.map