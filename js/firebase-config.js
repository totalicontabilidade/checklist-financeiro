// Credenciais do projeto Firebase — Checklist Financeiro (Totali).
//
// Estas chaves são PÚBLICAS por natureza: ficam visíveis no código da página
// em qualquer site que use Firebase. Quem protege os dados são as regras do
// Firestore e do Storage, não elas.
//
// Onde conferir: console.firebase.google.com > Configurações do projeto >
// Seus apps > Web > Configuração do SDK.

export const firebaseConfig = {
  apiKey: "AIzaSyABlCpIYgZ7lx3Hv2OflZyqP8Ng5Cs5NyA",
  authDomain: "checklist-financeiro-82cc7.firebaseapp.com",
  projectId: "checklist-financeiro-82cc7",
  storageBucket: "checklist-financeiro-82cc7.firebasestorage.app",
  messagingSenderId: "982040754792",
  appId: "1:982040754792:web:ffbac10ab20ee3acc0d9dd"
};

// Continua servindo de trava: se um dia a configuração for esvaziada,
// o formulário volta ao modo de teste em vez de falhar silenciosamente.
export const CONFIGURADO = firebaseConfig.apiKey !== "COLE_AQUI";
