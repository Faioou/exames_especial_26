# SCOMP — Exercícios completos para Linux

Esta pasta contém **12 programas C completos e autónomos**, correspondentes às 12 versões da aplicação de treino.

Os blocos centrais (`submit_job`, `get_job`, `sensor_thread`, `registry_thread`, `reader`, `writer`, T1/T2, etc.) seguem a lógica usada na aplicação. Acrescentei apenas o que faltava para cada ficheiro poder ser realmente compilado e executado: `#include`, inicialização, `main()`, criação/join das threads, destruição/fecho dos objetos de sincronização e dados de teste.

## Ficheiros

1. `01_fila_impressao_cond.c` — Fila de impressão, mutex + condições
2. `02_fila_impressao_sem.c` — Fila de impressão, semáforos POSIX
3. `03_monitorizacao_cond.c` — Monitorização ambiental, mutex + condições
4. `04_monitorizacao_sem.c` — Monitorização ambiental, semáforos POSIX
5. `05_sensores_cond.c` — Sensores, mutex + condições
6. `06_sensores_sem.c` — Sensores, semáforos POSIX
7. `07_triatlo_cond.c` — Triatlo, mutex + condições
8. `08_triatlo_sem.c` — Triatlo, semáforos POSIX
9. `09_leitores_escritores_cond.c` — Leitores–Escritores, mutex + condições
10. `10_leitores_escritores_sem.c` — Leitores–Escritores, semáforos POSIX
11. `11_semaforo_rodoviario_cond.c` — Semáforo rodoviário, mutex + condições
12. `12_semaforo_rodoviario_sem.c` — Semáforo rodoviário, semáforos POSIX

## Compilar tudo

Na pasta, execute:

```bash
make
```

Os executáveis ficam na subpasta `bin/`.

## Executar um exercício

Por exemplo:

```bash
./bin/05_sensores_cond
```

ou:

```bash
./bin/10_leitores_escritores_sem
```

## Compilar um ficheiro isoladamente

```bash
gcc -std=c11 -Wall -Wextra -pthread 05_sensores_cond.c -o sensores
./sensores
```

Para as versões com `sem_open`, em sistemas Linux antigos pode ser necessário acrescentar `-lrt`:

```bash
gcc -std=c11 -Wall -Wextra -pthread 06_sensores_sem.c -o sensores_sem -lrt
```

## Nota sobre as versões alternativas

As versões com semáforos de exercícios cujo enunciado pede mutex + variáveis de condição são **versões alternativas de treino**, tal como na aplicação. Não devem ser apresentadas como resposta ao exame se o enunciado obrigar a outra técnica.

## Nota sobre o triatlo com semáforos

Na versão de treino com semáforos foi acrescentado `scores[i].number = i + 1;`, porque é necessário para o programa completo imprimir corretamente o número de cada atleta.

## Nota sobre os exercícios rodoviários

Cada travessia usa `sleep(1)`, como pede o enunciado. Por isso cada versão demora aproximadamente 60 segundos a terminar.
