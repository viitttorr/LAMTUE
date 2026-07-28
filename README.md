# Portal LAMTUE

Portal oficial da Liga Acadêmica de Medicina de Trauma, Urgência e Emergência — URI Erechim.

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento → http://localhost:3000
npm run build && npm start   # produção
```

O banco de dados (SQLite) e os uploads ficam na pasta `data/`, criada automaticamente.
**Faça backup periódico da pasta `data/`** — ela contém tudo: ligantes, presenças, inscrições, arquivos.

## Acessos iniciais da diretoria

Criados automaticamente na primeira execução. Senha inicial: **lamtue2026**
(o sistema exige a troca no primeiro login).

| Cargo | Login |
| --- | --- |
| Presidente — Vitor Rossatto | presidente@lamtue.com |
| Vice-Presidente / Tesoureiro — Leonardo Pramio | tesouraria@lamtue.com |
| Diretora de Administração — Alessandra Biazotto | administracao@lamtue.com |
| Diretora de Ensino e Pesquisa — Ciliandra Marin | ensino@lamtue.com |
| Diretora de Comunicação e Extensão — Mylena Kaminski | comunicacao@lamtue.com |

O painel **Financeiro** aparece no menu para toda a diretoria, mas o acesso é restrito à Presidência e ao Vice-Presidente/Tesoureiro.

## Ligantes

- O cadastro é feito pela diretoria (individual, CSV em massa, ou pelo botão
  "Criar contas dos aprovados" na página do Seletivo).
- Primeiro acesso do ligante: **login e senha = matrícula**, com troca de senha obrigatória.

## Integrações (arquivo `.env`)

| Recurso | Como ativar |
| --- | --- |
| **Simulados por IA** | Preencha `ANTHROPIC_API_KEY` (console.anthropic.com). Sem a chave, os simulados usam o banco de questões interno. |
| **E-mails automáticos** | Preencha `SMTP_HOST/PORT/USER/PASS` (Gmail: use "senha de app"). Sem SMTP, os envios ficam registrados no histórico como "smtp não configurado". |
| **WhatsApp** | Não precisa de `.env`: acesse Diretoria → WhatsApp e escaneie o QR code com o número dedicado da liga. A sessão fica salva em `data/whatsapp/`. |
| **Segurança das sessões** | Troque `SESSION_SECRET` por uma chave aleatória longa antes de publicar. |

## Publicação

Qualquer servidor Node 20+ serve (VPS, Railway, Render etc.). Como o sistema usa SQLite e
arquivos locais, o servidor precisa de **disco persistente** (a Vercel não serve para este
projeto sem adaptação do banco). Passos: clonar, `npm install`, criar `.env`, `npm run build`,
`npm start` atrás de um proxy HTTPS.
