#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>

#define BUFFER_SIZE 10
#define NUM_PRODUCERS 5
#define NUM_CONSUMERS 3
#define JOBS_PER_PRODUCER 6
#define JOBS_PER_CONSUMER 10

#define SEM_MUTEX_NAME "/scomp_print_mutex"
#define SEM_EMPTY_NAME "/scomp_print_empty"
#define SEM_FULL_NAME  "/scomp_print_full"

typedef struct {
    int jobs[BUFFER_SIZE];
    int head;
    int tail;
    sem_t *mutex;
    sem_t *empty;
    sem_t *full;
} print_queue_sem_t;

typedef struct {
    print_queue_sem_t *queue;
    int producer_id;
} producer_arg_t;

typedef struct {
    print_queue_sem_t *queue;
    int consumer_id;
} consumer_arg_t;

void submit_job_sem(print_queue_sem_t *queue, int job_id)
{
    sem_wait(queue->empty);
    sem_wait(queue->mutex);

    queue->jobs[queue->tail] = job_id;
    queue->tail = (queue->tail + 1) % BUFFER_SIZE;

    sem_post(queue->mutex);
    sem_post(queue->full);
}

int get_job_sem(print_queue_sem_t *queue)
{
    int job_id;

    sem_wait(queue->full);
    sem_wait(queue->mutex);

    job_id = queue->jobs[queue->head];
    queue->head = (queue->head + 1) % BUFFER_SIZE;

    sem_post(queue->mutex);
    sem_post(queue->empty);

    return job_id;
}

void *producer(void *arg)
{
    producer_arg_t *a = (producer_arg_t *)arg;
    int i;

    for (i = 1; i <= JOBS_PER_PRODUCER; i++) {
        int job_id = a->producer_id * 100 + i;
        submit_job_sem(a->queue, job_id);
        printf("[PRODUTOR %d] submeteu trabalho %d\n", a->producer_id, job_id);
    }
    return NULL;
}

void *consumer(void *arg)
{
    consumer_arg_t *a = (consumer_arg_t *)arg;
    int i;

    for (i = 0; i < JOBS_PER_CONSUMER; i++) {
        int job_id = get_job_sem(a->queue);
        printf("[IMPRESSORA %d] retirou trabalho %d\n", a->consumer_id, job_id);
    }
    return NULL;
}

int main(void)
{
    print_queue_sem_t queue = {0};
    pthread_t producers[NUM_PRODUCERS];
    pthread_t consumers[NUM_CONSUMERS];
    producer_arg_t pargs[NUM_PRODUCERS];
    consumer_arg_t cargs[NUM_CONSUMERS];
    int i;

    sem_unlink(SEM_MUTEX_NAME);
    sem_unlink(SEM_EMPTY_NAME);
    sem_unlink(SEM_FULL_NAME);

    queue.mutex = sem_open(SEM_MUTEX_NAME, O_CREAT, 0600, 1);
    queue.empty = sem_open(SEM_EMPTY_NAME, O_CREAT, 0600, BUFFER_SIZE);
    queue.full  = sem_open(SEM_FULL_NAME,  O_CREAT, 0600, 0);

    if (queue.mutex == SEM_FAILED || queue.empty == SEM_FAILED || queue.full == SEM_FAILED) {
        perror("sem_open");
        return 1;
    }

    for (i = 0; i < NUM_CONSUMERS; i++) {
        cargs[i].queue = &queue;
        cargs[i].consumer_id = i + 1;
        pthread_create(&consumers[i], NULL, consumer, &cargs[i]);
    }

    for (i = 0; i < NUM_PRODUCERS; i++) {
        pargs[i].queue = &queue;
        pargs[i].producer_id = i + 1;
        pthread_create(&producers[i], NULL, producer, &pargs[i]);
    }

    for (i = 0; i < NUM_PRODUCERS; i++)
        pthread_join(producers[i], NULL);
    for (i = 0; i < NUM_CONSUMERS; i++)
        pthread_join(consumers[i], NULL);

    sem_close(queue.mutex);
    sem_close(queue.empty);
    sem_close(queue.full);
    sem_unlink(SEM_MUTEX_NAME);
    sem_unlink(SEM_EMPTY_NAME);
    sem_unlink(SEM_FULL_NAME);

    return 0;
}
