#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>

#define N_WRITERS 3
#define N_READERS 6
#define SEM_MUTEX_RC_NAME "/scomp_rw_mutex_rc"
#define SEM_DATA_NAME     "/scomp_rw_data"

typedef struct {
    char text1[64];
    char text2[64];
} shared_data_t;

int readcnt = 0;
int writer_count = 0;
sem_t *mutex_rc;
sem_t *data_access;

void *reader_sem(void *arg)
{
    shared_data_t *data = (shared_data_t *)arg;
    int readers_now;

    sem_wait(mutex_rc);
    readcnt++;
    if (readcnt == 1)
        sem_wait(data_access);
    readers_now = readcnt;
    sem_post(mutex_rc);

    printf("%s | %s | leitores ativos: %d\n",
           data->text1, data->text2, readers_now);

    sem_wait(mutex_rc);
    readcnt--;
    if (readcnt == 0)
        sem_post(data_access);
    sem_post(mutex_rc);

    return NULL;
}

void *writer_sem(void *arg)
{
    shared_data_t *data = (shared_data_t *)arg;

    sem_wait(data_access);

    writer_count++;
    snprintf(data->text1, sizeof(data->text1),
             "Writer %lu", (unsigned long)pthread_self());
    snprintf(data->text2, sizeof(data->text2),
             "Hora %ld", (long)time(NULL));

    /* Se o escritor obteve data_access, não existe nenhum leitor efetivamente a ler. */
    printf("Escritores que já escreveram: %d | leitores ativos: 0\n", writer_count);

    sem_post(data_access);
    return NULL;
}

int main(void)
{
    shared_data_t *data = malloc(sizeof(shared_data_t));
    pthread_t readers[N_READERS];
    pthread_t writers[N_WRITERS];
    int i;

    if (data == NULL) {
        perror("malloc");
        return 1;
    }

    snprintf(data->text1, sizeof(data->text1), "Sem escritor ainda");
    snprintf(data->text2, sizeof(data->text2), "Hora --");

    sem_unlink(SEM_MUTEX_RC_NAME);
    sem_unlink(SEM_DATA_NAME);

    mutex_rc = sem_open(SEM_MUTEX_RC_NAME, O_CREAT, 0600, 1);
    data_access = sem_open(SEM_DATA_NAME, O_CREAT, 0600, 1);

    if (mutex_rc == SEM_FAILED || data_access == SEM_FAILED) {
        perror("sem_open");
        free(data);
        return 1;
    }

    for (i = 0; i < N_READERS; i++)
        pthread_create(&readers[i], NULL, reader_sem, data);
    for (i = 0; i < N_WRITERS; i++)
        pthread_create(&writers[i], NULL, writer_sem, data);

    for (i = 0; i < N_READERS; i++)
        pthread_join(readers[i], NULL);
    for (i = 0; i < N_WRITERS; i++)
        pthread_join(writers[i], NULL);

    sem_close(mutex_rc);
    sem_close(data_access);
    sem_unlink(SEM_MUTEX_RC_NAME);
    sem_unlink(SEM_DATA_NAME);
    free(data);

    return 0;
}
