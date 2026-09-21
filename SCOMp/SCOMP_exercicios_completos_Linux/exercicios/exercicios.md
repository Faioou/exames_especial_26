Sim. E acho que o melhor para ti é **não começarmos já pelo exercício dos carros e peões**, porque aí estás a tentar aprender threads, semáforos e sincronização tudo ao mesmo tempo.

Há uma ideia que quero que guardes desde já:

**Threads do mesmo processo já partilham a memória.** Se tiveres uma variável global:

```c
int contador = 0;
```

as duas threads conseguem aceder ao mesmo `contador`.

Já a **memória partilhada com `shm_open`, `mmap`, etc.** é sobretudo para **processos diferentes** comunicarem entre si. Vamos chegar aí depois.

Vou dar-te uma sequência feita para aprenderes isto progressivamente. **Não avances para o exercício seguinte enquanto o anterior não fizer sentido.**


# 1. **Uma única thread — perceber `pthread_create` e `pthread_join`**

   Faz um programa que crie uma thread. A thread deve apenas escrever:

   ```text
   Olá, sou a thread!
   ```

   O `main` deve escrever:

   ```text
   MAIN: vou criar a thread
   ```

   criar a thread, esperar por ela e depois escrever:

   ```text
   MAIN: a thread terminou
   ```

   Usa apenas:

   ```c
   pthread_create()
   pthread_join()
   ```

   Neste exercício não há mutex, semáforos nem memória partilhada.

   **Objetivo:** perceber que existem agora dois fluxos de execução: o `main` e a thread.

   **Resultado aproximado:**

   ```text
   MAIN: vou criar a thread
   Olá, sou a thread!
   MAIN: a thread terminou
   ```

   ---

