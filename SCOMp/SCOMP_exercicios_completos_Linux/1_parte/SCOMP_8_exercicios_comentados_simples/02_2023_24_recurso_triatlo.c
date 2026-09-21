#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>

#define NUM_ATLETAS 300

/*
ENUNCIADO:
é dada esta estrutura para guardar os dados de cada atleta.
*/
typedef struct {
    int number;
    int event_scores[3];
    int total_time;
    float final_score;
} athlete_score;

athlete_score scores[NUM_ATLETAS];

/*
ENUNCIADO:
"apenas 2 threads (T1 e T2)"
"sincronizam através de mutexes e variáveis de condição"
*/
pthread_mutex_t mutex;
pthread_cond_t cond_t1;
pthread_cond_t cond_t2;

/*
A lógica mais direta para garantir a alternância pedida:
ready = 0 -> T1 ainda pode produzir os dados do próximo atleta
ready = 1 -> T1 já produziu; T2 tem de calcular antes de T1 continuar
*/
int ready = 0;

/*
O enunciado diz que esta função pode ser assumida como existente.
Incluímo-la apenas para o programa correr sozinho.
*/
int gera_num(int inicio, int fim)
{
    return inicio + rand() % (fim - inicio + 1);
}

/*
ENUNCIADO:
T1 gera:
- três pontuações entre 0 e 100
- total_time entre 50 e 100
- depois sinaliza T2
*/
void *T1(void *arg)
{
    int i;

    for (i = 0; i < NUM_ATLETAS; i++) {

        pthread_mutex_lock(&mutex);

        /*
        ENUNCIADO: T1 não pode gerar o atleta seguinte
        antes de T2 terminar o atleta atual.
        */
        while (ready == 1)
            pthread_cond_wait(&cond_t1, &mutex);

        pthread_mutex_unlock(&mutex);

        scores[i].number = i + 1;
        scores[i].event_scores[0] = gera_num(0, 100);
        scores[i].event_scores[1] = gera_num(0, 100);
        scores[i].event_scores[2] = gera_num(0, 100);
        scores[i].total_time = gera_num(50, 100);

        pthread_mutex_lock(&mutex);

        /* Os dados deste atleta estão prontos para T2. */
        ready = 1;
        pthread_cond_signal(&cond_t2);

        pthread_mutex_unlock(&mutex);
    }

    return NULL;
}

/*
ENUNCIADO:
T2 preenche final_score usando a fórmula indicada.
*/
void *T2(void *arg)
{
    int i;

    for (i = 0; i < NUM_ATLETAS; i++) {

        pthread_mutex_lock(&mutex);

        /* Se T1 ainda não produziu este atleta, T2 espera. */
        while (ready == 0)
            pthread_cond_wait(&cond_t2, &mutex);

        pthread_mutex_unlock(&mutex);

        scores[i].final_score =
            0.30f *
            ((scores[i].event_scores[0] +
              scores[i].event_scores[1] +
              scores[i].event_scores[2]) / 3.0f)
            +
            0.70f * scores[i].total_time;

        pthread_mutex_lock(&mutex);

        /*
        ENUNCIADO: só agora T1 pode avançar
        para o próximo atleta.
        */
        ready = 0;
        pthread_cond_signal(&cond_t1);

        pthread_mutex_unlock(&mutex);
    }

    return NULL;
}

int main(void)
{
    pthread_t t1;
    pthread_t t2;
    int i;

    srand((unsigned int)time(NULL));

    pthread_mutex_init(&mutex, NULL);
    pthread_cond_init(&cond_t1, NULL);
    pthread_cond_init(&cond_t2, NULL);

    /* ENUNCIADO: criar apenas as duas threads T1 e T2 */
    pthread_create(&t1, NULL, T1, NULL);
    pthread_create(&t2, NULL, T2, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    /* ENUNCIADO: no final a thread principal imprime os resultados */
    for (i = 0; i < NUM_ATLETAS; i++) {
        printf("Atleta %d -> pontuacao final = %.2f\n",
               scores[i].number,
               scores[i].final_score);
    }

    /* ENUNCIADO: remover mutexes e variáveis de condição */
    pthread_cond_destroy(&cond_t1);
    pthread_cond_destroy(&cond_t2);
    pthread_mutex_destroy(&mutex);

    return 0;
}
