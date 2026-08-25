# STRIKEBOARD — perfil CS 1.6 local

Site local para acompanhar o perfil **[ZYQX] Cuddlesoks**, com níveis 1–10, rating, estatísticas e histórico de partidas.

## O que já está incluído

- Primeira partida: `de_tuscan`, derrota **5–13**.
- Stats de **[ZYQX] Cuddlesoks**: **14 kills / 15 deaths**.
- Scoreboard dos 10 jogadores extraído visualmente do screenshot fornecido.
- Screenshot original guardado em `public/assets/tuscan-scoreboard.png`.
- Rating inicial: **1000**.
- Derrota inicial: **-25**, ficando com **975 rating / nível 3**.
- Formulário para adicionar novas partidas.
- Persistência real num ficheiro JSON local: `data/database.json`.
- Botão para exportar a base de dados.

## Como abrir no Windows

1. Instale o **Node.js** se ainda não o tiver.
2. Abra uma consola dentro desta pasta.
3. Execute:

```bash
node server.js
```

4. Abra no browser:

```text
http://localhost:4173
```

## Base de dados

Os dados ficam em:

```text
data/database.json
```

Não é preciso MySQL, PostgreSQL ou qualquer serviço externo. Tudo fica no seu computador.

## Sistema de níveis

| Nível | Rating |
|---|---:|
| 1 | 0–800 |
| 2 | 801–950 |
| 3 | 951–1100 |
| 4 | 1101–1250 |
| 5 | 1251–1400 |
| 6 | 1401–1550 |
| 7 | 1551–1700 |
| 8 | 1701–1850 |
| 9 | 1851–2000 |
| 10 | 2001+ |

Neste protótipo, vitória = `+25` e derrota = `-25`. A fórmula pode ser alterada na função `calculateRatingChange()` do `server.js`.

## Alterar o nickname

No perfil, clique em **Editar nome**. Ao guardar um novo nickname, o STRIKEBOARD atualiza automaticamente esse nome no perfil e em todas as partidas anteriores guardadas na base de dados local, incluindo a linha do jogador nos scoreboards que estejam armazenados.
