import https from 'https';

https.get('https://kruponam.vercel.app/assets/index-BIP_pZYy.js', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('File size:', d.length);
    console.log('Includes ID_Approved?', d.includes('ID_Approved'));
    console.log('Includes d6fe5f6 or recent changes?', d.includes('runFirestoreRestQuery'));
  });
});
