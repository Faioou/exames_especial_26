Sim. Revendo os exames que enviou, encontrei **8 exercícios práticos diretamente ligados a threads, memória partilhada, mutexes, variáveis de condição ou semáforos**. Há também várias escolhas múltiplas sobre estes temas, mas aqui vou concentrar-me nos **exercícios de programação**. Depois podemos fazer as escolhas múltiplas uma a uma, explicando também por que as restantes opções estão erradas, como combinámos.

| Exame                  | Exercício relevante     | Matéria principal                                    |
| ---------------------- | ----------------------- | ---------------------------------------------------- |
| Época Especial 2023/24 | Leitores–Escritores     | Threads + memória partilhada + mutexes               |
| Época Normal 2023/24   | Fila de impressão       | Threads + mutex + variáveis de condição              |
| Época Recurso 2023/24  | Triatlo                 | 2 threads + mutex + variáveis de condição            |
| Época Normal 2024/25   | Sensores                | Threads + buffer circular + mutex + condições        |
| Época Especial 2024/25 | Monitorização ambiental | Threads + buffer + condições + notificações          |
| Época Normal 2025/26   | Fila de impressão       | Threads + mutex + condições                          |
| Época Recurso 2024/25  | Semáforo rodoviário     | Threads + mutex + condições                          |
| Época Recurso 2025/26  | Fila de impressão       | **Processos + memória partilhada + semáforos POSIX** |

Vamos resolvê-los.

---

# 1. Época Especial 2023/24 — Leitores/Escritores

O exercício pede explicitamente:

> “através do uso de **threads**, implemente um cenário de múltiplos escritores e múltiplos leitores”

e:

> “Os leitores têm prioridade sobre os escritores.”

Vários leitores podem ler simultaneamente, mas um escritor tem de ficar sozinho. 

Isto é precisamente a **primeira variante Readers-Writers**, que favorece os leitores.

A parte fundamental é:

```c
pthread_mutex_t mutex_rc;
pthread_mutex_t mutex_data;

int readcnt = 0;
```

### Leitor

```c
void *reader(void *arg)
{
    pthread_mutex_lock(&mutex_rc);

    readcnt++;

    if (readcnt == 1)
        pthread_mutex_lock(&mutex_data);

    pthread_mutex_unlock(&mutex_rc);


    /* LEITURA DA MEMÓRIA PARTILHADA */

    printf("Leitores ativos: %d\n", readcnt);


    pthread_mutex_lock(&mutex_rc);

    readcnt--;

    if (readcnt == 0)
        pthread_mutex_unlock(&mutex_data);

    pthread_mutex_unlock(&mutex_rc);

    return NULL;
}
```

### Escritor

```c
void *writer(void *arg)
{
    pthread_mutex_lock(&mutex_data);

    /* ESCRITA NA MEMÓRIA PARTILHADA */

    printf("Escritor a escrever\n");

    pthread_mutex_unlock(&mutex_data);

    return NULL;
}
```

A ideia que deve guardar é:

```text
1.º leitor entra
→ bloqueia mutex_data
→ escritor não pode entrar

2.º, 3.º, 4.º leitores
→ podem ler também

último leitor sai
→ liberta mutex_data
→ escritor pode entrar
```

Isto corresponde diretamente ao exercício. 

---

# 2. Época Normal 2023/24 — Fila de impressão

Este é muito importante porque é praticamente o antecessor daquele exercício de 2025/26 que já estudámos.

O enunciado pede:

> “fila de impressão [...] usando threads”

> “acesso à fila protegido por um mutex”

> “variáveis de condição”

> cliente bloqueia se cheia e impressora bloqueia se vazia. 

Buffer:

```c
#define BUFFER_SIZE 4

typedef struct {
    int jobs[BUFFER_SIZE];

    int head;
    int tail;
    int count;

    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;

} print_queue_t;
```

### Inserir

```c
void submit_job(print_queue_t *queue, int job)
{
    pthread_mutex_lock(&queue->mutex);

    while (queue->count == BUFFER_SIZE)
        pthread_cond_wait(&queue->not_full,
                          &queue->mutex);

    queue->jobs[queue->tail] = job;

    queue->tail =
        (queue->tail + 1) % BUFFER_SIZE;

    queue->count++;

    pthread_cond_signal(&queue->not_empty);

    pthread_mutex_unlock(&queue->mutex);
}
```

### Retirar

