export async function onRequestGet(context) {
  const slug = context.params.slug;

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
  var itemRows = d.items.map(function(i) {
    return '<div class="item" onclick="this.classList.toggle(\'open\')">'
      + '<div class="item-top">'
      + '<span class="item-qty">' + esc(String(i.qty)) + 'x</span>'
      + '<span class="item-name">' + esc(i.item) + '</span>'
      + '<span class="item-chevron">+</span>'
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
    + '.order-toggle{display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:16px 0;border:none;background:none;width:100%;color:inherit;font:inherit}'
    + '.order-toggle .ot-left{font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--cream-faint)}'
    + '.order-toggle .ot-right{font-size:13px;color:var(--gold);transition:transform .3s}'
    + '.order-body{max-height:0;overflow:hidden;transition:max-height .4s ease}'
    + '.order-wrap.open .order-body{max-height:5000px}'
    + '.order-wrap.open .ot-right{transform:rotate(45deg)}'
    + '.item{border:1px solid rgba(233,201,138,.15);border-radius:12px;padding:14px 16px;margin-bottom:8px;background:rgba(233,201,138,.02);cursor:pointer;transition:.2s}'
    + '.item:hover{border-color:rgba(233,201,138,.3)}'
    + '.item-top{display:flex;align-items:center;gap:10px}'
    + '.item-qty{font-size:15px;font-weight:700;color:var(--gold)}'
    + '.item-name{font-size:15px;font-weight:500;color:var(--gold-hi);flex:1}'
    + '.item-chevron{color:var(--cream-faint);font-size:16px;transition:transform .3s;font-weight:300}'
    + '.item.open .item-chevron{transform:rotate(45deg)}'
    + '.item-details{max-height:0;overflow:hidden;transition:max-height .3s ease;margin-top:0}'
    + '.item.open .item-details{max-height:200px;margin-top:10px}'
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
    + '<div class="info-box"><div class="label">Check-in</div><div class="val">' + esc(d.checkin) + ' at ' + esc(d.checkinTime) + '</div></div>'
    + '<div class="info-box"><div class="label">If unavailable</div><div class="val">' + esc(d.subRule) + '</div></div>'
    + '</div>'
    + '<div class="order-wrap" id="orderWrap">'
    + '<button class="order-toggle" onclick="document.getElementById(\'orderWrap\').classList.toggle(\'open\')">'
    + '<span class="ot-left">Your order (' + d.items.length + ' items)</span>'
    + '<span class="ot-right">+</span>'
    + '</button>'
    + '<div class="order-body">'
    + itemRows
    + (d.notes ? '<div class="info-box" style="margin-top:12px;margin-bottom:16px"><div class="label">Notes</div><div class="val">' + esc(d.notes) + '</div></div>' : '')
    + '</div></div>'
    + '<div class="total-bar"><span class="total-label">All-in total</span><span class="total-amount">$' + esc(String(d.total)) + '</span></div>'
    + '<p style="color:var(--cream-dim);font-size:14px;text-align:center;margin-bottom:8px;font-weight:300">Includes groceries, sourcing, delivery, and service. No hidden fees.</p>'
    + '<a href="' + esc(d.stripeUrl) + '" class="pay-btn">Pay & confirm your order</a>'
    + '<div style="margin-top:32px;padding:24px;border:1px solid var(--card-line);border-radius:14px;background:rgba(255,255,255,.02)">'
    + '<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--cream-faint);margin-bottom:14px;font-weight:600">What to expect</div>'
    + '<div style="display:flex;flex-direction:column;gap:12px;font-size:14px;color:var(--cream-dim);font-weight:300">'
    + '<div style="display:flex;gap:10px;align-items:flex-start"><span style="color:var(--gold);font-size:16px;line-height:1">&#10003;</span><span>We shop, stock, and organize everything before you arrive.</span></div>'
    + '<div style="display:flex;gap:10px;align-items:flex-start"><span style="color:var(--gold);font-size:16px;line-height:1">&#10003;</span><span>You will receive a photo of the stocked fridge before check-in.</span></div>'
    + '<div style="display:flex;gap:10px;align-items:flex-start"><span style="color:var(--gold);font-size:16px;line-height:1">&#10003;</span><span>If any item is unavailable, we follow your substitution preference and refund you for anything we cannot fulfill.</span></div>'
    + '</div></div>'
    + '<p class="fine" style="margin-top:32px">By paying, you confirm this is your complete order and agree to the policies below. See our full <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>'
    + '<p class="fine" style="margin-top:16px;font-size:11px;line-height:1.7;color:rgba(133,127,150,.7)"><strong style="color:var(--cream-faint)">Refund &amp; cancellation policy:</strong> If we cannot source an item and your substitution rule is to skip it, you will be refunded for that item. Cancellation before shopping begins: full refund minus a 10% service fee to cover sourcing and coordination costs. Cancellation within 48 hours of check-in: no refund, as items will have been purchased and preparation will be underway. After delivery: all sales are final once items have been stocked in the property. Nova Concierge acts as a purchasing agent on your behalf. We are not liable for product quality, allergen cross-contamination, or any issues arising from consumption of purchased goods. By paying, you acknowledge you have reviewed your order, your allergy information is accurate, and you accept these terms. Liability is limited to the amount paid for this order.</p>'
    + '</div></body></html>';
}

function notFoundPage() {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nova</title>'
    + '<style>body{margin:0;padding:80px 40px;background:#060611;color:#efeaf2;font-family:-apple-system,sans-serif;text-align:center}'
    + 'h1{font-size:32px;font-weight:300;margin-bottom:12px}a{color:#e9c98a}</style></head>'
    + '<body><h1>This page has expired or does not exist.</h1><p><a href="/">Back to Nova</a></p></body></html>';
}

function esc(s) {
  return (s || '').replace(/[&<>"]/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}
