# TaskApp — App de tarefas com autenticação

Projeto completo: **app mobile** (Expo / React Native) + **API REST** (Node.js / Express / SQLite).
Cada usuário cria sua conta, faz login e vê **somente as suas tarefas**, com status, prioridade e data de vencimento.

```
Aula 03-04/
├── backend/   → API Node.js (porta 3333)
└── taskapp/   → App Expo (Android, iOS e Web)
```

## Como rodar

### 1. API (backend)

```bash
cd backend
npm install
cp .env.example .env    # depois preencha o JWT_SECRET (comando de geração está no arquivo)
npm run dev             # http://localhost:3333/api
npm test                # 15 testes automatizados
```

> Requer **Node 22.13+** (usa o SQLite nativo do Node, `node:sqlite` — nada para compilar).
> O banco é criado sozinho em `backend/data/taskapp.db`.

### 2. App (taskapp)

```bash
cd taskapp
npm install
npx expo start          # escaneie o QR Code com o Expo Go, ou tecle "w" para web
```

O app descobre sozinho o IP do computador que roda o Expo e chama `http://<IP>:3333/api`.
Celular e computador precisam estar **na mesma rede Wi-Fi**. Se precisar fixar o endereço,
crie `taskapp/.env` com `EXPO_PUBLIC_API_URL=...` (veja `taskapp/.env.example`).

## Funcionalidades

- Cadastro, login, logout e sessão que continua ao reabrir o app
- Lista de tarefas com **resumo** (todas, pendentes, em andamento, concluídas, vencidas)
- Filtro por status, filtro de **vencidas**, **busca** por texto, **ordenação** (vencimento, prioridade, recentes)
- Paginação com rolagem infinita e "puxar para atualizar"
- Criar, editar e excluir tarefas: título, descrição, **status**, **prioridade** e **data de vencimento**
- Marcar como concluída com um toque (atualização otimista)
- Prazos amigáveis: "Vence hoje", "Vence amanhã", "Venceu há 3 dias", com destaque visual
- Perfil: alterar nome, trocar senha, sair e excluir a conta
- Acessibilidade: rótulos para leitor de tela, áreas de toque ≥ 48px, bom contraste, mensagens de erro anunciadas

## Camadas de segurança

### Usuário

| Proteção | Como |
|---|---|
| Senha forte | mínimo 8 caracteres, letras + números (validado no app **e** na API) |
| Senha nunca guardada | hash **bcrypt** (12 rounds) |
| Força bruta | conta bloqueada por 15 min após 5 erros + limite de requisições por IP |
| Enumeração de e-mails | mensagem genérica "E-mail ou senha incorretos" e tempo de resposta constante |
| Sessão curta | access token JWT de **15 minutos**, guardado só na memória |
| Sessão longa segura | refresh token aleatório, salvo no **SecureStore** (Keychain/Keystore) e no banco só como **hash** |
| Roubo de token | refresh token **rotacionado** a cada uso; se um token antigo reaparecer, todas as sessões daquele login são derrubadas |
| Troca de senha | invalida **todos** os tokens antigos (outros aparelhos são desconectados) |
| Ações sensíveis | excluir a conta exige a senha |

### Aplicação

| Proteção | Como |
|---|---|
| Isolamento de dados | **toda** consulta filtra por `user_id` vindo do token; tarefa de outro usuário retorna 404 |
| SQL Injection | só consultas parametrizadas; ordenação vem de lista fechada; curingas do `LIKE` escapados |
| Mass assignment | `z.strictObject` rejeita campos extras (ninguém envia `userId` ou `isAdmin`) |
| Validação | Zod em body, query e params; IDs são UUID; datas validadas (31/02 não passa) |
| JWT | algoritmo fixo HS256 (bloqueia `alg: none`), `issuer` e `audience` conferidos, segredo ≥ 32 caracteres obrigatório |
| Cabeçalhos HTTP | **helmet** (nosniff, frameguard, HSTS, CSP...), sem `X-Powered-By` |
| CORS | apenas origens configuradas |
| Abuso | rate limit geral (300 req/15 min) e de autenticação (10 falhas/15 min); corpo JSON máx. 10 KB |
| Vazamento de erros | tratador central: nunca devolve stack trace; logs sem senha/token |
| Cache | `Cache-Control: no-store` em todas as respostas da API |

