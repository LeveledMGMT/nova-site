// POST — create a new pay page
export async function onRequestPost(context) {
  const TEAM_PASS = context.env.TEAM_PASSPHRASE || 'nova-team-2026';

  try {
    const data = await context.request.json();

    // verify team passphrase
    if (data.passphrase !== TEAM_PASS) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // generate random slug
    const slug = crypto.randomUUID().slice(0, 8);

    const payData = {
      slug: slug,
      guestName: data.guestName,
      property: data.property,
      checkin: data.checkin,
      checkinTime: data.checkinTime,
      total: data.total,
      stripeUrl: data.stripeUrl,
      orderId: data.orderId,
      allergies: data.allergies || 'None',
      subRule: data.subRule || 'N/A',
      notes: data.notes || '',
      items: data.items || [],
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    await context.env.NOVA_PAY.put(slug, JSON.stringify(payData), {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });

    return new Response(JSON.stringify({
      ok: true,
      slug: slug,
      url: 'https://novaconcierge.co/pay/' + slug
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// GET — serve a pay page
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const raw = await context.env.NOVA_PAY.get(slug);
  if (!raw) {
    return new Response(notFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  const data = JSON.parse(raw);
  return new Response(buildPayPage(data), {
    headers: { 'Content-Type': 'text/html' }
  });
}

function buildPayPage(d) {
  const itemRows = d.items.map(function(i) {
    return '<div class="item">'
      + '<div class="item-top">'
      + '<span class="item-qty">' + esc(String(i.qty)) + 'x</span>'
      + '<span class="item-name">' + esc(i.item) + '</span>'
      + '</div>'
      + '<div class="item-details">'
      + '<span>Brand: ' + esc(i.brand || 'Any') + '</span>'
      + '<span>Size: ' + esc(i.size || '-') + '</span>'
      + '<span>If unavailable: ' + esc(i.sub || 'N/A') + '</span>'
      + (i.note ? '<span>Notes: ' + esc(i.note) + '</span>' : '')
      + '</div>'
      + '</div>';
  }).join('');

  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    + '<title>Nova - Your Order</title>'
    + '<link rel="icon" href="/favicon.svg" type="image/svg+xml">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..600&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>'
    + ':root{--gold:#e9c98a;--gold-hi:#fff3d6;--gold-deep:#b78a3f;--cream:#efeaf2;--cream-dim:#c2bcd4;--cream-faint:#857f96;--bg:#060611;--card-line:rgba(243,236,221,.10);--display:"Fraunces",Georgia,serif;--ui:"Hanken Grotesk",-apple-system,sans-serif;--ease:cubic-bezier(.22,.61,.36,1)}'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:var(--ui);color:var(--cream);background:var(--bg);-webkit-font-smoothing:antialiased;min-height:100vh;line-height:1.6}'
    + '#atmos{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(125% 95% at 50% 4%,#1c1f42 0%,#0c0d22 52%,#060611 100%)}'
    + '#atmos::after{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 4%,rgba(233,201,138,.13) 0%,transparent 70%)}'
    + '#grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")}'
    + '.wrap{position:relative;z-index:3;max-width:600px;margin:0 auto;padding:60px 28px 80px}'
    + '.logo{font-family:var(--display);font-weight:600;letter-spacing:.42em;text-transform:uppercase;color:var(--cream);font-size:14px;margin-bottom:48px;text-decoration:none;display:block}.logo span{color:var(--gold)}'
    + '.greeting{font-family:var(--display);font-weight:300;font-size:clamp(28px,5vw,40px);line-height:1.1;margin-bottom:8px}.greeting em{font-style:italic;color:var(--gold-hi)}'
    + '.sub{color:var(--cream-dim);font-size:16px;font-weight:300;margin-bottom:36px}'
    + '.info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:36px}'
    + '.info-box{padding:14px;background:rgba(255,255,255,.03);border:1px solid var(--card-line);border-radius:10px}'
    + '.info-box .label{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--cream-faint);margin-bottom:4px}'
    + '.info-box .val{color:var(--cream);font-size:15px}'
    + '.section-title{font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--cream-faint);margin:32px 0 16px}'
    + '.item{border:1px solid rgba(233,201,138,.25);border-radius:12px;padding:16px;margin-bottom:10px;background:rgba(233,201,138,.03)}'
    + '.item-top{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}'
    + '.item-qty{font-size:17px;font-weight:700;color:var(--gold)}'
    + '.item-name{font-size:16px;font-weight:500;color:var(--gold-hi)}'
    + '.item-details{display:flex;flex-direction:column;gap:3px}'
    + '.item-details span{font-size:13px;color:var(--cream-dim)}'
    + '.total-bar{display:flex;justify-content:space-between;align-items:center;margin:36px 0;padding:24px;border:1px solid var(--gold);border-radius:14px;background:rgba(233,201,138,.06)}'
    + '.total-label{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--cream-faint)}'
    + '.total-amount{font-family:var(--display);font-size:36px;font-weight:300;color:var(--gold-hi)}'
    + '.pay-btn{display:block;width:100%;padding:20px;border:none;border-radius:100px;background:linear-gradient(180deg,var(--gold-hi),var(--gold));color:#2a1c06;font-family:var(--ui);font-weight:600;font-size:17px;cursor:pointer;text-align:center;text-decoration:none;transition:transform .35s var(--ease),box-shadow .35s;box-shadow:0 16px 44px -12px rgba(233,201,138,.5)}'
    + '.pay-btn:hover{transform:translateY(-3px);box-shadow:0 24px 60px -12px rgba(233,201,138,.7)}'
    + '.fine{font-size:12px;color:var(--cream-faint);margin-top:20px;text-align:center;line-height:1.6}'
    + '.fine a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}'
    + '@media(max-width:500px){.wrap{padding:40px 20px 60px}.info{grid-template-columns:1fr}.total-amount{font-size:28px}}'
    + '</style></head><body>'
    + '<div id="atmos"></div><div id="grain"></div>'
    + '<div class="wrap">'
    + '<a href="/" class="logo">NOVA<span>.</span></a>'
    + '<div class="greeting">Hi ' + esc(d.guestName.split(' ')[0]) + ', your order is <em>ready.</em></div>'
    + '<p class="sub">Review everything below. If it looks right, tap pay to lock it in. We handle the rest.</p>'
    + '<div class="info">'
    + '<div class="info-box"><div class="label">Property</div><div class="val">' + esc(d.property || 'N/A') + '</div></div>'
    + '<div class="info-box"><div class="label">Check-in</div><div class="val">' + esc(d.checkin) + ' at ' + esc(d.checkinTime) + '</div></div>'
    + '<div class="info-box"><div class="label">Allergies</div><div class="val">' + esc(d.allergies) + '</div></div>'
    + '<div class="info-box"><div class="label">If unavailable</div><div class="val">' + esc(d.subRule) + '</div></div>'
    + '</div>'
    + '<div class="section-title">Your order (' + d.items.length + ' items)</div>'
    + itemRows
    + (d.notes ? '<div class="info-box" style="margin-top:16px"><div class="label">Notes</div><div class="val">' + esc(d.notes) + '</div></div>' : '')
    + '<div class="total-bar"><span class="total-label">All-in total</span><span class="total-amount">$' + esc(String(d.total)) + '</span></div>'
    + '<a href="' + esc(d.stripeUrl) + '" class="pay-btn">Pay & confirm your order</a>'
    + '<p class="fine">By paying, you confirm this is your complete order. Items not listed will not be included. You\'ll receive a photo of the stocked home before check-in. See our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>'
    + '</div></body></html>';
}

function notFoundPage() {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nova</title>'
    + '<style>body{margin:0;padding:80px 40px;background:#060611;color:#efeaf2;font-family:-apple-system,sans-serif;text-align:center}'
    + 'h1{font-size:32px;font-weight:300;margin-bottom:12px}a{color:#e9c98a}</style></head>'
    + '<body><h1>This page has expired or doesn\'t exist.</h1><p><a href="/">Back to Nova</a></p></body></html>';
}

function esc(s) {
  return (s || '').replace(/[&<>"]/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}