# **Exercício 2 — duas threads independentes**

   Cria:

   ```c
   thread_A
   thread_B
   ```

   A primeira escreve cinco vezes:

   ```text
   A: 1
   A: 2
   ...
   ```

   A segunda:

   ```text
   B: 1
   B: 2
   ...
   ```

   Coloca:

   ```c
   sleep(1);
   ```

   dentro de cada ciclo.

   Não uses qualquer sincronização.

   Vais provavelmente ver algo parecido com:

   ```text
   A: 1
   B: 1
   A: 2
   B: 2
   B: 3
   A: 3
   ...
   ```

   **Objetivo:** perceber que as duas threads executam concorrentemente e que não controlas necessariamente qual executa primeiro.

   ---

   **Exercício 3 — passar argumentos a uma thread**

   Cria uma função:

   ```c
   void *mostrar_numero(void *arg)
   ```

   E passa-lhe um inteiro.

   Uma thread recebe `10` e outra recebe `20`.

   Devem imprimir:

   ```text
   Recebi o número 10
   Recebi o número 20
   ```

   Aqui tens de começar a perceber:

   ```c
   void *arg
   ```

   e fazer algo como:

   ```c
   int numero = *(int *)arg;
   ```

   **Objetivo:** perceber para que serve o `void *arg` que aparece em todas estas funções.

   ---

   **Exercício 4 — primeira variável partilhada**

   Agora cria:

   ```c
   int contador = 0;
   ```

   como variável global.

   Cria duas threads.

   Cada uma deve fazer:

   ```c
   for (int i = 0; i < 100000; i++)
       contador++;
   ```

   No final, teoricamente esperarias:

   ```text
   contador = 200000
   ```

   Executa várias vezes.

   É possível que obtenhas:

   ```text
   185432
   ```

   ou:

   ```text
   197845
   ```

   ou outro valor.

   **Não corrijas ainda.**

   Quero que percebas primeiro o problema.

   As duas threads estão a mexer **na mesma variável em memória**.

   Isto é uma **race condition**.

   ---

   **Exercício 5 — resolver a race condition com mutex**

   Pegas exatamente no exercício anterior.

   Acrescentas:

   ```c
   pthread_mutex_t mutex;
   ```

   E proteges:

   ```c
   contador++;
   ```

   com:

   ```c
   pthread_mutex_lock(&mutex);

   contador++;

   pthread_mutex_unlock(&mutex);
   ```

   Agora o resultado deve dar sempre:

   ```text
   contador = 200000
   ```

   **Objetivo:** perceber o mutex como uma chave.

   Imagina:

   ```text
                 CONTADOR
                    |
                  [porta]
                    |
                  MUTEX
                 /     \
            Thread A  Thread B
   ```

   Só uma entra de cada vez.

   ---

   **Exercício 6 — alternar duas threads**

   Quero agora duas threads:

   ```text
   PING
   PONG
   ```

   Mas quero obrigatoriamente:

   ```text
   PING
   PONG
   PING
   PONG
   PING
   PONG
   ```

   Nunca:

   ```text
   PING
   PING
   PONG
   ```

   Usa dois semáforos:

   ```c
   sem_ping
   sem_pong
   ```

   Inicialmente:

   ```text
   sem_ping = 1
   sem_pong = 0
   ```

   A thread `PING`:

   ```c
   sem_wait(&sem_ping);

   printf("PING\n");

   sem_post(&sem_pong);
   ```

   A thread `PONG` faz o contrário.

   **Este exercício é importantíssimo para perceberes `sem_wait` e `sem_post`.**

   Aqui já consegues visualizar:

   ```text
   PING diz:
   "posso?"
       ↓
   sem_wait

   imprime PING

   depois:
   "agora podes tu"
       ↓
   sem_post(sem_pong)
   ```

   ---

   **Exercício 7 — semáforo como contador de recursos**

   Agora tens uma sala onde só podem entrar **3 pessoas de cada vez**.

   Cria 10 threads, representando 10 pessoas.

   Inicializa:

   ```c
   sem_init(&lugares, 0, 3);
   ```

   Cada thread faz:

   ```c
   sem_wait(&lugares);

   printf("Pessoa entrou\n");
   sleep(2);
   printf("Pessoa saiu\n");

   sem_post(&lugares);
   ```

   Aqui vais finalmente perceber que um semáforo pode valer:

   ```text
   3
   2
   1
   0
   ```

   Quando está em `0`, as seguintes threads ficam bloqueadas.

   Quando alguém faz:

   ```c
   sem_post()
   ```

   volta a existir uma autorização.

   ---

   **Exercício 8 — produtor e consumidor, versão muito simples**

   Tens:

   ```c
   int produto;
   ```

   Uma thread produtora coloca valores:

   ```text
   10
   20
   30
   40
   ```

   Uma thread consumidora deve lê-los.

   Usa:

   ```c
   sem_vazio
   sem_cheio
   ```

   Inicialmente:

   ```text
   vazio = 1
   cheio = 0
   ```

   O produtor:

   ```text
   espera que esteja vazio
           ↓
   produz
           ↓
   diz que está cheio
   ```

   O consumidor:

   ```text
   espera que esteja cheio
           ↓
   consome
           ↓
   diz que está vazio
   ```

   Aqui começas a perceber a lógica do produtor/consumidor sem ainda termos uma fila.

   ---

   **Exercício 9 — produtor/consumidor com fila**

   Agora tens:

   ```c
   #define TAMANHO 5

   int fila[TAMANHO];
   int head = 0;
   int tail = 0;
   ```

   Acrescentas:

   ```c
   sem_t empty;
   sem_t full;
   pthread_mutex_t mutex;
   ```

   Este já é o exercício clássico que tens visto.

   Aqui quero que percebas separadamente:

   ```text
   empty → quantos lugares estão vazios
   full  → quantos elementos existem
   mutex → protege fisicamente a fila
   ```

   Não são três coisas a fazer o mesmo trabalho.

   ---

   **Exercício 10 — o teu semáforo rodoviário**

   Só agora voltamos aos:

   ```text
   carros
   peões
   controlador
   ```

   Mas primeiro faz uma versão muito mais pequena:

   ```c
   #define NR_POR_TIPO 4
   #define LIMITE 2
   ```

   Portanto:

   ```text
   2 carros
   2 peões
   2 carros
   2 peões
   ```

   Em vez de começares logo com 30.

   Usa:

   ```c
   sem_carros
   sem_peoes
   sem_passou
   ```

   Quando esta versão funcionar e tu conseguires explicar linha a linha, mudamos simplesmente para:

   ```c
   30
   5
   ```

   ---

   **Exercício 11 — processos sem memória partilhada**

   Agora abandonamos temporariamente as threads.

   Faz:

   ```c
   int numero = 10;

   fork();
   ```

   O processo filho altera:

   ```c
   numero = 20;
   ```

   Depois observa o valor no pai.

   Vais descobrir uma coisa fundamental:

   **pai e filho não estão a alterar a mesma variável**, apesar de inicialmente parecer que têm a mesma memória.

   É aqui que começa a fazer sentido a verdadeira memória partilhada entre processos.

   ---

   **Exercício 12 — memória partilhada entre dois processos**

   Agora usa:

   ```c
   shm_open()
   ftruncate()
   mmap()
   ```

   Cria um inteiro numa zona de memória partilhada.

   O processo filho escreve:

   ```text
   50
   ```

   O processo pai lê:

   ```text
   50
   ```

   Pela primeira vez vais ter:

   ```text
   PROCESSO PAI
          \
           \
          memória
         partilhada
           /
          /
   PROCESSO FILHO
   ```

   ---

   **Exercício 13 — memória partilhada + semáforo**

   Agora tens:

   ```c
   int numero;
   ```

   em memória partilhada.

   O filho escreve:

   ```c
   numero = 100;
   ```

   e faz:

   ```c
   sem_post(...)
   ```

   O pai faz:

   ```c
   sem_wait(...)
   ```

   antes de ler.

   Assim já tens **processos + memória partilhada + sincronização**.

   ---

   **Exercício 14 — nível de exame**

   Faz um sistema com:

   ```text
   2 produtores
   2 consumidores
   fila de tamanho 5
   mutex
   sem_empty
   sem_full
   ```

   Cada produtor gera 20 trabalhos.

   Cada consumidor retira trabalhos da fila.

   No final devem ter sido processados exatamente 40 trabalhos.

   A seguir podemos acrescentar uma segunda fila para trabalhos urgentes.

   Esse já é o nível dos exercícios que tens estado a estudar.

O percurso que eu faria contigo é:

```text
THREAD
  ↓
DUAS THREADS
  ↓
VARIÁVEL PARTILHADA
  ↓
RACE CONDITION
  ↓
MUTEX
  ↓
SEM_WAIT / SEM_POST
  ↓
PRODUTOR / CONSUMIDOR
  ↓
FILA
  ↓
CARROS / PEÕES
  ↓
PROCESSOS
  ↓
MEMÓRIA PARTILHADA
```

E há uma coisa que te vai ajudar bastante: **não quero que copies as soluções completas destes exercícios**. Fazemos o exercício 1, tu escreves o código e mandas-me. Eu digo-te apenas o que está errado e porquê. Depois passamos ao 2.

Assim vais começar mesmo a perceber isto em vez de decorar código.
