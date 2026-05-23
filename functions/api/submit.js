export async function onRequestPost(context) {
  const DISCORD_WEBHOOK = context.env.DISCORD_WEBHOOK;

  try {
    const data = await context.request.json();
    const { type } = data;

    // PST timestamp
    const now = new Date();
    const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const timestamp = pst.toLocaleString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true
    });
    data._timestamp = timestamp;
    data._timestampISO = now.toISOString();

    let discordPayload;
    let receiptHTML = "";

    if (type === "order") {
      const items = (data.items || []).map(i =>
        `> **${i.qty}\u00d7 ${i.item}**${i.brand ? ` \u2014 ${i.brand}` : ''}${i.size ? ` (${i.size})` : ''}${i.sub && i.sub !== 'default' ? ` [${i.sub}]` : ''}${i.note ? ` _${i.note}_` : ''}`
      ).join('\n');

      discordPayload = {
        embeds: [{
          title: "\ud83d\uded2 New Order Submitted",
          color: 0xe9c98a,
          fields: [
            { name: "Submitted", value: timestamp, inline: false },
            { name: "Name", value: data.name || "\u2014", inline: true },
            { name: "Phone", value: data.phone || "\u2014", inline: true },
            { name: "Check-in", value: `${data.dates || "\u2014"} at ${data.checkinTime || "\u2014"}`, inline: true },
            { name: "Delivery Address", value: data.prop || "\u2014", inline: true },
            { name: "Partner Code", value: data.code || "None", inline: true },
            { name: "Allergies", value: data.allergies || (data.allergyNone ? "None noted" : "\u2014"), inline: true },
            { name: "Default Sub Rule", value: data.sub || "\u2014", inline: true },
            { name: "Item Count", value: String((data.items || []).length), inline: true },
            { name: "Confirmed", value: data.confirm ? "\u2705 Yes" : "\u274c No", inline: true },
            { name: "Items", value: items || "No items" },
            { name: "Notes", value: data.extra || "None" },
          ],
          timestamp: now.toISOString(),
          footer: { text: "Nova Concierge \u2014 novaconcierge.co" }
        }],
        content: "**[View in Google Sheets](https://docs.google.com/spreadsheets/d/1fg5uHZsoTYzzEPHGBtPqxgltUE21EU6es8jb-TIzpdQ/edit?gid=0#gid=0)**"
      };

      // Build HTML receipt
      const itemRows = (data.items || []).map(i => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #1a1d3a;color:#e9c98a;font-weight:600;width:40px;text-align:center">${i.qty}\u00d7</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1a1d3a">
            <div style="color:#fff3d6;font-size:15px">${esc(i.item)}</div>
            <div style="color:#857f96;font-size:12px;margin-top:2px">${[i.brand,i.size,i.sub!=='default'?i.sub:'',i.note].filter(Boolean).join(' \u00b7 ')}</div>
          </td>
        </tr>`).join('');

      receiptHTML = `<!doctype html><html><head><meta charset="utf-8"><title>Nova Order \u2014 ${esc(data.name)}</title>
        <style>body{margin:0;padding:40px;background:#060611;color:#efeaf2;font-family:-apple-system,sans-serif;line-height:1.6}
        .wrap{max-width:640px;margin:0 auto}.logo{font-size:18px;font-weight:600;letter-spacing:.4em;text-transform:uppercase;color:#efeaf2;margin-bottom:32px}
        .logo span{color:#e9c98a}h1{font-size:24px;font-weight:300;margin-bottom:4px}h1 em{font-style:italic;color:#fff3d6}
        .ts{font-size:12px;color:#857f96;margin-bottom:32px;letter-spacing:.08em}.info{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px}
        .info div{padding:14px;background:rgba(255,255,255,.03);border:1px solid rgba(243,236,221,.08);border-radius:10px}
        .info .label{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#857f96;margin-bottom:4px}
        .info .val{color:#efeaf2;font-size:15px}table{width:100%;border-collapse:collapse;margin-bottom:32px}
        .foot{font-size:12px;color:#857f96;border-top:1px solid #1a1d3a;padding-top:20px;margin-top:20px}</style></head>
        <body><div class="wrap">
        <div class="logo">NOVA<span>.</span></div>
        <h1>Order <em>receipt</em></h1>
        <div class="ts">${esc(timestamp)} PST</div>
        <div class="info">
          <div><div class="label">Name</div><div class="val">${esc(data.name)}</div></div>
          <div><div class="label">Phone</div><div class="val">${esc(data.phone)}</div></div>
          <div><div class="label">Address</div><div class="val">${esc(data.prop || 'N/A')}</div></div>
          <div><div class="label">Partner Code</div><div class="val">${esc(data.code || 'None')}</div></div>
          <div><div class="label">Check-in</div><div class="val">${esc(data.dates)} at ${esc(data.checkinTime)}</div></div>
          <div><div class="label">Allergies</div><div class="val">${esc(data.allergies || (data.allergyNone ? 'None' : 'N/A'))}</div></div>
          <div><div class="label">Sub Rule</div><div class="val">${esc(data.sub || 'N/A')}</div></div>
          <div><div class="label">Notes</div><div class="val">${esc(data.extra || 'None')}</div></div>
        </div>
        <table>${itemRows}</table>
        <div class="foot">Nova Concierge \u00b7 novaconcierge.co \u00b7 This is a record of your submission, not a confirmed order. You'll receive a quote within 24 hours.</div>
        </div></body></html>`;

    } else if (type === "contact") {
      discordPayload = {
        embeds: [{
          title: "\ud83d\udcec New Contact Form",
          color: 0xb78a3f,
          fields: [
            { name: "Submitted", value: timestamp, inline: false },
            { name: "Name", value: data.name || "\u2014", inline: true },
            { name: "Email", value: data.email || "\u2014", inline: true },
            { name: "Phone", value: data.phone || "\u2014", inline: true },
            { name: "Type", value: data.contactType || "\u2014", inline: true },
            { name: "Message", value: data.message || "\u2014" },
          ],
          timestamp: now.toISOString(),
          footer: { text: "Nova Concierge \u2014 novaconcierge.co" }
        }],
        content: "**[View in Google Sheets](https://docs.google.com/spreadsheets/d/1fg5uHZsoTYzzEPHGBtPqxgltUE21EU6es8jb-TIzpdQ/edit?gid=124089172#gid=124089172)**"
      };
    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });
    }

    // Send to Discord
    const discordRes = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload)
    });

    if (!discordRes.ok) {
      console.error("Discord error:", await discordRes.text());
    }

    // Send to Google Sheets (if configured)
    const SHEETS_URL = context.env.GOOGLE_SHEETS_URL;
    if (SHEETS_URL) {
      try {
        const sheetsData = { ...data };
        if (receiptHTML) sheetsData.receipt = receiptHTML;
        await fetch(SHEETS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sheetsData)
        });
      } catch (e) {
        console.error("Sheets error:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, receipt: receiptHTML, timestamp }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

function esc(s) {
  return (s + "").replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
