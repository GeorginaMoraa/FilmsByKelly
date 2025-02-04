import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import unirest from 'unirest';

const app = express();
app.use(cors());
app.use(express.json());
const requiredEnvVars = ['CONSUMER_KEY', 'CONSUMER_SECRET', 'SHORTCODE', 'PASSKEY', 'CALLBACK_URL'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Get Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');

  try {
    const response = await unirest('GET', 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
      .headers({ Authorization: `Basic ${auth}` })
      .send();
    return response.body.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.response?.body || error.message);
  }
}

// STK Push Route
app.post('/stkpush', async (req, res) => {
  let { phone, amount } = req.body;
  // change the phone number to the format 2547xxxxxxxx and amount to integer
  phone = `254${phone.slice(-9)}`;
  phone = parseInt(phone);
  console.log(phone, amount);

  try {
    const accessToken = await getAccessToken();
    console.log(accessToken);
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    // create a timestamp similar to 20250205003706
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, -3);
    console.log(timestamp);
    const password = Buffer.from(process.env.SHORTCODE + process.env.PASSKEY + timestamp).toString('base64');

    const requestBody = {
      "BusinessShortCode": process.env.SHORTCODE,
      "Password": password,
      "Timestamp": timestamp,
      "TransactionType": "CustomerPayBillOnline",
      "Amount": amount,
      "PartyA": phone,

      "PartyB": 174379,
      "PhoneNumber": phone,
      "CallBackURL": "https://mydomain.com/path",
      "AccountReference": "FilmsByKelvin",
      "TransactionDesc": "pp"
    };
    console.log(requestBody);

    unirest('POST', 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
      .headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      })
      .send(JSON.stringify(requestBody))
      .end(response => {
        if (response.error) {
          res.status(400).json({ error: response.body || response.error });
        } else {
          res.json(response.body);
          console.log(response.body);
        }
      });
  } catch (error) {
    res.status(400).json({ error: error.response?.body || error.message });
  }
});

// Listen on port
app.listen( () => console.log(`Server running on port`));
