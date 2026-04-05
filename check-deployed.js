const https = require('https');
https.get('https://alpha360-79zmdpix7-alphaeventosbsb-cmyks-projects.vercel.app', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = [...data.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);
    console.log('Found scripts:', urls.length);
    urls.forEach(url => {
      https.get('https://alpha360-79zmdpix7-alphaeventosbsb-cmyks-projects.vercel.app' + url, (res2) => {
        let js = '';
        res2.on('data', c => js += c);
        res2.on('end', () => {
          if(js.includes('alpha360-d08b1')) console.log('FOUND NEW CONFIG IN', url);
          if(js.includes('gen-lang-client')) console.log('FOUND OLD CONFIG IN', url);
        });
      });
    });
  });
});
