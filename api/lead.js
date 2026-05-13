import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body — handles both URLSearchParams and JSON
    let body = req.body;
    if (typeof body === 'string') {
      const params = new URLSearchParams(body);
      body = Object.fromEntries(params.entries());
    }

    const { name, contact, style, price, notes } = body;

    if (!contact) {
      return res.status(400).json({ error: 'Contact is required' });
    }

    const { error } = await supabase.from('leads').insert({
      name:        name     || null,
      contact:     contact,
      finish_lane: style    || null,
      price_range: price    || null,
      notes:       notes    || null,
      source:      'ap-x-swatch-site',
      referrer:    req.headers['referer'] || null,
      user_agent:  req.headers['user-agent'] || null,
      ip_hint:     (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim(),
      metadata:    {}
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Lead handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