```c
int get_job(print_queue_t *queue)
{
    int job;

    pthread_mutex_lock(&queue->mutex);

    while (queue->count == 0)
        pthread_cond_wait(&queue->not_empty,
                          &queue->mutex);

    job = queue->jobs[queue->head];

    queue->head =
        (queue->head + 1) % BUFFER_SIZE;

    queue->count--;

    pthread_cond_signal(&queue->not_full);

    pthread_mutex_unlock(&queue->mutex);

    return job;
}
```

É exatamente a lógica que já aprendeu:

```text
PRODUTOR:
lock
→ se cheia, wait(not_full)
→ insere em tail
→ tail avança
→ count++
→ signal(not_empty)
→ unlock


CONSUMIDOR:
lock
→ se vazia, wait(not_empty)
→ retira de head
→ head avança
→ count--
→ signal(not_full)
→ unlock
```

---

# 3. Época Recurso 2023/24 — Triatlo

Este é muito bom para aprender **sincronização entre apenas duas threads**.

O enunciado manda criar:

> “apenas 2 threads (T1 e T2) que se sincronizam através do uso de mutexes e variáveis de condição.”

E exige:

> “T1 gera os valores parciais de um atleta e T2 calcula o seu resultado final, antes de serem gerados os valores para o próximo atleta.” 

Portanto queremos:

```text
T1 atleta 0
   ↓
T2 atleta 0
   ↓
T1 atleta 1
   ↓
T2 atleta 1
   ↓
...
```

Estrutura:

```c
athlete_score scores[300];

pthread_mutex_t mutex;
pthread_cond_t cond_t1;
pthread_cond_t cond_t2;

int ready = 0;
```

### T1

```c
void *T1(void *arg)
{
    int i;

    for (i = 0; i < 300; i++) {

        pthread_mutex_lock(&mutex);

        while (ready == 1)
            pthread_cond_wait(&cond_t1, &mutex);

        scores[i].number = i + 1;

        scores[i].event_scores[0] =
            gera_num(0, 100);

        scores[i].event_scores[1] =
            gera_num(0, 100);

        scores[i].event_scores[2] =
            gera_num(0, 100);

        scores[i].total_time =
            gera_num(50, 100);

        ready = 1;

        pthread_cond_signal(&cond_t2);

        pthread_mutex_unlock(&mutex);
    }

    return NULL;
}
```

### T2

```c
void *T2(void *arg)
{
    int i;

    for (i = 0; i < 300; i++) {

        pthread_mutex_lock(&mutex);

        while (ready == 0)
            pthread_cond_wait(&cond_t2, &mutex);

        scores[i].final_score =
            0.30 *
            (scores[i].event_scores[0] +
             scores[i].event_scores[1] +
             scores[i].event_scores[2]) / 3.0
            +
            0.70 * scores[i].total_time;

        ready = 0;

        pthread_cond_signal(&cond_t1);

        pthread_mutex_unlock(&mutex);
    }

    return NULL;
}
```

Aqui:

```text
ready = 0
→ T1 pode trabalhar

ready = 1
→ T2 pode trabalhar
```

É como um **testemunho numa corrida de estafetas**.

---

# 4. Época Normal 2024/25 — Sensores

Este exercício pede três threads:

> “duas delas simulam sensores [...] e a terceira serve de registo”

e um:

> “buffer circular com capacidade para 10 valores”

com bloqueio passivo quando cheio/vazio e exclusão mútua. 

É novamente **Producer–Consumer**.

```c
#define BUFFER_SIZE 10

typedef struct {
    int sensor_id;
    int read_number;
    int value;
} reading_t;

typedef struct {
    reading_t buffer[BUFFER_SIZE];

    int head;
    int tail;
    int count;

    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;

} shared_t;
```

Cada sensor produz:

```c
void put_reading(shared_t *s, reading_t r)
{
    pthread_mutex_lock(&s->mutex);

    while (s->count == BUFFER_SIZE)
        pthread_cond_wait(&s->not_full,
                          &s->mutex);

    s->buffer[s->tail] = r;

    s->tail =
        (s->tail + 1) % BUFFER_SIZE;

    s->count++;

    pthread_cond_signal(&s->not_empty);

    pthread_mutex_unlock(&s->mutex);
}
```

O registo consome:

```c
reading_t get_reading(shared_t *s)
{
    reading_t r;

    pthread_mutex_lock(&s->mutex);

    while (s->count == 0)
        pthread_cond_wait(&s->not_empty,
                          &s->mutex);

    r = s->buffer[s->head];

    s->head =
        (s->head + 1) % BUFFER_SIZE;

    s->count--;

    pthread_cond_signal(&s->not_full);

    pthread_mutex_unlock(&s->mutex);

    return r;
}
```

