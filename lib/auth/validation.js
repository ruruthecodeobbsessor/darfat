export function validateCredentials(formData, registering = false) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const errors = {};
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "تکایە ئیمەیڵێکی دروست بنووسە.";
  }
  if (!password) errors.password = "تکایە وشەی نهێنی بنووسە.";
  else if (registering && password.length < 8) errors.password = "وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت.";
  else if (password.length > 128) errors.password = "وشەی نهێنی دەبێت زیاتر لە ١٢٨ پیت نەبێت.";
  if (registering) {
    if (!name || name.length > 100) errors.name = "تکایە ناوی تەواوت بنووسە (تا ١٠٠ پیت).";
    if (password !== String(formData.get("confirmPassword") ?? "")) {
      errors.confirmPassword = "دوو وشە نهێنییەکە یەک ناگرنەوە.";
    }
  }
  return { email, password, name, errors };
}

export function authErrorMessage(error) {
  switch (error?.code) {
    case "invalid_credentials": return "ئیمەیڵ یان وشەی نهێنی هەڵەیە.";
    case "email_not_confirmed": return "تکایە سەرەتا ئیمەیڵەکەت پشتڕاست بکەرەوە.";
    case "user_already_exists": case "email_exists": return "ئەم ئیمەیڵە پێشتر تۆمارکراوە. تکایە بچۆ ژوورەوە.";
    case "weak_password": return "وشەی نهێنی بەهێزتر هەڵبژێرە؛ لانیکەم ٨ پیت بەکاربهێنە.";
    case "signup_disabled": return "تۆمارکردن لە ئێستادا بەردەست نییە. تکایە دواتر هەوڵ بدەرەوە.";
    case "over_email_send_rate_limit": case "over_request_rate_limit": return "هەوڵەکان زۆر بوون. تکایە کەمێک چاوەڕێبە و دووبارە هەوڵ بدەرەوە.";
    default: return "نەتوانرا داواکارییەکەت تەواو بکرێت. تکایە پەیوەندی ئینتەرنێت بپشکنە و دووبارە هەوڵ بدەرەوە.";
  }
}
