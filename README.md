# Checklist Financeiro — Totali Soluções Contábeis

Formulário que a Totali envia por link para o cliente informar **os bancos e as maquinetas de
cartões** da empresa. Sem cadastro: o cliente abre o link, preenche em 3 passos, e as respostas
vão para o **Firestore**. Quem opta por enviar os documentos recebe um **termo de compromisso em
PDF**, guardado no **Firebase Storage**. A equipe consulta tudo num **painel interno com login**.

| Arquivo | O que é |
|---|---|
| `index.html` | O formulário do cliente. É o que vai pro GitHub Pages. |
| `painel.html` | Painel interno da Totali, com login. |
| `js/firebase-config.js` | Credenciais do projeto Firebase (**preencher**). |
| `firestore.rules` | Regras do banco — colar no console. |
| `storage.rules` | Regras dos arquivos — colar no console. |
| `logo-totali-escuro.png` / `logo-totali-claro.png` | A logo oficial. |
| `favicon-totali.png` | Ícone da aba. |
| `servir.bat` | Sobe um servidor local para testar. |

## Arquitetura

```
 cliente  →  index.html (GitHub Pages)  →  Firestore   (respostas)
                                        →  Storage     (termo em PDF)
 equipe   →  painel.html                →  Auth        (login por pessoa)
```

O site continua no **GitHub Pages** — publica sozinho a cada push, sem CLI e sem instalar nada.
O Firebase entra só como banco, arquivos e login, tudo pelo SDK do navegador.

## O que o formulário pergunta

1. **Empresa** — nome e CNPJ.
2. **Bancos** — se tem conta; se sim, quais (16 opções) e um campo livre.
3. **Maquinetas de cartões** — se usa; quais; e como a Totali receberá os relatórios todo mês:
   *informar os dados de acesso* ou *o cliente envia*. Na segunda opção nasce o termo em PDF.

## Estrutura no Firestore

```
checklists/{id}
  protocolo, status, criadoEm, enviadoEm
  empresa:      { nome, cnpj }
  temBanco, bancos[], bancoOutro
  temMaquineta, maquinetas[], maquinetaOutra
  formaDocumentos, observacoes
  termo:        { caminho, geradoEm }        ← null quando não há termo

  checklists/{id}/acessos/{maquineta}        ← subcoleção, só admin lê
      maquineta, login, senha

usuarios/{uid}                               ← quem pode entrar no painel
  nome, email, papel: 'admin' | 'equipe'
```

**Por que os acessos ficam numa subcoleção:** login e senha das maquinetas são o dado mais
sensível do sistema. Separá-los permite que a equipe veja os checklists sem enxergar credencial
nenhuma — só quem tem `papel: 'admin'` consegue ler.

No Storage os termos ficam em `termos/{ano}/{protocolo}.pdf`.

---

## Instalação

### 1. Criar o projeto no Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto**.
2. **Criar banco de dados** em Firestore (modo de produção, região `southamerica-east1`).
3. **Criar bucket** no Storage.
4. Em **Authentication → Sign-in method**, ative:
   - **E-mail/senha** — para a equipe entrar no painel
   - **Anônimo** — usado no envio do formulário; sem isso as regras barram o cliente
5. **Configurações do projeto → Seus apps → Web** → copie o objeto `firebaseConfig`.

### 2. Preencher as credenciais

Cole o objeto em `js/firebase-config.js`. Essas chaves são públicas por natureza — quem protege
os dados são as regras, não elas.

### 3. Publicar as regras

- Firestore → **Regras** → cole `firestore.rules` → Publicar
- Storage → **Regras** → cole `storage.rules` → Publicar

### 4. Cadastrar quem entra no painel

Para cada pessoa, dois passos — os dois são necessários:

1. **Authentication → Users → Adicionar usuário**: e-mail e senha. Anote o **UID** gerado.
2. **Firestore → coleção `usuarios`** → novo documento com **o UID como ID do documento**:
   ```
   nome:  "Rodrigo"
   email: "rodrigo@totalicontabilidade.com.br"
   papel: "admin"      // ou "equipe"
   ```

Só ter conta no Firebase **não dá acesso**: sem o documento em `usuarios`, o painel recusa a
entrada. É assim que se revoga alguém — apaga o documento e o acesso morre na hora.

`admin` vê as senhas das maquinetas; `equipe` vê todo o resto.

### 5. Publicar o site

Já é automático: cada push no `main` republica o GitHub Pages em um ou dois minutos.

- Formulário do cliente: `https://totalicontabilidade.github.io/checklist-financeiro/`
- Painel interno: `https://totalicontabilidade.github.io/checklist-financeiro/painel.html`

## Testar antes de configurar

Duplo clique em `servir.bat`. Sem as credenciais, o formulário roda em **modo de teste**: baixa um
`.json` e o PDF no próprio aparelho, sem gravar nada na nuvem.

---

## Segurança

**O que as regras garantem:**

- O cliente é autenticado anonimamente só para enviar. Ele **cria** e nunca lê nem altera nada.
- Ler qualquer checklist exige estar cadastrado em `usuarios`.
- A equipe só altera `status` e `anotacaoInterna` — o que o cliente respondeu é imutável.
- As credenciais das maquinetas só são lidas por `admin`.
- Um termo já gravado no Storage não pode ser substituído nem apagado.
- Os PDFs não têm link público: o painel gera uma URL temporária a cada download.

**O que continua com você:**

- Verificação em duas etapas na conta Google dona do projeto.
- Cadastrar só quem precisa, e apagar o documento em `usuarios` quando alguém sair.
- O papel `admin` só para quem realmente precisa ver senha de cliente.

**Limitação conhecida:** o PDF é gerado no navegador do cliente. O registro que vale é o do
Firestore — o termo é uma representação dele. Se um dia isso incomodar, a saída é gerar o PDF numa
Cloud Function, o que exige o Firebase CLI (e, portanto, Node.js instalado).

## Ajustes comuns

No começo do `<script>` do `index.html`:

- **Incluir ou tirar banco**: lista `BANCOS` (manter em ordem alfabética).
- **Incluir ou tirar maquineta**: lista `MAQUINAS`.
- **Texto do termo**: função `gerarTermoPDF()`.
- **Novo campo por maquineta**: `MOLDE_MAQUINA`, usando `data-c="nome"` no input.
