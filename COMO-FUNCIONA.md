# Como este sistema foi feito

Registro do que foi pedido, do que fez funcionar no celular e do que precisou ser
configurado fora do código. Serve para retomar o projeto meses depois, ou para
entregar a outra pessoa.

---

## 1. O que foi pedido, na ordem

O sistema não nasceu pronto: foi sendo ajustado. A sequência ajuda a entender por que
ele é do jeito que é.

| # | Pedido | O que mudou |
|---|---|---|
| 1 | Um checklist financeiro de bancos e cartões | Ideia inicial |
| 2 | Link para o cliente novo preencher, sem login | Deixou de ser controle interno e virou formulário público |
| 3 | Simples, fácil de entender, e **mobile first** | Formulário em 3 passos, feito para o polegar |
| 4 | Guardar em Sheets/Drive em vez de Firebase | Primeira arquitetura: Apps Script + planilha |
| 5 | Hospedar no GitHub | GitHub Pages, publicação por push |
| 6 | Ajustes nas listas de bancos e maquinetas | Nomes e ordem alfabética |
| 7 | Opção de o cliente informar acesso **ou** enviar os documentos | Alternativa a entregar senha |
| 8 | Termo de compromisso em PDF | Gerado automaticamente |
| 9 | Trocar tudo para Firebase, com painel e login | Arquitetura final |
| 10 | Painel: logo, gerenciar acessos, excluir empresas | Administração pelo próprio painel |

---

## 2. O que faz funcionar bem no celular

"Mobile first" aqui não é enfeite — são decisões concretas:

- **`<meta name="viewport">`** com `width=device-width`. Sem isso o celular renderiza
  como se fosse desktop e encolhe tudo.
- **CSS escrito primeiro para telas pequenas.** Os `@media` usam `min-width`: o padrão é
  o celular, e o desktop é a exceção. O caminho inverso costuma deixar sobras que
  quebram no telefone.
- **Campos com fonte de 16px.** Abaixo disso o iPhone dá zoom automático ao tocar num
  campo e desalinha a página inteira. É a causa nº 1 de formulário "torto" no iOS.
- **Alvos de toque de 46px ou mais** nos chips e botões — abaixo disso o dedo erra.
- **Barra de ação fixa no rodapé**, com `position: sticky`, para o botão principal ficar
  sempre ao alcance do polegar sem precisar rolar.
- **`env(safe-area-inset-bottom)`** para o botão não ficar embaixo da barra de gestos
  dos iPhones sem botão físico.
- **Layout de uma coluna**, com os pares de campos (`.dupla`) virando uma coluna só
  abaixo de 520px.
- **Testado em 320px, 375px e 1280px** com verificação de que nenhum elemento estoura a
  largura da tela. 320px é o iPhone SE, o menor aparelho ainda em uso.
- **Rascunho automático** no `localStorage`: se o cliente fechar o navegador no meio, os
  dados voltam quando ele reabrir o link. No celular isso acontece o tempo todo — chega
  uma ligação, ele troca de app, e o formulário se perderia.

A senha das maquinetas é a única exceção: ela **nunca** entra no rascunho, porque o
aparelho pode ser compartilhado.

---

## 3. O que precisou ser configurado fora do código

O código sozinho não funciona. Estes passos foram feitos à mão, uma única vez:

### No Firebase (`checklist-financeiro-82cc7`)

1. **Firestore** criado em modo de produção, edição Standard, região
   `southamerica-east1` (São Paulo — mais rápido no Brasil e os dados ficam no país).
2. **Authentication** com dois provedores ativos:
   - *E-mail/senha* — login da equipe no painel
   - *Anônimo* — identifica o cliente no envio. **Sem ele as regras recusam o formulário.**
3. **Domínio autorizado**: `totalicontabilidade.github.io` acrescentado em
   Authentication → Configurações. Sem isso, login e envio falham no site publicado.
4. **App web registrado**, gerando o `firebaseConfig` que está em `js/firebase-config.js`.
5. **Regras publicadas** (conteúdo de `firestore.rules`), coladas no console.
6. **Primeiro administrador** criado à mão, em dois passos:
   - usuário em Authentication (gera o UID)
   - documento em `usuarios/{UID}` com `nome`, `email` e `papel: "admin"`

   Os administradores seguintes são criados pelo próprio painel.

### No GitHub

7. Repositório **público** `totalicontabilidade/checklist-financeiro`.
8. **Pages** ligado em Settings → Pages → Deploy from a branch → `main` / `(root)`.

A partir daí, **cada push republica o site sozinho** em 1 ou 2 minutos. Só as regras do
Firestore continuam exigindo passo manual no console.

---

## 4. Por que o PDF fica no Firestore e não no Storage

O Cloud Storage exige o plano Blaze (pago). O termo tem cerca de 8 KB e o limite de um
documento do Firestore é 1 MB, então ele é guardado em base64 numa subcoleção `termo`.

Além de dispensar o upgrade, isso tirou um ponto de falha: quando o bucket não existia,
o SDK do Storage insistia por **2 minutos** antes de desistir, e o cliente ficava
olhando "Enviando..." sem entender.

Se um dia migrar para o Blaze, o `storage.rules` continua no projeto.

---

## 5. Coisas que não são óbvias e vão morder depois

- **Ter conta no Firebase não dá acesso ao painel.** É preciso existir um documento em
  `usuarios/{uid}`. Para revogar alguém, apague esse documento — o login continua
  existindo, mas deixa de abrir o painel.
- **Excluir um checklist exige apagar as subcoleções antes.** O Firestore não remove
  `acessos` e `termo` junto com o documento pai; ficariam órfãos e invisíveis. O painel
  já faz isso na ordem certa.
- **Criar usuário pelo painel usa um app secundário do Firebase.** Sem esse truque, o
  SDK trocaria a sessão para o usuário recém-criado e derrubaria quem está usando.
- **Não existe backup automático no plano Spark.** Uma exclusão é definitiva. Exportar o
  CSV do painel de vez em quando é a rede de proteção mais barata.
- **O plano Spark permite 50 mil leituras por dia.** O painel carrega todos os
  checklists a cada abertura; se um dia forem milhares de registros, vale paginar.
