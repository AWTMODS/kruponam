import https from 'https';

https.get('https://kruponam.vercel.app/assets/', (res) => {
  console.log('Vercel assets status:', res.statusCode);
});

https.get('https://kruponam.vercel.app', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const m = d.match(/assets\/index-[^"']+\.js/g);
    console.log('Vercel Bundle now:', m);
    console.log('Age header:', res.headers['age']);
  });
});
