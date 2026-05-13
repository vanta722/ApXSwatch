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
    const form = Object.fromEntries(params.entries());

    const lead = {
      name: form.name || null,
      contact: form.contact || '',
      finish_lane: form.style || form.finish_lane || null,
      price_range: form.price || form.price_range || null,
      notes: form.notes || null,
      source: 'ap-x-swatch-site',
      referrer: req.headers.referer || req.headers.referrer || null,
      user_agent: req.headers['user-agent'] || null,
      ip_hint: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      metadata: {
        raw: form
      }
    };

    if (!lead.contact) {
      return res.status(400).json({ ok: false, error: 'Contact is required' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('LEAD_CAPTURE_PENDING_SUPABASE_ENV', JSON.stringify(lead));
      return res.status(202).json({ ok: true, pending: true });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(lead)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SUPABASE_LEAD_INSERT_ERROR', response.status, errorText, JSON.stringify(lead));
      return res.status(500).json({ ok: false, error: 'Lead capture failed' });
    }

    console.log('LEAD_CAPTURE_SUPABASE_OK', JSON.stringify({ contact: lead.contact, finish_lane: lead.finish_lane }));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('LEAD_CAPTURE_ERROR', error);
    return res.status(500).json({ ok: false, error: 'Capture failed' });
  }
}
