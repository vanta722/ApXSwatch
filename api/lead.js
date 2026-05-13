export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const params = new URLSearchParams(raw);
    const lead = Object.fromEntries(params.entries());

    const enriched = {
      ...lead,
      capturedAt: new Date().toISOString(),
      source: 'ap-x-swatch-site',
      userAgent: req.headers['user-agent'] || null,
      ipHint: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null
    };

    // Vercel captures console logs in deployment logs. This is the no-database MVP.
    // Later, route this to Airtable, Google Sheets, Supabase, Stripe, or email.
    console.log('LEAD_CAPTURE', JSON.stringify(enriched));

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('LEAD_CAPTURE_ERROR', error);
    return res.status(500).json({ ok: false, error: 'Capture failed' });
  }
}