> As rotas protegidas do app (`Stack.Protected`) são só a camada visual.
> Quem protege os dados de verdade é a API: o app nunca é considerado confiável.

## Endpoints da API

Todas as rotas (menos cadastro, login, refresh, logout e health) exigem `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | status da API |
| POST | `/api/auth/register` | `{ name, email, password }` → usuário + tokens |
| POST | `/api/auth/login` | `{ email, password }` → usuário + tokens |
| POST | `/api/auth/refresh` | `{ refreshToken }` → novo par de tokens |
| POST | `/api/auth/logout` | `{ refreshToken }` → revoga a sessão |
| GET | `/api/auth/me` | dados do usuário logado |
| PATCH | `/api/users/me` | `{ name }` |
| PUT | `/api/users/me/password` | `{ currentPassword, newPassword }` |
| DELETE | `/api/users/me` | `{ password }` → apaga conta e tarefas |
| GET | `/api/tasks` | `?status=&priority=&search=&overdue=true&sort=due_date\|priority\|created_at\|title&order=asc\|desc&page=&limit=` |
| GET | `/api/tasks/summary` | contadores por status, vencidas e que vencem hoje |
| GET | `/api/tasks/:id` | uma tarefa |
| POST | `/api/tasks` | `{ title, description?, status?, priority?, dueDate? }` |
| PATCH | `/api/tasks/:id` | qualquer campo acima |
| PATCH | `/api/tasks/:id/status` | `{ status }` |
| DELETE | `/api/tasks/:id` | exclui |

Valores: `status` = `pendente` \| `em_andamento` \| `concluida` · `priority` = `baixa` \| `media` \| `alta` · `dueDate` = `AAAA-MM-DD` ou `null`.

## Estrutura

```
backend/src/
├── config/env.js            variáveis de ambiente validadas
├── db/database.js           SQLite + criação das tabelas
├── middlewares/             auth, validação, rate limit, erros
├── routes/                  auth, users, tasks
├── services/                regras de negócio (tokens, usuários, tarefas)
├── validators/schemas.js    schemas Zod
├── app.js                   montagem do Express e camadas de segurança
└── server.js                inicialização

taskapp/src/
├── app/                     telas (Expo Router)
│   ├── _layout.tsx          rotas protegidas + splash
│   ├── login.tsx · register.tsx
│   ├── index.tsx            lista de tarefas
│   ├── new-task.tsx · task/[id].tsx
│   └── profile.tsx
├── routes/index.ts          arquivo central de rotas (ROTAS.perfil, ROTAS.detalheTarefa(id)...)
├── components/              Botao, Campo, CampoData + Calendario, TaskItem, ListItens, ResumoTarefas...
├── contexts/AuthContext.tsx sessão do usuário (useAuth)
├── services/                api (fetch + renovação automática), auth, tasks, storage seguro
├── theme/cores.ts · types/ · utils/
```

## Para produção

- Use **HTTPS** (atrás de um proxy como Nginx/Caddy) e defina `TRUST_PROXY=1`
- `NODE_ENV=production` e um `JWT_SECRET` forte e exclusivo
- Defina `CORS_ORIGINS` com o domínio real do app web (obrigatório em produção, a API não sobe sem ele)
- Front na Vercel: `taskapp/vercel.json` já configura build (`expo export -p web`), rotas SPA e cabeçalhos de segurança; defina `EXPO_PUBLIC_API_URL` (com **https**) nas variáveis do projeto
- Faça backup do arquivo `data/taskapp.db`
