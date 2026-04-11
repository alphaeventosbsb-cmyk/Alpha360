const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o Admin SDK do Firebase com as credenciais e o bucket correto
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'alpha360-d08b1.appspot.com'
});

const bucket = admin.storage().bucket();

// Nova regra de CORS muito mais permissive (necessário para Uploads direto via Browser / Vite PWA)
const corsConfiguration = [
  {
    origin: ['*'], 
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    responseHeader: ['*'],
    maxAgeSeconds: 3600
  }
];

console.log('Aplicando as novas regras de CORS ao bucket:', bucket.name, '...');

bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log('✅ Configuração CORS aplicada com sucesso ao Firebase Storage!');
    console.log('Por favor, recarregue a página (F5) no PWA e tente enviar os anexos novamente.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro crítico ao configurar CORS. Veja abaixo:');
    console.error(err);
    process.exit(1);
  });
