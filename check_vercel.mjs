import https from 'https';

https.get('https://kruponam.vercel.app', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const m = d.match(/assets\/index-[^"']+\.js/g);
    console.log('Bundle:', m);
    console.log('Age header:', res.headers['age']);
    console.log('Date header:', res.headers['date']);
  });
});
