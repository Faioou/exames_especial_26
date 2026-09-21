#include <pthread.h>

#define BUFFER_SIZE 10

typedef struct {
    int jobs[BUFFER_SIZE];
    int head;
    int tail;
    int count;
    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;
} print_queue_t;


/* "inserir trabalhos numa fila circular com capacidade limitada" */
void submit_job(print_queue_t *queue, int job_id)
{
    /* "sincronização ... com mutexes" */
    pthread_mutex_lock(&queue->mutex);

    /* "caso a fila esteja cheia, o produtor deve bloquear" */
    while (queue->count == BUFFER_SIZE)
        pthread_cond_wait(&queue->not_full, &queue->mutex);

    /* "inserir trabalhos numa fila circular" */
    queue->jobs[queue->tail] = job_id;
    queue->tail = (queue->tail + 1) % BUFFER_SIZE;
    queue->count++;

    /* existe agora "pelo menos um trabalho disponível" */
    pthread_cond_signal(&queue->not_empty);

    pthread_mutex_unlock(&queue->mutex);
}


/* "As impressoras devem remover trabalhos da fila" */
int get_job(print_queue_t *queue)
{
    int job_id;

    /* "sincronização ... com mutexes" */
    pthread_mutex_lock(&queue->mutex);

    /* "caso a fila esteja vazia, a impressora deve bloquear" */
    while (queue->count == 0)
        pthread_cond_wait(&queue->not_empty, &queue->mutex);

    /* "remover trabalhos da fila" */
    job_id = queue->jobs[queue->head];
    queue->head = (queue->head + 1) % BUFFER_SIZE;
    queue->count--;

    /* passou a existir "espaço disponível" */
    pthread_cond_signal(&queue->not_full);

    pthread_mutex_unlock(&queue->mutex);

    return job_id;
}