Repare que é **a mesma estrutura mental** da fila de impressão. Só mudou o que estamos a guardar:

```text
antes → job
agora → reading
```

---

# 5. Época Especial 2024/25 — Monitorização ambiental

É a versão mais avançada do exercício anterior.

Agora há:

> “3 sensores (threads produtoras) e 2 threads consumidoras (registo e alerta)”

e a thread alerta:

> “não deve impedir a thread registo de processar leituras”

devendo ser acordada:

> “através de um mecanismo de notificação adicional.” 

Para o buffer principal usamos exatamente:

```c
pthread_mutex_lock(&buffer->mutex);

while (buffer->count == BUFFER_SIZE)
    pthread_cond_wait(&buffer->not_full,
                      &buffer->mutex);

/* inserir */

pthread_cond_signal(&buffer->not_empty);

pthread_mutex_unlock(&buffer->mutex);
```

O registo retira:

```c
pthread_mutex_lock(&buffer->mutex);

while (buffer->count == 0)
    pthread_cond_wait(&buffer->not_empty,
                      &buffer->mutex);

reading = buffer->values[buffer->head];

buffer->head =
    (buffer->head + 1) % BUFFER_SIZE;

buffer->count--;

pthread_cond_signal(&buffer->not_full);

pthread_mutex_unlock(&buffer->mutex);
```

Se:

```c
reading.urgent_flag == 1
```

o registo coloca essa leitura numa **fila de alertas separada** e faz:

```c
pthread_cond_signal(&alert_cond);
```

A thread alerta fica:

```c
pthread_mutex_lock(&alert_mutex);

while (alert_count == 0)
    pthread_cond_wait(&alert_cond,
                      &alert_mutex);

/* retirar e tratar alerta */

pthread_mutex_unlock(&alert_mutex);
```

A grande ideia é que **o alerta não fica com o mutex do buffer principal**, permitindo ao registo continuar.

---

# 6. Época Normal 2025/26 — Fila de impressão

Este é exatamente o exercício que já resolvemos.

O próprio exame dá:

```c
pthread_mutex_t mutex;
pthread_cond_t not_full;
pthread_cond_t not_empty;
```

e pede apenas:

```c
void submit_job(...)
int get_job(...)
```



Resposta:

```c
void submit_job(print_queue_t *queue, int job_id)
{
    pthread_mutex_lock(&queue->mutex);

    while (queue->count == BUFFER_SIZE)
        pthread_cond_wait(&queue->not_full,
                          &queue->mutex);

    queue->jobs[queue->tail] = job_id;

    queue->tail =
        (queue->tail + 1) % BUFFER_SIZE;

    queue->count++;

    pthread_cond_signal(&queue->not_empty);

    pthread_mutex_unlock(&queue->mutex);
}


int get_job(print_queue_t *queue)
{
    int job_id;

    pthread_mutex_lock(&queue->mutex);

    while (queue->count == 0)
        pthread_cond_wait(&queue->not_empty,
                          &queue->mutex);

    job_id = queue->jobs[queue->head];

    queue->head =
        (queue->head + 1) % BUFFER_SIZE;

    queue->count--;

    pthread_cond_signal(&queue->not_full);

    pthread_mutex_unlock(&queue->mutex);

    return job_id;
}
```

Aqui já deve reconhecer imediatamente:

```text
tail → inserir
head → retirar
count → número de trabalhos
not_full → produtor espera
not_empty → consumidor espera
```

---

# 7. Época Recurso 2024/25 — Semáforo rodoviário

Também já vimos este.

O enunciado exige:

> duas threads geradoras

e:

> uma thread controladora do semáforo

com carros e peões a bloquearem **passivamente**. 

Estrutura central:

```c
#define CARROS 0
#define PEOES 1

typedef struct {
    int verde;
    int passaram;

    pthread_mutex_t mutex;

    pthread_cond_t carros;
    pthread_cond_t peoes;
    pthread_cond_t controlador;

} semaforo_t;
```

Carro:

```c
pthread_mutex_lock(&s->mutex);

while (s->verde != CARROS ||
       s->passaram == 5)
    pthread_cond_wait(&s->carros,
                      &s->mutex);

pthread_mutex_unlock(&s->mutex);

sleep(1);

pthread_mutex_lock(&s->mutex);

s->passaram++;

if (s->passaram == 5)
    pthread_cond_signal(&s->controlador);

pthread_mutex_unlock(&s->mutex);
```

