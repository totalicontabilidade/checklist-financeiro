// Credenciais do projeto Firebase.
//
// Onde achar: console.firebase.google.com > Configurações do projeto (engrenagem)
// > Seus apps > Web > "Configuração do SDK" > Config. Copie o objeto e cole aqui.
//
// Estas chaves são PÚBLICAS por natureza — ficam visíveis no código da página.
// Quem protege os dados são as regras do Firestore e do Storage, não elas.

export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

// Enquanto não estiver preenchido, o formulário roda em modo de teste:
// baixa o .json e o PDF no aparelho, sem gravar nada na nuvem.
export const CONFIGURADO = firebaseConfig.apiKey !== "COLE_AQUI";
