#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

#define NUM_REGISTOS 1000000
#define NUM_FILHOS 10
#define REGISTOS_POR_FILHO 100000
#define LIMIAR 2000

/*
ENUNCIADO:
cada registo tem:
customer_code, product_code, quantity
*/
typedef struct {
    int customer_code;
    int product_code;
    int quantity;
} venda_t;

int main(void)
{
    venda_t *sales;
    int *larger;

    int pipes[NUM_FILHOS][2];
    pid_t filhos[NUM_FILHOS];

    int quantidade_larger = 0;

    int i;
    int f;

    sales = malloc(NUM_REGISTOS * sizeof(venda_t));
    larger = malloc(NUM_REGISTOS * sizeof(int));

    if (sales == NULL || larger == NULL)
        return 1;

    /*
    ENUNCIADO:
    "Assuma que os valores do array sales já estão preenchidos"

    Esta parte NÃO é a solução pedida.
    Só preenche sales para este ficheiro poder ser executado sozinho.
    */
    srand(1);

    for (i = 0; i < NUM_REGISTOS; i++) {
        sales[i].customer_code = i + 1;
        sales[i].product_code = 100000 + i;
        sales[i].quantity = rand() % 3001;
    }

    /*
    ENUNCIADO:
    filhos enviam product_code ao pai através de pipes.

    Forma simples:
    um pipe por filho.
    */
    for (f = 0; f < NUM_FILHOS; f++)
        pipe(pipes[f]);

    /*
    ENUNCIADO:
    usar 10 processos.
    */
    for (f = 0; f < NUM_FILHOS; f++) {

        filhos[f] = fork();

        if (filhos[f] == 0) {
            int inicio;
            int fim;
            int j;

            /*
            Este filho só escreve no seu próprio pipe.
            */
            for (j = 0; j < NUM_FILHOS; j++) {
                close(pipes[j][0]);

                if (j != f)
                    close(pipes[j][1]);
            }

            /*
            ENUNCIADO:
            cada filho é responsável por 100 000 registos.

            Filho 0 -> registos 0..99999
            Filho 1 -> 100000..199999
            etc.
            */
            inicio = f * REGISTOS_POR_FILHO;
            fim = inicio + REGISTOS_POR_FILHO;

            for (j = inicio; j < fim; j++) {

                /*
                ENUNCIADO:
                procurar quantity > 2000
                */
                if (sales[j].quantity > LIMIAR) {

                    /*
                    ENUNCIADO:
                    enviar product_code para o pai
                    */
                    write(pipes[f][1],
                          &sales[j].product_code,
                          sizeof(int));
                }
            }

            close(pipes[f][1]);

            free(sales);
            free(larger);

            exit(0);
        }
    }

    /*
    O pai apenas lê destes pipes.
    */
    for (f = 0; f < NUM_FILHOS; f++)
        close(pipes[f][1]);

    /*
    ENUNCIADO:
    pai guarda os códigos no array larger.
    */
    for (f = 0; f < NUM_FILHOS; f++) {
        int product_code;

        while (read(pipes[f][0],
                    &product_code,
                    sizeof(int)) > 0) {

            larger[quantidade_larger] = product_code;
            quantidade_larger++;
        }

        close(pipes[f][0]);
    }

    /*
    ENUNCIADO:
    imprimir quando todos os filhos tiverem terminado.
    */
    for (f = 0; f < NUM_FILHOS; f++)
        waitpid(filhos[f], NULL, 0);

    printf("Produtos com quantity > %d: %d\n",
           LIMIAR,
           quantidade_larger);

    for (i = 0; i < quantidade_larger; i++)
        printf("%d\n", larger[i]);

    free(sales);
    free(larger);

    return 0;
}
