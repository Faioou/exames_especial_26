# STRIKEBOARD — CS 1.6 (v4)

Site local para guardar o perfil competitivo e o histórico de partidas de Counter-Strike 1.6.

## O que mudou na v4

- O registo de partidas passou a ser **100% manual**.
- Cada partida tem **10 jogadores**: 5 da ZYQX + 5 adversários.
- Em cada jogador podes escrever **nome, kills e deaths**.
- Na tua equipa existe a opção **EU**, para indicar qual dos 5 jogadores és tu.
- As tuas estatísticas são retiradas automaticamente da linha marcada como **EU**.
- Podes escolher apenas um destes mapas:
  - de_dust2
  - de_inferno
  - de_nuke
  - de_train
  - de_tuscan
  - de_mirage
- O resultado da partida calcula automaticamente vitória/derrota e rating.
- Se mudares o teu nickname no perfil, o nome também muda nos históricos antigos.

## Como iniciar no Windows

1. Instala o Node.js, se ainda não estiver instalado.
2. Faz duplo clique em `start-windows.bat`.
3. Abre no browser:

   http://localhost:4173

Também podes abrir uma consola nesta pasta e executar:

```bash
node server.js
```

## Base de dados

Tudo fica guardado localmente em:

`data/database.json`

Não é necessário MySQL, PostgreSQL ou qualquer serviço online.

Também podes clicar em **Exportar dados** no site para guardar uma cópia da base de dados.

## Rating

- Rating inicial: 1000
- Vitória: +25
- Derrota: -25
- 10 níveis no total
