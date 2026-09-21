#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

#define CARROS 0
#define PEOES 1
#define NUM_ENTIDADES 30
#define LIMITE 5
#define TOTAL 60

typedef struct {
    int verde_para;
    int passagens;
    int total;
    pthread_mutex_t mutex;
    pthread_cond_t carros;
    pthread_cond_t peoes;
    pthread_cond_t controlador;
} semaforo_t;

void *gerador_carros(void *arg)
{
    semaforo_t *s = (semaforo_t *)arg;
    int i;

    for (i = 1; i <= NUM_ENTIDADES; i++) {
        printf("[CARRO] Veículo %d a aguardar\n", i);

        pthread_mutex_lock(&s->mutex);

        while (s->verde_para != CARROS || s->passagens == LIMITE)
            pthread_cond_wait(&s->carros, &s->mutex);

        pthread_mutex_unlock(&s->mutex);

        sleep(1);
        printf("[CARRO] Veículo %d atravessou\n", i);

        pthread_mutex_lock(&s->mutex);
        s->passagens++;
        s->total++;

        if (s->passagens == LIMITE)
            pthread_cond_signal(&s->controlador);

        pthread_mutex_unlock(&s->mutex);
    }

    return NULL;
}

void *gerador_peoes(void *arg)
{
    semaforo_t *s = (semaforo_t *)arg;
    int i;

    for (i = 1; i <= NUM_ENTIDADES; i++) {
        printf("[PEÃO] Peão %d a aguardar\n", i);

        pthread_mutex_lock(&s->mutex);

        while (s->verde_para != PEOES || s->passagens == LIMITE)
            pthread_cond_wait(&s->peoes, &s->mutex);

        pthread_mutex_unlock(&s->mutex);

        sleep(1);
        printf("[PEÃO] Peão %d atravessou\n", i);

        pthread_mutex_lock(&s->mutex);
        s->passagens++;
        s->total++;

        if (s->passagens == LIMITE)
            pthread_cond_signal(&s->controlador);

        pthread_mutex_unlock(&s->mutex);
    }

    return NULL;
}

void *controlador(void *arg)
{
    semaforo_t *s = (semaforo_t *)arg;
    int finished = 0;

    printf("[SEMAFORO] Inicialmente verde para carros\n");

    while (!finished) {
        pthread_mutex_lock(&s->mutex);

        while (s->passagens < LIMITE && s->total < TOTAL)
            pthread_cond_wait(&s->controlador, &s->mutex);

        finished = (s->total == TOTAL);

        if (!finished) {
            s->passagens = 0;

            if (s->verde_para == CARROS) {
                s->verde_para = PEOES;
                printf("[SEMAFORO] Mudança para peões\n");
                pthread_cond_signal(&s->peoes);
            } else {
                s->verde_para = CARROS;
                printf("[SEMAFORO] Mudança para carros\n");
                pthread_cond_signal(&s->carros);
            }
        }

        pthread_mutex_unlock(&s->mutex);
    }

    return NULL;
}

int main(void)
{
    semaforo_t s = {0};
    pthread_t carros, peoes, ctrl;

    s.verde_para = CARROS;
    s.passagens = 0;
    s.total = 0;

    pthread_mutex_init(&s.mutex, NULL);
    pthread_cond_init(&s.carros, NULL);
    pthread_cond_init(&s.peoes, NULL);
    pthread_cond_init(&s.controlador, NULL);

    pthread_create(&ctrl, NULL, controlador, &s);
    pthread_create(&carros, NULL, gerador_carros, &s);
    pthread_create(&peoes, NULL, gerador_peoes, &s);

    pthread_join(carros, NULL);
    pthread_join(peoes, NULL);
    pthread_join(ctrl, NULL);

    pthread_cond_destroy(&s.controlador);
    pthread_cond_destroy(&s.peoes);
    pthread_cond_destroy(&s.carros);
    pthread_mutex_destroy(&s.mutex);

    return 0;
}
