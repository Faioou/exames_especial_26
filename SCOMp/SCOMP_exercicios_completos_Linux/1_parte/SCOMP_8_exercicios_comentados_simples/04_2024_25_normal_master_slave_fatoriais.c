#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

#define N_SLAVES 3

/*
Para preservar a ordem pedida pelo enunciado,
cada trabalho leva:
- a posição original do número
- o próprio número
*/
typedef struct {
    int posicao;
    int numero;
} trabalho_t;

/*
Cada slave devolve:
- a posição original
- o fatorial calculado
*/
typedef struct {
    int posicao;
    unsigned long long fatorial;
} resultado_t;

unsigned long long calcula_fatorial(int n)
{
    unsigned long long resultado = 1;
    int i;

    for (i = 2; i <= n; i++)
        resultado = resultado * (unsigned long long)i;

    return resultado;
}

int main(void)
{
    int master_para_slave[N_SLAVES][2];
    int slave_para_master[N_SLAVES][2];

    pid_t filhos[N_SLAVES];

    int M;
    int *numeros;
    unsigned long long *resultados;

    int i;
    int s;

    /*
    ENUNCIADO:
    "ler do stdin uma sequência de M números inteiros não negativos"
    */
    printf("Quantos numeros (M)? ");
    scanf("%d", &M);

    numeros = malloc(M * sizeof(int));
    resultados = malloc(M * sizeof(unsigned long long));

    if (numeros == NULL || resultados == NULL)
        return 1;

    for (i = 0; i < M; i++)
        scanf("%d", &numeros[i]);

    /*
    ENUNCIADO:
    processos e pipes, com um número fixo de N slaves.

    Usamos um pipe para enviar trabalho a cada slave
    e outro para receber o resultado desse slave.
    */
    for (s = 0; s < N_SLAVES; s++) {
        pipe(master_para_slave[s]);
        pipe(slave_para_master[s]);
    }

    /*
    ENUNCIADO:
    criar o número adequado de processos slave.
    */
    for (s = 0; s < N_SLAVES; s++) {
        filhos[s] = fork();

        if (filhos[s] == 0) {
            trabalho_t trabalho;
            resultado_t resultado;
            int j;

            /*
            O slave só precisa:
            - ler do seu master_para_slave[s]
            - escrever no seu slave_para_master[s]
            */
            for (j = 0; j < N_SLAVES; j++) {
                close(master_para_slave[j][1]);
                close(slave_para_master[j][0]);

                if (j != s) {
                    close(master_para_slave[j][0]);
                    close(slave_para_master[j][1]);
                }
            }

            /*
            Enquanto o master enviar trabalhos,
            este slave calcula os fatoriais.
            O read termina quando o master fecha a escrita do pipe.
            */
            while (read(master_para_slave[s][0],
                        &trabalho,
                        sizeof(trabalho)) > 0) {

                resultado.posicao = trabalho.posicao;
                resultado.fatorial =
                    calcula_fatorial(trabalho.numero);

                write(slave_para_master[s][1],
                      &resultado,
                      sizeof(resultado));
            }

            close(master_para_slave[s][0]);
            close(slave_para_master[s][1]);

            exit(0);
        }
    }

    /*
    No master:
    - só escrevemos nos pipes master_para_slave
    - só lemos dos pipes slave_para_master
    */
    for (s = 0; s < N_SLAVES; s++) {
        close(master_para_slave[s][0]);
        close(slave_para_master[s][1]);
    }

    /*
    ENUNCIADO:
    "distribuí-los por N processos slave"

    Forma simples e visível:
    número 0 -> slave 0
    número 1 -> slave 1
    número 2 -> slave 2
    número 3 -> slave 0
    ...
    */
    for (i = 0; i < M; i++) {
        trabalho_t trabalho;

        s = i % N_SLAVES;

        trabalho.posicao = i;
        trabalho.numero = numeros[i];

        write(master_para_slave[s][1],
              &trabalho,
              sizeof(trabalho));
    }

    /*
    Já não há mais números.
    Fechar a escrita faz os slaves receberem EOF no read().
    */
    for (s = 0; s < N_SLAVES; s++)
        close(master_para_slave[s][1]);

    /*
    ENUNCIADO:
    slaves enviam resultados de volta ao master.

    Guardamos pelo campo "posicao", porque o enunciado
    manda imprimir pela ordem original de entrada.
    */
    for (s = 0; s < N_SLAVES; s++) {
        resultado_t resultado;

        while (read(slave_para_master[s][0],
                    &resultado,
                    sizeof(resultado)) > 0) {

            resultados[resultado.posicao] =
                resultado.fatorial;
        }

        close(slave_para_master[s][0]);
    }

    for (s = 0; s < N_SLAVES; s++)
        waitpid(filhos[s], NULL, 0);

    /*
    ENUNCIADO:
    master imprime pela ordem em que os números foram lidos.
    */
    for (i = 0; i < M; i++)
        printf("%d! = %llu\n",
               numeros[i],
               resultados[i]);

    free(numeros);
    free(resultados);

    return 0;
}
