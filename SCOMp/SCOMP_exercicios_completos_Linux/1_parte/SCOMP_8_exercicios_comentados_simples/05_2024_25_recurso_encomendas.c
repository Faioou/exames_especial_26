#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

#define N_TRABALHADORES 3
#define PRECO_POR_UNIDADE 10

/*
O enunciado pede que o resultado final respeite
a ordem em que os pedidos foram introduzidos.

Por isso cada pedido leva também a sua posição original.
*/
typedef struct {
    int posicao;
    int unidades;
} pedido_t;

typedef struct {
    int posicao;
    int custo;
} resultado_t;

int main(void)
{
    int coordenador_para_trabalhador[N_TRABALHADORES][2];
    int trabalhador_para_coordenador[N_TRABALHADORES][2];

    pid_t filhos[N_TRABALHADORES];

    int M;
    int *pedidos;
    int *custos;

    int i;
    int t;

    /*
    ENUNCIADO:
    coordenador lê do stdin uma sequência de M pedidos.
    */
    printf("Numero de pedidos (M)? ");
    scanf("%d", &M);

    pedidos = malloc(M * sizeof(int));
    custos = malloc(M * sizeof(int));

    if (pedidos == NULL || custos == NULL)
        return 1;

    for (i = 0; i < M; i++)
        scanf("%d", &pedidos[i]);

    /*
    ENUNCIADO:
    trabalhadores recebem pedidos por pipe
    e devolvem resultados por pipe.
    */
    for (t = 0; t < N_TRABALHADORES; t++) {
        pipe(coordenador_para_trabalhador[t]);
        pipe(trabalhador_para_coordenador[t]);
    }

    /*
    ENUNCIADO:
    criar N processos filho trabalhadores.
    */
    for (t = 0; t < N_TRABALHADORES; t++) {
        filhos[t] = fork();

        if (filhos[t] == 0) {
            pedido_t pedido;
            resultado_t resultado;
            int j;

            for (j = 0; j < N_TRABALHADORES; j++) {
                close(coordenador_para_trabalhador[j][1]);
                close(trabalhador_para_coordenador[j][0]);

                if (j != t) {
                    close(coordenador_para_trabalhador[j][0]);
                    close(trabalhador_para_coordenador[j][1]);
                }
            }

            /*
            ENUNCIADO:
            cada trabalhador:
            1. recebe pedidos;
            2. calcula custo = unidades * valor fixo;
            3. devolve resultado ao coordenador.
            */
            while (read(coordenador_para_trabalhador[t][0],
                        &pedido,
                        sizeof(pedido)) > 0) {

                resultado.posicao = pedido.posicao;
                resultado.custo =
                    pedido.unidades * PRECO_POR_UNIDADE;

                write(trabalhador_para_coordenador[t][1],
                      &resultado,
                      sizeof(resultado));
            }

            close(coordenador_para_trabalhador[t][0]);
            close(trabalhador_para_coordenador[t][1]);

            exit(0);
        }
    }

    for (t = 0; t < N_TRABALHADORES; t++) {
        close(coordenador_para_trabalhador[t][0]);
        close(trabalhador_para_coordenador[t][1]);
    }

    /*
    ENUNCIADO:
    "pedidos devem ser distribuídos equitativamente"

    Forma direta:
    pedido 0 -> trabalhador 0
    pedido 1 -> trabalhador 1
    pedido 2 -> trabalhador 2
    pedido 3 -> trabalhador 0
    ...
    */
    for (i = 0; i < M; i++) {
        pedido_t pedido;

        t = i % N_TRABALHADORES;

        pedido.posicao = i;
        pedido.unidades = pedidos[i];

        write(coordenador_para_trabalhador[t][1],
              &pedido,
              sizeof(pedido));
    }

    /*
    Acabaram os pedidos.
    Fechamos a escrita para cada trabalhador receber EOF.
    */
    for (t = 0; t < N_TRABALHADORES; t++)
        close(coordenador_para_trabalhador[t][1]);

    /*
    ENUNCIADO:
    preservar a ordem dos resultados.

    Cada resultado traz "posicao",
    logo guardamo-lo nessa posição.
    */
    for (t = 0; t < N_TRABALHADORES; t++) {
        resultado_t resultado;

        while (read(trabalhador_para_coordenador[t][0],
                    &resultado,
                    sizeof(resultado)) > 0) {

            custos[resultado.posicao] = resultado.custo;
        }

        close(trabalhador_para_coordenador[t][0]);
    }

    for (t = 0; t < N_TRABALHADORES; t++)
        waitpid(filhos[t], NULL, 0);

    /*
    Agora o array custos já está na mesma ordem da entrada.
    */
    for (i = 0; i < M; i++) {
        printf("Pedido %d: %d unidades -> custo %d\n",
               i + 1,
               pedidos[i],
               custos[i]);
    }

    free(pedidos);
    free(custos);

    return 0;
}
