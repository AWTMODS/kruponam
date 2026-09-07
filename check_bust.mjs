import https from 'https';

const options = {
  hostname: 'kruponam.vercel.app',
  path: `/?_t=${Date.now()}`,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

https.get(options, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const m = d.match(/assets\/index-[^"']+\.js/g);
    console.log('Bust Bundle:', m);
    console.log('Age header:', res.headers['age']);
  });
});
