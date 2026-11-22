exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "مفتاح الذكاء الاصطناعي غير مضاف في Netlify." }) };
  try {
    const body = JSON.parse(event.body || "{}");
    const qText = (body.question || "").toString().slice(0, 800);
    const uPrompt = (body.prompt || "اشرح لي هذا السؤال والقاعدة ببساطة.").toString().slice(0, 800);
    const ctx = (body.context || "").toString().slice(0, 1200);
    const sys = "أنت «المعلم الذكي» المساعد للأستاذ العزي الشريف في منصة الشريف للوزاري (منهج الصف الثالث الثانوي اليمني — Crescent Book 6). تحدّث بأسلوب معلم يمني دافئ وواضح ومباشر، واشرح القاعدة باختصار وإتقان بالعربية مع أمثلة إنجليزية واضحة.";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: "user", parts: [{ text: `السؤال:\n${qText}\n${ctx ? "\nمعلومات:\n" + ctx + "\n" : ""}\nطلب الطالب:\n${uPrompt}` }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 600 }
      })
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, headers, body: JSON.stringify({ error: data?.error?.message || "تعذر الاتصال بـ Gemini" }) };
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من توليد رد الآن.";
    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "حدث خطأ في الخادم." }) };
  }
};
      