Peão é igual, mudando:

```c
CARROS
```

para:

```c
PEOES
```

O controlador:

```c
pthread_mutex_lock(&s->mutex);

while (s->passaram < 5)
    pthread_cond_wait(&s->controlador,
                      &s->mutex);

s->passaram = 0;

if (s->verde == CARROS) {
    s->verde = PEOES;
    pthread_cond_signal(&s->peoes);
}
else {
    s->verde = CARROS;
    pthread_cond_signal(&s->carros);
}

pthread_mutex_unlock(&s->mutex);
```

A lógica é:

```text
5 carros
→ controlador acorda
→ verde para peões

5 peões
→ controlador acorda
→ verde para carros
```

---

# 8. Época Recurso 2025/26 — o exercício MAIS IMPORTANTE de memória partilhada + semáforos

Este é o único dos exercícios práticos recentes que diz explicitamente:

> **“vários processos produtores”**

> **“memória partilhada e semáforos POSIX”**

e fornece:

```c
sem_t mutex;
sem_t empty;
sem_t full;
```

com:

```text
mutex = 1
empty = BUFFER_SIZE
full = 0
```



É exatamente aquele que estivemos agora a estudar.

### Produtor

```c
void submit_job(shared_memory_t *shared_memory,
                int job_id)
{
    sem_wait(&shared_memory->empty);

    sem_wait(&shared_memory->mutex);

    shared_memory->jobs[shared_memory->tail]
        = job_id;

    shared_memory->tail =
        (shared_memory->tail + 1)
        % BUFFER_SIZE;

    sem_post(&shared_memory->mutex);

    sem_post(&shared_memory->full);
}
```

### Consumidor

```c
int get_job(shared_memory_t *shared_memory)
{
    int job_id;

    sem_wait(&shared_memory->full);

    sem_wait(&shared_memory->mutex);

    job_id =
        shared_memory->jobs[shared_memory->head];

    shared_memory->head =
        (shared_memory->head + 1)
        % BUFFER_SIZE;

    sem_post(&shared_memory->mutex);

    sem_post(&shared_memory->empty);

    return job_id;
}
```

Aqui precisa de saber de cor a lógica, não necessariamente o código:

```text
PRODUTOR

sem_wait(empty)
"há espaço?"

sem_wait(mutex)
"posso mexer sozinho?"

INSERE

sem_post(mutex)
"já terminei"

sem_post(full)
"há mais um trabalho"
```

e:

```text
CONSUMIDOR

sem_wait(full)
"há trabalho?"

sem_wait(mutex)
"posso mexer sozinho?"

REMOVE

sem_post(mutex)
"já terminei"

sem_post(empty)
"há mais um espaço"
```

Esta sequência também responde diretamente às perguntas de escolha múltipla do exame de recurso 2025/26, onde é perguntado qual a ordem correta do produtor: **`sem_wait(empty)` antes de `sem_wait(mutex)`**. 

## O padrão que está a repetir-se nos exames

Há aqui uma coisa muito boa para a sua preparação: **os professores estão a repetir essencialmente os mesmos três modelos**, mudando apenas a história do enunciado.

```text
MODELO 1 — THREADS + PRODUTOR/CONSUMIDOR

mutex_lock
while (cheio/vazio)
    cond_wait

inserir/remover

cond_signal
mutex_unlock
```

Aparece em **fila de impressão, sensores e monitorização ambiental**.

```text
MODELO 2 — PROCESSOS + MEMÓRIA PARTILHADA + SEMÁFOROS

sem_wait(empty/full)
sem_wait(mutex)

inserir/remover

sem_post(mutex)
sem_post(full/empty)
```

Aparece claramente no **Recurso 2025/26**.

```text
MODELO 3 — LEITORES/ESCRITORES

primeiro leitor bloqueia escritor
vários leitores podem entrar
último leitor liberta escritor
```

Aparece na **Época Especial 2023/24**.

Se dominar estes **três modelos**, cobre uma parte muito significativa dos exercícios de sincronização presentes nos exames que enviou.   

Na próxima mensagem posso pegar **nas escolhas múltiplas de todos estes exames que sejam exclusivamente sobre memória partilhada, semáforos, mutexes, variáveis de condição e threads**, e resolvê-las uma a uma, incluindo **por que a), b), c) e d) estão certas ou erradas**.
