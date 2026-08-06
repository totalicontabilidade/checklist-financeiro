# Checklist Financeiro — Bancos e Cartões (Totali Contabilidade)

Formulário que a Totali envia por link para o cliente informar **os bancos e as maquinetas de cartões**
da empresa. Sem login, sem cadastro: o cliente abre o link, preenche em 3 passos e as respostas caem
numa **planilha do Google**.

| Arquivo | O que é |
|---|---|
| `index.html` | O formulário inteiro — HTML, CSS e JS num arquivo só. É o que vai pro GitHub Pages. |
| `codigo-planilha.gs` | Código do Google Apps Script que recebe os envios e grava na planilha. |
| `logo-totali-escuro.png` | A logo oficial para fundo escuro — é a que vai no cabeçalho. |
| `logo-totali-claro.png` | A logo oficial para fundo claro. |
| `servir.bat` | Sobe um servidor local para testar. |

## O que o formulário pergunta

1. **Empresa** — nome e CNPJ.
2. **Bancos** — primeiro diz se tem conta em banco; se sim, toca em quantos bancos quiser na lista,
   mais um campo livre para bancos fora dela.
3. **Maquinetas de cartões** — se usa maquineta; quais; e o **login e a senha** de cada uma, para baixar
   os relatórios de venda. Fecha com um campo livre de observações.

## Abas criadas na planilha

| Aba | Conteúdo |
|---|---|
| **Respostas** | Uma linha por empresa, com tudo resumido |
| **Bancos** | Uma linha por banco, para filtrar e ordenar |
| **Acessos das maquinetas** | Uma linha por maquineta que veio com login/senha |
| **Erros** | Só aparece se algum envio falhar, com o conteúdo bruto para não perder nada |

---

## Passo 1 — Criar a planilha e publicar o Apps Script

1. Crie uma planilha no Google Drive (ex.: *Checklist Financeiro — Clientes*).
2. Nela: **Extensões → Apps Script**.
3. Apague o código de exemplo e cole tudo de `codigo-planilha.gs`. Salve.
4. Opcional: preencha `const AVISAR_EMAIL = '';` com seu e-mail para receber aviso a cada envio.
5. **Implantar → Nova implantação**; na engrenagem ⚙ escolha **App da Web**:
   - *Executar como:* **Eu**
   - *Quem pode acessar:* **Qualquer pessoa**
6. Autorize. Vai aparecer "app não verificado" — é o seu próprio script: **Avançado → Acessar o projeto**.
7. Copie a **URL do app da Web** (termina em `/exec`).

> Confira colando essa URL no navegador. Deve aparecer
> `{"ok":true,"servico":"Checklist Financeiro — Totali"}`.

## Passo 2 — Colar a URL no formulário

No começo do `<script>` do `index.html`:

```javascript
const URL_PLANILHA = "https://script.google.com/macros/s/AKfy.../exec";
const WHATSAPP = "5579999998888";   // 55 + DDD + número, só dígitos
```

## Passo 3 — Publicar no GitHub Pages

1. Repositório **público** (ex.: `checklist-financeiro`), com o `index.html` na raiz.
2. **Settings → Pages → Deploy from a branch → main / (root) → Save.**
3. Em 1–2 minutos: `https://SEU-USUARIO.github.io/checklist-financeiro/`

## Testar antes de publicar

Duplo clique em `servir.bat` (ou abra o `index.html` direto — ele é autocontido). Com
`URL_PLANILHA = ""` o envio **baixa um `.json`** em vez de gravar na planilha.

---

## Segurança — leia antes de usar

O formulário coleta **login e senha das maquinetas**. Isso é o ponto mais sensível do sistema.

**O que já está feito no código:**

- A senha é digitada em campo mascarado, com botão "Mostrar".
- A senha **não** entra no rascunho salvo no aparelho do cliente (o login entra; a senha nunca).
- As credenciais vão para uma aba separada, **Acessos das maquinetas**.
- O formulário orienta o cliente a criar um **usuário só de consulta** na maquineta (Stone e Cielo
  permitem) em vez de entregar a senha principal.
- O formulário deixa claro que a Totali **nunca** pede senha de banco.
- Login e senha são **opcionais** — quem não souber na hora deixa em branco e combina depois, em vez
  de abandonar o formulário.

**O que depende de você:**

- **Proteja a aba de acessos**: na planilha, *Dados → Proteger planilhas e intervalos*, e limite quem
  do escritório enxerga.
- **Nunca** deixe a planilha como "qualquer pessoa com o link pode ver".
- Ative a **verificação em duas etapas** na conta Google que é dona da planilha. Se essa conta cair,
  caem junto os acessos financeiros de todos os clientes.
- Mande o link só por HTTPS (o do GitHub Pages já é). Não use `http://` fora da sua máquina.
- Quando encerrar o contrato com um cliente, apague a linha dele da aba de acessos.

Vale registrar: senha de acesso financeiro é dado sensível para a LGPD, e a responsabilidade pela
guarda passa a ser do escritório. Se um dia isso pesar, a alternativa é pedir só o **login** pelo
formulário e combinar a senha por outro canal.

## Outros pontos de atenção

- O link é público: qualquer um com a URL pode enviar. Como só grava na sua planilha, o risco é
  receber envio de brincadeira — dá para identificar pelo protocolo e apagar a linha.
- Se alterar o `codigo-planilha.gs`, faça **Implantar → Gerenciar implantações → editar → Nova
  versão**. Sem isso o link continua rodando o código antigo.
- Mudanças no `index.html` só precisam de um novo commit; o Pages atualiza sozinho.

## Ajustes comuns

Tudo no começo do `<script>` do `index.html`:

- **Incluir ou tirar banco**: lista `BANCOS` (mantenha em ordem alfabética).
- **Incluir ou tirar maquineta**: lista `MAQUINAS`.
- **Novo campo por maquineta**: edite `MOLDE_MAQUINA`, usando
  `data-c="nomeDoCampo"` no input — a coleta e o rascunho pegam sozinhos. Depois inclua a coluna
  correspondente no `codigo-planilha.gs`.
