import https from 'https';

https.get('https://kruponam.vercel.app', (res) => {
  console.log('All headers:', res.headers);
});
