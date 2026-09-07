import https from 'https';

https.get('https://kruponam.vercel.app/assets/index-BIP_pZYy.js', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Has runQuery string?', d.includes('documents:runQuery'));
    console.log('Has phone in query?', d.includes('Phone SDK'));
    console.log('Has isSupabaseDisabled?', d.includes('isSupabaseDisabled'));
    console.log('Has 6000 timeout?', d.includes('6000'));
    console.log('Has 8000 timeout?', d.includes('8000'));
  });
});
