import https from 'https';

https.get('https://awtmods.github.io/kruponam/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const m = d.match(/assets\/index-[^"']+\.js/g);
    console.log('GH Pages Bundle:', m);
    console.log('Status code:', res.statusCode);
  });
});
