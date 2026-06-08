// netlify/functions/bling-token.js
// Troca o "code" do OAuth2 pelo access_token de forma segura (server-side)
// O client_secret nunca fica exposto no HTML público

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code, grant_type, refresh_token } = JSON.parse(event.body || '{}');

    const CLIENT_ID     = process.env.BLING_CLIENT_ID;
    const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Variáveis de ambiente não configuradas.' }) };
    }

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    let body;
    if (grant_type === 'refresh_token') {
      body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token });
    } else {
      body = new URLSearchParams({ grant_type: 'authorization_code', code });
    }

    const response = await fetch('https://www.bling.com.br/b/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '1.0',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
