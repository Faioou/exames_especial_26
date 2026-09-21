#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <pthread.h>

/* "Haverá N escritores e M leitores (M e N podem ser estáticos)" */
#define N_WRITERS 3
#define N_READERS 6


/* "ler duas strings de uma estrutura presente na heap" */
typedef struct {
    char text1[64];
    char text2[64];
} shared_data_t;


/* Sincronização do acesso à memória partilhada */
pthread_mutex_t mutex;
pthread_cond_t can_read;
pthread_cond_t can_write;


/* "contagem atual de leitores ativos" */
int active_readers = 0;

/* Necessário para dar "prioridade [aos leitores] sobre os escritores" */
int waiting_readers = 0;

/* "Apenas um escritor pode aceder [...] em qualquer momento" */
int writer_active = 0;

/* "Cada escritor imprime a contagem de escritores" */
int writer_count = 0;


/* "leitor – responsável por ler duas strings" */
void *reader(void *arg)
{
    shared_data_t *data = (shared_data_t *)arg;
    int readers_now;

    pthread_mutex_lock(&mutex);

    /* "Os leitores têm prioridade sobre os escritores" */
    waiting_readers++;

    /* leitor não pode ler enquanto houver escritor ativo */
    while (writer_active)
        pthread_cond_wait(&can_read, &mutex);

    waiting_readers--;

    /* "vários leitores [podem aceder] simultaneamente" */
    active_readers++;
    readers_now = active_readers;

    pthread_mutex_unlock(&mutex);


    /* "imprimir as strings lidas [...] e leitores ativos" */
    printf("%s | %s | leitores ativos: %d\n",
           data->text1, data->text2, readers_now);


    pthread_mutex_lock(&mutex);

    active_readers--;

    /* escritor só pode avançar quando "não há leitores ativos" */
    if (active_readers == 0)
        pthread_cond_signal(&can_write);

    pthread_mutex_unlock(&mutex);

    return NULL;
}


/* "escritor – responsável por escrever na área de memória partilhada" */
void *writer(void *arg)
{
    shared_data_t *data = (shared_data_t *)arg;
    int my_count;

    pthread_mutex_lock(&mutex);


    /*
       "só podem aceder [...] quando não há leitores ativos"
       "Apenas um escritor [...] em qualquer momento"
       "Os leitores têm prioridade sobre os escritores"
    */
    while (active_readers > 0 ||
           writer_active ||
           waiting_readers > 0)

        pthread_cond_wait(&can_write, &mutex);


    /* "Apenas um escritor pode aceder [...] em qualquer momento" */
    writer_active = 1;

    /* "contagem de escritores" */
    writer_count++;
    my_count = writer_count;

    pthread_mutex_unlock(&mutex);


    /* "Escreve o ID da thread e a hora atual" */
    snprintf(data->text1, sizeof(data->text1),
             "Writer %lu",
             (unsigned long)pthread_self());

    snprintf(data->text2, sizeof(data->text2),
             "Hora %ld",
             (long)time(NULL));


    /* "contagem de escritores [...] e contagem de leitores ativos" */
    printf("Escritores que já escreveram: %d | leitores ativos: 0\n",
           my_count);


    pthread_mutex_lock(&mutex);

    writer_active = 0;


    /* "Os leitores têm prioridade sobre os escritores" */
    if (waiting_readers > 0)
        pthread_cond_broadcast(&can_read);
    else
        pthread_cond_signal(&can_write);


    pthread_mutex_unlock(&mutex);

    return NULL;
}


int main(void)
{
    /*
       "estrutura presente na heap"
       malloc coloca a estrutura na heap.
    */
    shared_data_t *data = malloc(sizeof(shared_data_t));

    /* "N escritores e M leitores" */
    pthread_t readers[N_READERS];
    pthread_t writers[N_WRITERS];

    int i;


    if (data == NULL) {
        perror("malloc");
        return 1;
    }


    /* Valores iniciais da memória partilhada */
    snprintf(data->text1, sizeof(data->text1),
             "Sem escritor ainda");

    snprintf(data->text2, sizeof(data->text2),
             "Hora --");


    /* Inicialização da sincronização */
    pthread_mutex_init(&mutex, NULL);
    pthread_cond_init(&can_read, NULL);
    pthread_cond_init(&can_write, NULL);


    /* "múltiplos leitores" */
    for (i = 0; i < N_READERS; i++)
        pthread_create(&readers[i], NULL, reader, data);


    /* "múltiplos escritores" */
    for (i = 0; i < N_WRITERS; i++)
        pthread_create(&writers[i], NULL, writer, data);


    /* Espera que todos os leitores terminem */
    for (i = 0; i < N_READERS; i++)
        pthread_join(readers[i], NULL);


    /* Espera que todos os escritores terminem */
    for (i = 0; i < N_WRITERS; i++)
        pthread_join(writers[i], NULL);


    pthread_cond_destroy(&can_write);
    pthread_cond_destroy(&can_read);
    pthread_mutex_destroy(&mutex);

    /* Libertação da estrutura criada na heap */
    free(data);

    return 0;
}