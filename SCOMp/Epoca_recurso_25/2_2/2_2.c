#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

#define CARROS 0
#define PEOES 1

#define NUM_ENTIDADES 30
#define LIMITE_PASSAGENS 5
#define TOTAL_ENTIDADES 60


typedef struct {

    /* Quem tem verde neste momento */
    int verde_para;

    /* Quantos passaram neste período de verde */
    int passagens;

    /* Quantos já atravessaram no total */
    int total;

    pthread_mutex_t mutex;

    /* Carros esperam aqui */
    pthread_cond_t cond_carros;

    /* Peões esperam aqui */
    pthread_cond_t cond_peoes;

    /* Controlador espera aqui até passarem 5 */
    pthread_cond_t cond_controlador;

} semaforo_t;


/* =========================================================
   THREAD DOS CARROS
   ========================================================= */

void *gerador_carros(void *arg)
{
    semaforo_t *s = (semaforo_t *)arg;

    int i;

    for (i = 1; i <= NUM_ENTIDADES; i++) {

        pthread_mutex_lock(&s->mutex);

        /*
         * O carro só pode avançar:
         *
         * - se estiver verde para carros
         * - e ainda não tiverem passado 5 carros
         */
        if (s->verde_para != CARROS ||
            s->passagens == LIMITE_PASSAGENS) {

            printf("[CARRO] Veículo %d a aguardar\n", i);
        }

        while (s->verde_para != CARROS ||
               s->passagens == LIMITE_PASSAGENS) {

            pthread_cond_wait(&s->cond_carros,
                              &s->mutex);
        }

        pthread_mutex_unlock(&s->mutex);


        /*
         * A passagem demora 1 segundo.
         */
        sleep(1);

        printf("[CARRO] Veículo %d atravessou\n", i);


        /*
         * Registar que mais um carro passou.
         */
        pthread_mutex_lock(&s->mutex);

        s->passagens++;
        s->total++;


        /*
         * Se já passaram 5, acordar o controlador.
         */
        if (s->passagens == LIMITE_PASSAGENS) {

            pthread_cond_signal(
                &s->cond_controlador
            );
        }

        pthread_mutex_unlock(&s->mutex);
    }

    return NULL;
}


/* =========================================================
   THREAD DOS PEÕES
   ========================================================= */

void *gerador_peoes(void *arg)
{
    semaforo_t *s = (semaforo_t *)arg;

    int i;

    for (i = 1; i <= NUM_ENTIDADES; i++) {

        pthread_mutex_lock(&s->mutex);

        /*
         * O peão só pode avançar:
         *
         * - se estiver verde para peões
         * - e ainda não tiverem passado 5 peões
         */
        if (s->verde_para != PEOES ||
            s->passagens == LIMITE_PASSAGENS) {

            printf("[PEÃO] Peão %d a aguardar\n", i);
        }

        while (s->verde_para != PEOES ||
               s->passagens == LIMITE_PASSAGENS) {

            pthread_cond_wait(&s->cond_peoes,
                              &s->mutex);
        }

        pthread_mutex_unlock(&s->mutex);


        /*
         * A passagem demora 1 segundo.
         */
        sleep(1);

        printf("[PEÃO] Peão %d atravessou\n", i);


        /*
         * Registar a passagem.
         */
        pthread_mutex_lock(&s->mutex);

        s->passagens++;
        s->total++;


        /*
         * Depois de 5 passagens,
         * acordar o controlador.
         */
        if (s->passagens == LIMITE_PASSAGENS) {

            pthread_cond_signal(
                &s->cond_controlador
            );
        }

        pthread_mutex_unlock(&s->mutex);
    }

    return NULL;
}


/* =========================================================
   THREAD CONTROLADORA DO SEMÁFORO
   ========================================================= */

void *controlador(void *arg)
{
    semaforo_t *s = (semaforo_t *)arg;

    while (1) {

        pthread_mutex_lock(&s->mutex);


        /*
         * Esperar até terem passado 5 entidades.
         */
        while (s->passagens < LIMITE_PASSAGENS &&
               s->total < TOTAL_ENTIDADES) {

            pthread_cond_wait(
                &s->cond_controlador,
                &s->mutex
            );
        }


        /*
         * Os 60 já atravessaram:
         * 30 carros + 30 peões.
         */
        if (s->total == TOTAL_ENTIDADES) {

            pthread_mutex_unlock(&s->mutex);

            break;
        }


        /*
         * Começar nova fase.
         */
        s->passagens = 0;


        /*
         * Alterar o semáforo.
         */
        if (s->verde_para == CARROS) {

            s->verde_para = PEOES;

            printf("[SEMAFORO] Mudança para peões\n");

            /*
             * Acordar a thread dos peões.
             */
            pthread_cond_signal(
                &s->cond_peoes
            );

        } else {

            s->verde_para = CARROS;

            printf("[SEMAFORO] Mudança para carros\n");

            /*
             * Acordar a thread dos carros.
             */
            pthread_cond_signal(
                &s->cond_carros
            );
        }


        pthread_mutex_unlock(&s->mutex);
    }

    return NULL;
}


/* =========================================================
   MAIN
   ========================================================= */

int main(void)
{
    pthread_t thread_carros;
    pthread_t thread_peoes;
    pthread_t thread_controlador;

    semaforo_t semaforo;


    /*
     * Inicialmente verde para carros.
     */
    semaforo.verde_para = CARROS;

    semaforo.passagens = 0;
    semaforo.total = 0;


    /*
     * Inicializar mutex.
     */
    pthread_mutex_init(
        &semaforo.mutex,
        NULL
    );


    /*
     * Inicializar variáveis de condição.
     */
    pthread_cond_init(
        &semaforo.cond_carros,
        NULL
    );

    pthread_cond_init(
        &semaforo.cond_peoes,
        NULL
    );

    pthread_cond_init(
        &semaforo.cond_controlador,
        NULL
    );


    /*
     * Criar as três threads.
     */
    pthread_create(
        &thread_carros,
        NULL,
        gerador_carros,
        &semaforo
    );

    pthread_create(
        &thread_peoes,
        NULL,
        gerador_peoes,
        &semaforo
    );

    pthread_create(
        &thread_controlador,
        NULL,
        controlador,
        &semaforo
    );


    /*
     * Esperar que todas terminem.
     */
    pthread_join(thread_carros, NULL);
    pthread_join(thread_peoes, NULL);
    pthread_join(thread_controlador, NULL);


    /*
     * Libertar os objetos de sincronização.
     */
    pthread_cond_destroy(
        &semaforo.cond_carros
    );

    pthread_cond_destroy(
        &semaforo.cond_peoes
    );

    pthread_cond_destroy(
        &semaforo.cond_controlador
    );

    pthread_mutex_destroy(
        &semaforo.mutex
    );


    return 0;
}