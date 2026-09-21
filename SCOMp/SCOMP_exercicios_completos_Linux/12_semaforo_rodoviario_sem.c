#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>
#include <unistd.h>


#define LIMITE 5
#define NR_POR_TIPO 30
#define TEMPO_PASSAGEM 1



sem_t *sem_carros; // autorizacao carros
sem_t *sem_peoes;  // autorizacao peoes
sem_t *sem_passou; // contador

void *thread_carros( void *arg){

    for(int i = 0; i < NR_POR_TIPO; i++ ){
        
        sem_wait(sem_carros);
        printf("[CARRO] Veiculo %d atravessou\n", i+1);
        
        sleep(1);
        sem_post(sem_passou);

    }
    return NULL
}

void *thread_peoes( void *arg){

    for(int i = 0; i < NR_POR_TIPO; i++ ){
        sem_wait(sem_passou);
        sem_wait(sem_carros);
        printf("[CARRO] Veiculo %d atravessou\n", i+1);
        
        sleep(1);
    }
    return NULL
}

void *thread_controladora(void *arg)
{
    // 30 carros / 5 = 6 rondas
    // e também 30 peões / 5 = 6 rondas
    for (int ronda = 0; ronda < NR_POR_TIPO / LIMITE; ronda++)
    {
        printf("\n[CONTROLADOR] VERDE PARA CARROS\n");

        // Autoriza 5 carros
        for (int i = 0; i < LIMITE; i++)
        {
            sem_post(sem_carros);
        }

        // Espera que esses 5 carros terminem
        for (int i = 0; i < LIMITE; i++)
        {
            sem_wait(sem_passou);
        }


        printf("\n[CONTROLADOR] VERDE PARA PEOES\n");

        // Autoriza 5 peões
        for (int i = 0; i < LIMITE; i++)
        {
            sem_post(sem_peoes);
        }

        // Espera que esses 5 peões terminem
        for (int i = 0; i < LIMITE; i++)
        {
            sem_wait(sem_passou);
        }
    }

    return NULL;
}