const requiredVariables = [
  "CHROME_EXTENSION_ID",
  "CHROME_PUBLISHER_ID",
  "CHROME_CLIENT_ID",
  "CHROME_CLIENT_SECRET",
  "CHROME_REFRESH_TOKEN",
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]);
if (missingVariables.length) {
  throw new Error(`Secrets Chrome Web Store manquants : ${missingVariables.join(", ")}`);
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.CHROME_CLIENT_ID,
    client_secret: process.env.CHROME_CLIENT_SECRET,
    refresh_token: process.env.CHROME_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});

if (!tokenResponse.ok) {
  throw new Error(`Échec de l'échange OAuth : HTTP ${tokenResponse.status}`);
}

const { access_token: accessToken } = await tokenResponse.json();
const itemResponse = await fetch(
  `https://chromewebstore.googleapis.com/v2/publishers/${process.env.CHROME_PUBLISHER_ID}/items/${process.env.CHROME_EXTENSION_ID}:fetchStatus`,
  { headers: { Authorization: `Bearer ${accessToken}` } },
);

if (!itemResponse.ok) {
  throw new Error(`Échec de la vérification de la fiche Chrome : HTTP ${itemResponse.status}`);
}

console.log("Identifiants UberEatHabits validés, sans téléversement ni publication.");
