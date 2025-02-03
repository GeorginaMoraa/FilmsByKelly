require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Get Access Token
async function getAccessToken() {
    const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');

    try {
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response.data);
    }
}

// STK Push Route
app.post('/stkpush', async (req, res) => {
    const { phone, amount } = req.body;

    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(process.env.SHORTCODE + process.env.PASSKEY + timestamp).toString('base64');

    const requestBody = {
        "BusinessShortCode": process.env.SHORTCODE,
        "Password": "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMTYwMjE2MTY1NjI3",
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": process.env.SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": process.env.CALLBACK_URL,
        "AccountReference": "Portfolio Payment",
        "TransactionDesc": "Payment for services"
    };

    try {
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            requestBody,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        res.json(response.data);
    } catch (error) {
        res.status(400).json({ error: error.response.data });
    }
});

// Listen on port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
