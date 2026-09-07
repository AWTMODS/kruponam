import https from 'https';
import fs from 'fs';

https.get('https://kruponam.vercel.app/assets/index-BIP_pZYy.js', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    fs.writeFileSync('vercel_bundle.js', d);
    console.log('Saved vercel_bundle.js, length:', d.length);

    // Let's check for specific strings
    const checkString = (str) => {
      const idx = d.indexOf(str);
      console.log(`Contains "${str}":`, idx !== -1);
      if (idx !== -1) {
        console.log(`Snippet around "${str}":`, d.substring(Math.max(0, idx - 100), Math.min(d.length, idx + 200)));
      }
    };

    checkString('runFirestoreRestQuery');
    checkString('phone SDK "in" query notice');
    checkString('Phone SDK');
    checkString('setSupabaseDisabled');
    checkString('isSupabaseDisabled');
    checkString('Pending_ID_Approval');
    checkString('ID_Approved');
  });
});
