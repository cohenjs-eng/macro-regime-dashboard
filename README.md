# Macro Regime Dashboard

A live market monitoring dashboard that tracks six macro indicators, four conviction stocks, and geopolitical risk signals. Uses Claude's web search to pull real-time data on demand.

## Architecture

```
Browser (React)  →  /api/market-data (Vercel serverless)  →  Anthropic API (web search)
                         ↑
                   API key stays here
                   (never reaches browser)
```

The API key is stored as a server-side environment variable. The browser only talks to your own `/api/market-data` endpoint.

## Deploy to Vercel (5 minutes)

### Prerequisites
- A GitHub account
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Steps

**1. Push to GitHub**

```bash
cd macro-regime-app
git init
git add .
git commit -m "Initial commit"
gh repo create macro-regime-dashboard --private --push
```

Or create a repo manually on GitHub and push to it.

**2. Deploy on Vercel**

- Go to [vercel.com](https://vercel.com) and sign in with GitHub
- Click "New Project"
- Import your `macro-regime-dashboard` repo
- In the "Environment Variables" section, add:
  - Name: `ANTHROPIC_API_KEY`
  - Value: your `sk-ant-...` key
- Click "Deploy"

That's it. Vercel gives you a URL like `https://macro-regime-dashboard.vercel.app`.

**3. (Optional) Custom domain**

In Vercel dashboard → Settings → Domains → Add your domain.

## Run Locally

```bash
cd macro-regime-app
npm install

# Create your local env file
cp .env.example .env.local
# Edit .env.local and paste your Anthropic API key

npm run dev
# Opens at http://localhost:3000
```

## Project Structure

```
macro-regime-app/
├── pages/
│   ├── api/
│   │   └── market-data.js    ← Serverless API route (calls Anthropic)
│   └── index.js               ← Dashboard UI
├── package.json
├── next.config.js
├── .env.example               ← Template for API key
├── .gitignore
└── README.md
```

## How It Works

1. You click **⟳ Refresh** in the dashboard
2. Browser sends `POST /api/market-data` to your Vercel serverless function
3. Serverless function calls Anthropic API with web search enabled
4. Claude searches the web for current prices of Brent, VIX, Gold, DXY, S&P 500, 10Y yield, GOOGL, NVDA, COST, PLTR
5. Response is parsed into JSON and returned to the browser
6. Dashboard auto-classifies the macro regime (Risk-Off / Transitional / Risk-On) based on VIX + Oil thresholds
7. Any deployment triggers that fire (VIX >35, S&P <6200, GOOGL <$280, etc.) flash as alerts

## Cost

Each refresh = ~1 Anthropic API call with web search. At current Sonnet pricing this is roughly $0.02-0.05 per refresh. Even refreshing 20x/day = ~$1/month.

Vercel free tier: 100GB bandwidth, unlimited serverless invocations for hobby use.

## Customisation

**Add/change stocks**: Edit the `PORTFOLIO` object and `stocks` array in `pages/index.js`, and update the prompt in `pages/api/market-data.js` to include the new tickers.

**Change thresholds**: Edit `getRegime()` and `getFired()` functions in `pages/index.js`.

**Add auto-refresh**: Add a `setInterval` in the `useEffect` hook:
```js
useEffect(() => {
  refresh();
  const interval = setInterval(refresh, 5 * 60 * 1000); // every 5 minutes
  return () => clearInterval(interval);
}, [refresh]);
```

**Add push notifications**: Use a service like Pushover or Ntfy. Add a check in the API route:
```js
if (parsed.vix?.value > 35) {
  await fetch('https://ntfy.sh/your-topic', {
    method: 'POST',
    body: `🚨 VIX >35 at ${parsed.vix.value} — Deploy dry powder`
  });
}
```

## Security Notes

- Never commit `.env.local` (it's in `.gitignore`)
- The Anthropic API key only exists server-side in the Vercel environment
- The dashboard is publicly accessible by default — add Vercel password protection or basic auth if needed
- Consider adding rate limiting to `/api/market-data` if you share the URL
