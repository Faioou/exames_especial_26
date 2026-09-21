#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <pthread.h>

#define N_ATHLETES 300

typedef struct {
    int number;
    int event_scores[3];
    int total_time;
    float final_score;
} athlete_score;

athlete_score scores[N_ATHLETES];

pthread_mutex_t mutex;
pthread_cond_t cond_t1;
pthread_cond_t cond_t2;
int ready = 0;

int gera_num(int inicio, int fim)
{
    return inicio + rand() % (fim - inicio + 1);
}

void *T1(void *arg)
{
    int i;
    (void)arg;

    for (i = 0; i < N_ATHLETES; i++) {
        pthread_mutex_lock(&mutex);

        while (ready == 1)
            pthread_cond_wait(&cond_t1, &mutex);

        pthread_mutex_unlock(&mutex);

        scores[i].number = i + 1;
        scores[i].event_scores[0] = gera_num(0, 100);
        scores[i].event_scores[1] = gera_num(0, 100);
        scores[i].event_scores[2] = gera_num(0, 100);
        scores[i].total_time = gera_num(50, 100);

        pthread_mutex_lock(&mutex);
        ready = 1;
        pthread_cond_signal(&cond_t2);
        pthread_mutex_unlock(&mutex);
    }

    return NULL;
}

void *T2(void *arg)
{
    int i;
    (void)arg;

    for (i = 0; i < N_ATHLETES; i++) {
        pthread_mutex_lock(&mutex);

        while (ready == 0)
            pthread_cond_wait(&cond_t2, &mutex);

        pthread_mutex_unlock(&mutex);

        scores[i].final_score =
            0.30f * (scores[i].event_scores[0] +
                     scores[i].event_scores[1] +
                     scores[i].event_scores[2]) / 3.0f
            + 0.70f * scores[i].total_time;

        pthread_mutex_lock(&mutex);
        ready = 0;
        pthread_cond_signal(&cond_t1);
        pthread_mutex_unlock(&mutex);
    }

    return NULL;
}

int main(void)
{
    pthread_t t1, t2;
    int i;

    srand((unsigned int)time(NULL));

    pthread_mutex_init(&mutex, NULL);
    pthread_cond_init(&cond_t1, NULL);
    pthread_cond_init(&cond_t2, NULL);

    pthread_create(&t1, NULL, T1, NULL);
    pthread_create(&t2, NULL, T2, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    for (i = 0; i < N_ATHLETES; i++) {
        printf("Atleta %3d | swim=%3d bike=%3d run=%3d tempo=%3d | final=%.2f\n",
               scores[i].number,
               scores[i].event_scores[0],
               scores[i].event_scores[1],
               scores[i].event_scores[2],
               scores[i].total_time,
               scores[i].final_score);
    }

    pthread_cond_destroy(&cond_t2);
    pthread_cond_destroy(&cond_t1);
    pthread_mutex_destroy(&mutex);

    return 0;
}
