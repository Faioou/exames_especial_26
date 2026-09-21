#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>

#define N_ATHLETES 300
#define SEM_T1_NAME "/scomp_tri_t1"
#define SEM_T2_NAME "/scomp_tri_t2"

typedef struct {
    int number;
    int event_scores[3];
    int total_time;
    float final_score;
} athlete_score;

athlete_score scores[N_ATHLETES];
sem_t *turn_t1;
sem_t *turn_t2;

int gera_num(int inicio, int fim)
{
    return inicio + rand() % (fim - inicio + 1);
}

void *T1_sem(void *arg)
{
    int i;
    (void)arg;

    for (i = 0; i < N_ATHLETES; i++) {
        sem_wait(turn_t1);

        scores[i].number = i + 1;
        scores[i].event_scores[0] = gera_num(0, 100);
        scores[i].event_scores[1] = gera_num(0, 100);
        scores[i].event_scores[2] = gera_num(0, 100);
        scores[i].total_time = gera_num(50, 100);

        sem_post(turn_t2);
    }

    return NULL;
}

void *T2_sem(void *arg)
{
    int i;
    (void)arg;

    for (i = 0; i < N_ATHLETES; i++) {
        sem_wait(turn_t2);

        scores[i].final_score =
            0.30f * (scores[i].event_scores[0] +
                     scores[i].event_scores[1] +
                     scores[i].event_scores[2]) / 3.0f
            + 0.70f * scores[i].total_time;

        sem_post(turn_t1);
    }

    return NULL;
}

int main(void)
{
    pthread_t t1, t2;
    int i;

    srand((unsigned int)time(NULL));

    sem_unlink(SEM_T1_NAME);
    sem_unlink(SEM_T2_NAME);

    turn_t1 = sem_open(SEM_T1_NAME, O_CREAT, 0600, 1);
    turn_t2 = sem_open(SEM_T2_NAME, O_CREAT, 0600, 0);

    if (turn_t1 == SEM_FAILED || turn_t2 == SEM_FAILED) {
        perror("sem_open");
        return 1;
    }

    pthread_create(&t1, NULL, T1_sem, NULL);
    pthread_create(&t2, NULL, T2_sem, NULL);

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

    sem_close(turn_t1);
    sem_close(turn_t2);
    sem_unlink(SEM_T1_NAME);
    sem_unlink(SEM_T2_NAME);

    return 0;
}
