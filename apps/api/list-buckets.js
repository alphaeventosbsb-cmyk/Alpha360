const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.storage().getBuckets()
  .then(([buckets]) => {
    console.log('Buckets encontrados:');
    buckets.forEach(bucket => {
      console.log('->', bucket.name);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro ao listar buckets:', err);
    process.exit(1);
  });
