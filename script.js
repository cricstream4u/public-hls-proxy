const express = require('express');
const fetch = require('node-fetch');
const urlLib = require('url');
const app = express();

const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url parameter');

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    res.set('Content-Type', contentType);
    res.header('Access-Control-Allow-Origin', '*');

    if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('vnd.apple.mpegurl')) {
      let body = await response.text();

      body = body.replace(/^(?!#)(.+)$/gm, (match) => {
        if (match.startsWith('http')) {
          return `/proxy?url=${encodeURIComponent(match)}`;
        }
        const baseUrl = urlLib.parse(url);
        const resolvedUrl = new URL(match, baseUrl.protocol + '//' + baseUrl.host + baseUrl.pathname).href;
        return `/proxy?url=${encodeURIComponent(resolvedUrl)}`;
      });

      res.send(body);
    } else {
      response.body.pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Proxy fetch error');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
