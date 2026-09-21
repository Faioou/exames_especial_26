#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>
#include <time.h>

#define N_ESCRITORES 3
#define M_LEITORES 6

/*
ENUNCIADO:
"duas strings de uma estrutura presente na heap"
*/
typedef struct {
    char texto1[100];
    char texto2[100];
} dados_t;

/*
Solução clássica com prioridade aos leitores.

mutex_leitores:
    protege apenas o contador numero_leitores.

acesso_dados:
    impede um escritor de escrever enquanto existirem leitores.
*/
sem_t *mutex_leitores;
sem_t *acesso_dados;

int numero_leitores = 0;

/*
ENUNCIADO:
- vários leitores podem aceder simultaneamente
- leitores têm prioridade
- cada leitor imprime strings e número de leitores ativos
*/
void *leitor(void *arg)
{
    dados_t *dados = (dados_t *)arg;
    int leitores_ativos;

    /* Entrar como leitor. */
    sem_wait(mutex_leitores);

    numero_leitores++;

    /*
    O primeiro leitor fecha o acesso aos escritores.
    Os leitores seguintes já podem juntar-se ao grupo.
    */
    if (numero_leitores == 1)
        sem_wait(acesso_dados);

    leitores_ativos = numero_leitores;

    sem_post(mutex_leitores);

    /* ENUNCIADO: aqui acontece a leitura das duas strings. */
    printf("[LEITOR] %s | %s | leitores ativos: %d\n",
           dados->texto1,
           dados->texto2,
           leitores_ativos);

    /* Sair como leitor. */
    sem_wait(mutex_leitores);

    numero_leitores--;

    /*
    O último leitor abre novamente o acesso aos escritores.
    */
    if (numero_leitores == 0)
        sem_post(acesso_dados);

    sem_post(mutex_leitores);

    return NULL;
}

/*
ENUNCIADO:
- apenas um escritor pode escrever
- só escreve quando não há leitores
- escreve ID da thread e hora atual
*/
void *escritor(void *arg)
{
    dados_t *dados = (dados_t *)arg;

    /*
    Se houver leitores, acesso_dados está ocupado.
    Se houver outro escritor, também está ocupado.
    */
    sem_wait(acesso_dados);

    snprintf(dados->texto1,
             sizeof(dados->texto1),
             "Writer %lu",
             (unsigned long)pthread_self());

    snprintf(dados->texto2,
             sizeof(dados->texto2),
             "Hora %ld",
             (long)time(NULL));

    /*
    Como o escritor só entra quando não há leitores:
    leitores ativos = 0.
    E como apenas um escritor entra de cada vez:
    escritores ativos = 1.
    */
    printf("[ESCRITOR] escritores ativos: 1 | leitores ativos: 0\n");

    sem_post(acesso_dados);

    return NULL;
}

int main(void)
{
    dados_t *dados;

    pthread_t escritores[N_ESCRITORES];
    pthread_t leitores[M_LEITORES];

    int i;

    /* ENUNCIADO: estrutura presente na heap */
    dados = malloc(sizeof(dados_t));

    if (dados == NULL)
        return 1;

    snprintf(dados->texto1, sizeof(dados->texto1), "Texto inicial 1");
    snprintf(dados->texto2, sizeof(dados->texto2), "Texto inicial 2");

    /*
    Como usamos sem_open(), são semáforos nomeados.
    Apagamos nomes antigos antes de criar uma nova execução.
    */
    sem_unlink("/mutex_leitores");
    sem_unlink("/acesso_dados");

    mutex_leitores = sem_open("/mutex_leitores",
                              O_CREAT, 0600, 1);

    acesso_dados = sem_open("/acesso_dados",
                            O_CREAT, 0600, 1);

    /*
    Criamos vários leitores e vários escritores,
    exatamente como pede o enunciado.
    */
    for (i = 0; i < M_LEITORES; i++)
        pthread_create(&leitores[i], NULL, leitor, dados);

    for (i = 0; i < N_ESCRITORES; i++)
        pthread_create(&escritores[i], NULL, escritor, dados);

    for (i = 0; i < M_LEITORES; i++)
        pthread_join(leitores[i], NULL);

    for (i = 0; i < N_ESCRITORES; i++)
        pthread_join(escritores[i], NULL);

    sem_close(mutex_leitores);
    sem_close(acesso_dados);

    sem_unlink("/mutex_leitores");
    sem_unlink("/acesso_dados");

    free(dados);

    return 0;
}
