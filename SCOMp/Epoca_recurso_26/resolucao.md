Claro. Aqui a lógica é **Produtor–Consumidor com processos, memória partilhada e 3 semáforos**. O próprio exame dá estes valores iniciais:

```text
mutex = 1
empty = BUFFER_SIZE
full  = 0
```

Isto significa: a fila começa vazia, há `BUFFER_SIZE` lugares livres e zero trabalhos disponíveis. 

Antes do código, guarde isto:

```text
empty = quantos lugares VAZIOS existem
full  = quantos trabalhos existem
mutex = garante que só UM processo mexe na fila de cada vez

tail  = posição onde vou INSERIR
head  = posição de onde vou RETIRAR
```

## Produtor — `submit_job`

```c
void submit_job(shared_memory_t *shared_memory,
                int job_id)
{
    sem_wait(&shared_memory->empty);
```

Isto pergunta:

> **“Há algum lugar vazio na fila?”**

Se houver, por exemplo:

```text
empty = 3
```

o produtor reserva um:

```text
empty: 3 → 2
```

Se:

```text
empty = 0
```

a fila está cheia e o produtor **fica bloqueado**, sem gastar CPU, até algum consumidor libertar um lugar.

Depois:

```c
    sem_wait(&shared_memory->mutex);
```

Agora pergunta:

> **“Posso mexer na fila sozinho?”**

O `mutex` começa em 1.

```text
mutex = 1
```

O produtor faz `sem_wait`:

```text
mutex: 1 → 0
```

Agora mais ninguém pode mexer em `head`, `tail` ou `jobs` até ele libertar o mutex.

Depois vem a inserção:

```c
    shared_memory->jobs[shared_memory->tail]
        = job_id;
```

Imagine:

```text
tail = 3
job_id = 57
```

Então faz:

```text
jobs[3] = 57
```

Ou seja, guarda o trabalho 57 na posição 3.

Depois:

```c
    shared_memory->tail =
        (shared_memory->tail + 1)
        % BUFFER_SIZE;
```

Isto faz `tail` avançar para a **próxima posição onde será inserido um trabalho**.

Se:

```text
tail = 3
```

fica:

```text
tail = 4
```

Se estivermos na última posição:

```text
tail = 9
BUFFER_SIZE = 10
```

temos:

```text
(9 + 1) % 10 = 0
```

Portanto volta ao início. É por isso que se chama **buffer circular**.

Depois:

```c
    sem_post(&shared_memory->mutex);
```

Significa:

> **“Já terminei de mexer na fila. Outro processo já pode entrar.”**

```text
mutex: 0 → 1
```

Finalmente:

```c
    sem_post(&shared_memory->full);
}
```

Significa:

> **“Acabei de colocar mais um trabalho. Há mais um item disponível.”**

Por exemplo:

```text
full: 2 → 3
```

Isto também pode acordar um consumidor que estivesse bloqueado à espera de um trabalho.

Portanto o produtor inteiro pode ser lido assim:

```text
Há espaço?
    ↓
SIM
    ↓
Posso mexer sozinho na fila?
    ↓
SIM
    ↓
coloco o trabalho em tail
    ↓
avanço tail
    ↓
liberto a fila
    ↓
aviso: "há mais um trabalho"
```

---

# Consumidor — `get_job`

Agora faça exatamente o raciocínio contrário.

```c
int get_job(shared_memory_t *shared_memory)
{
    int job_id;

    sem_wait(&shared_memory->full);
```

Isto pergunta:

> **“Há algum trabalho para retirar?”**

Se:

```text
full = 4
```

o consumidor reserva um:

```text
full: 4 → 3
```

Se:

```text
full = 0
```

não há trabalhos e o consumidor **fica bloqueado** até um produtor inserir alguma coisa e fazer:

```c
sem_post(&shared_memory->full);
```

Depois:

```c
    sem_wait(&shared_memory->mutex);
```

Significa:

> **“Agora quero mexer na fila sozinho.”**

Nenhum produtor ou outro consumidor pode alterar a fila ao mesmo tempo.

Depois:

```c
    job_id =
        shared_memory->jobs[shared_memory->head];
```

O consumidor retira o trabalho que está na posição `head`.

Imagine:

```text
head = 2

jobs[2] = 91
```

Então:

```text
job_id = 91
```

Depois:

```c
    shared_memory->head =
        (shared_memory->head + 1)
        % BUFFER_SIZE;
```

Faz `head` avançar para o **próximo trabalho a retirar**.

Por exemplo:

```text
head = 2 → 3
```

Ou, se estiver no fim:

```text
head = 9 → 0
```

Depois:

```c
    sem_post(&shared_memory->mutex);
```

Significa:

> **“Já terminei de mexer na fila.”**

Outro processo já pode entrar.

Depois:

```c
    sem_post(&shared_memory->empty);
```

Isto é muito importante.

Como o consumidor **retirou um trabalho**, criou um novo lugar vazio.

Portanto:

```text
empty: 4 → 5
```

É como dizer ao produtor:

> **“Já tens mais um lugar livre.”**

Finalmente:

```c
    return job_id;
}
```

Devolve o trabalho retirado.

A lógica completa do consumidor é:

```text
Há trabalho?
    ↓
SIM
    ↓
Posso mexer sozinho na fila?
    ↓
SIM
    ↓
retiro o trabalho de head
    ↓
avanço head
    ↓
liberto a fila
    ↓
aviso: "há mais um lugar vazio"
    ↓
devolvo o trabalho
```

## Veja os dois lado a lado

```text
PRODUTOR                         CONSUMIDOR

sem_wait(empty)                 sem_wait(full)
"há espaço?"                    "há trabalho?"

sem_wait(mutex)                 sem_wait(mutex)
"entro sozinho"                 "entro sozinho"

insere em tail                  retira de head

tail avança                     head avança

sem_post(mutex)                 sem_post(mutex)
"saio da fila"                  "saio da fila"

sem_post(full)                  sem_post(empty)
"há +1 trabalho"                "há +1 espaço"
```

A frase para decorar é:

> **Produtor consome um `empty` e produz um `full`.**

> **Consumidor consome um `full` e produz um `empty`.**

Essa é, para mim, a forma mais simples de reconstruir o algoritmo num exame sem decorar o código palavra por palavra.
