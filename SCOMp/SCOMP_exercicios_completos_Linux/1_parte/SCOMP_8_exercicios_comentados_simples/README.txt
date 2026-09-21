SCOMP — 8 primeiros exercícios práticos dos exames fornecidos
=============================================================

OBJETIVO DESTA VERSÃO
---------------------
Estes ficheiros foram escritos para estudo:
- comentários ligam cada bloco de código ao que o enunciado pede;
- a solução tenta seguir diretamente a ordem natural do enunciado;
- evitei "atalhos" ou deduções escondidas;
- os programas estão completos para poderem ser executados no Linux/WSL.

FICHEIROS
---------
01_2023_24_normal_fila_impressao.c
02_2023_24_recurso_triatlo.c
03_2023_24_especial_leitores_escritores.c
04_2024_25_normal_master_slave_fatoriais.c
05_2024_25_recurso_encomendas.c
06_2024_25_especial_vendas.c
07_2025_26_normal_maior_valor.c
08_2025_26_recurso_soma_quadrados.c

COMPILAR
--------
Threads:
gcc 01_2023_24_normal_fila_impressao.c -o ex01 -pthread
gcc 02_2023_24_recurso_triatlo.c -o ex02 -pthread
gcc 03_2023_24_especial_leitores_escritores.c -o ex03 -pthread

Processos/pipes:
gcc 04_2024_25_normal_master_slave_fatoriais.c -o ex04
gcc 05_2024_25_recurso_encomendas.c -o ex05
gcc 06_2024_25_especial_vendas.c -o ex06
gcc 07_2025_26_normal_maior_valor.c -o ex07
gcc 08_2025_26_recurso_soma_quadrados.c -o ex08

EXEMPLOS
--------
Ex01:
./ex01
(Não termina por definição do enunciado; use Ctrl+C.)

Ex02:
./ex02

Ex03:
./ex03

Ex04:
./ex04
Depois introduza M e, a seguir, os M números.

Ex05:
./ex05
Depois introduza M e, a seguir, os M pedidos.

Ex06:
./ex06
Atenção: usa 1 000 000 de registos porque é exatamente o que o enunciado pede.
Pode imprimir muitas linhas.

Ex07:
./ex07 4 17 9 21

Ex08:
./ex08 1 2 3 4 5

NOTA SOBRE 2025/26
------------------
Nesses exames, o enunciado pede apenas parent_function() e child_function()
e diz para assumir filhos e pipes já criados.

Eu mantive essas funções como parte principal da resposta e acrescentei main(),
pipe() e fork() apenas para poder testar o exercício como programa completo.
