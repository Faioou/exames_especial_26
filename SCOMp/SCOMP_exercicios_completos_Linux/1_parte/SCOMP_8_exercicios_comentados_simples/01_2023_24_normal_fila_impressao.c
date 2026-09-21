#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

#define TAMANHO_FILA 4
#define NUM_CLIENTES 5
#define NUM_IMPRESSORAS 3

/*
ENUNCIADO:
- "estrutura de dados para representar um trabalho de impressão"
- fila limitada a 4 trabalhos
*/
typedef struct {
    int cliente;
    int numero;
} trabalho_t;

/*
ENUNCIADO:
- fila de impressão com tamanho máximo de 4
- acesso protegido por mutex
- cliente bloqueia se cheia
- impressora bloqueia se vazia
*/
typedef struct {
    trabalho_t trabalhos[TAMANHO_FILA];

    int head;   /* próxima posição a retirar */
    int tail;   /* próxima posição a inserir */
    int count;  /* quantos trabalhos estão na fila */

    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;
} fila_t;

fila_t fila;

/*
ENUNCIADO:
"função que adiciona trabalhos à fila (threads cliente)"
*/
void adicionar_trabalho(fila_t *f, trabalho_t trabalho)
{
    pthread_mutex_lock(&f->mutex);

    /* ENUNCIADO: cliente bloqueia se a fila estiver cheia */
    while (f->count == TAMANHO_FILA)
        pthread_cond_wait(&f->not_full, &f->mutex);

    f->trabalhos[f->tail] = trabalho;
    f->tail = (f->tail + 1) % TAMANHO_FILA;
    f->count++;

    /* Agora existe pelo menos um trabalho para uma impressora. */
    pthread_cond_signal(&f->not_empty);

    pthread_mutex_unlock(&f->mutex);
}

/*
ENUNCIADO:
"função que remove trabalhos da fila (threads impressora)"
*/
trabalho_t retirar_trabalho(fila_t *f)
{
    trabalho_t trabalho;

    pthread_mutex_lock(&f->mutex);

    /* ENUNCIADO: impressora bloqueia se a fila estiver vazia */
    while (f->count == 0)
        pthread_cond_wait(&f->not_empty, &f->mutex);

    trabalho = f->trabalhos[f->head];
    f->head = (f->head + 1) % TAMANHO_FILA;
    f->count--;

    /* Agora existe pelo menos um espaço livre para um cliente. */
    pthread_cond_signal(&f->not_full);

    pthread_mutex_unlock(&f->mutex);

    return trabalho;
}

/*
ENUNCIADO:
- criar 5 threads cliente
- cada cliente adiciona 1 trabalho a cada 2 segundos
- nunca termina
*/
void *cliente(void *arg)
{
    int id = *(int *)arg;
    int numero = 1;

    while (1) {
        trabalho_t trabalho;

        sleep(2);

        trabalho.cliente = id;
        trabalho.numero = numero;

        adicionar_trabalho(&fila, trabalho);

        printf("[CLIENTE %d] adicionou trabalho %d\n",
               id, numero);

        numero++;
    }

    return NULL;
}

/*
ENUNCIADO:
- criar 3 threads impressora
- demora 5 segundos a processar um trabalho
- nunca termina
*/
void *impressora(void *arg)
{
    int id = *(int *)arg;

    while (1) {
        trabalho_t trabalho;

        trabalho = retirar_trabalho(&fila);

        printf("[IMPRESSORA %d] a processar trabalho %d do cliente %d\n",
               id, trabalho.numero, trabalho.cliente);

        sleep(5);

        printf("[IMPRESSORA %d] terminou trabalho %d do cliente %d\n",
               id, trabalho.numero, trabalho.cliente);
    }

    return NULL;
}

int main(void)
{
    pthread_t clientes[NUM_CLIENTES];
    pthread_t impressoras[NUM_IMPRESSORAS];

    int ids_clientes[NUM_CLIENTES];
    int ids_impressoras[NUM_IMPRESSORAS];
    int i;

    fila.head = 0;
    fila.tail = 0;
    fila.count = 0;

    pthread_mutex_init(&fila.mutex, NULL);
    pthread_cond_init(&fila.not_full, NULL);
    pthread_cond_init(&fila.not_empty, NULL);

    /* ENUNCIADO: 5 threads cliente */
    for (i = 0; i < NUM_CLIENTES; i++) {
        ids_clientes[i] = i + 1;
        pthread_create(&clientes[i], NULL,
                       cliente, &ids_clientes[i]);
    }

    /* ENUNCIADO: 3 threads impressora */
    for (i = 0; i < NUM_IMPRESSORAS; i++) {
        ids_impressoras[i] = i + 1;
        pthread_create(&impressoras[i], NULL,
                       impressora, &ids_impressoras[i]);
    }

    /*
    O enunciado diz que clientes e impressoras nunca terminam.
    Por isso o programa fica aqui à espera.
    Termine com Ctrl+C.
    */
    for (i = 0; i < NUM_CLIENTES; i++)
        pthread_join(clientes[i], NULL);

    for (i = 0; i < NUM_IMPRESSORAS; i++)
        pthread_join(impressoras[i], NULL);

    return 0;
}
