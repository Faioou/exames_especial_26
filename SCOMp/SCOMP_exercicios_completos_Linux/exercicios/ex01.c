/*

#include <stdio.h>
#include <pthread.h>


void *minha_thread(void *arg)
{
    printf("Ola, sou a thread!\n");

    return NULL;
}


int main()
{
    pthread_t thread;

    printf("MAIN: vou criar a thread\n");

    pthread_create(&thread, NULL, minha_thread, NULL); // variavel que vai guardar a thread / nao interssa / funcao / argumentos

    pthread_join(thread, NULL); // espera ate a thread identificada pela variavel thread terminar ou seja, a thread minha_thread / não quero receber o que retorna a thread

    printf("MAIN: a thread terminou\n");

    return 0;
}


*/


#include <stdio.h>
#include <pthread.h>

void *minha_thread(void *arg){
    printf("Olá eu sou a thread\n" );
    return NULL;
}

int main(){
    pthread_t thread;
    printf("MAIN: vou criar a thread\n");

    pthread_create(&thread, NULL, minha_thread, NULL);

    pthread_join(thread, NULL);

    printf("MAIN: a thread terminou\n");


    return 0;
}