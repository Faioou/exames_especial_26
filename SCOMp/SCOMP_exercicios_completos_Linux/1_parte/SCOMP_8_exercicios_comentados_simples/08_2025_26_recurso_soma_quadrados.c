#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

/*
ENUNCIADO:
o pai deve:
- enviar alternadamente os números aos dois filhos
- receber uma soma parcial de cada filho
- devolver a soma total
*/
int parent_function(int parent_to_child[2][2],
                    int child_to_parent[2][2],
                    int *vec,
                    int n)
{
    int quantidade_filho_0 = 0;
    int quantidade_filho_1 = 0;

    int soma_0;
    int soma_1;

    int i;

    close(parent_to_child[0][0]);
    close(parent_to_child[1][0]);

    close(child_to_parent[0][1]);
    close(child_to_parent[1][1]);

    /*
    Antes de enviar os valores, contamos quantos irão para cada filho.
    Isto permite ao filho saber quantos read() deve fazer.
    */
    for (i = 0; i < n; i++) {

        if (i % 2 == 0)
            quantidade_filho_0++;
        else
            quantidade_filho_1++;
    }

    write(parent_to_child[0][1],
          &quantidade_filho_0,
          sizeof(int));

    write(parent_to_child[1][1],
          &quantidade_filho_1,
          sizeof(int));

    /*
    ENUNCIADO:
    primeiro número -> filho 0
    segundo -> filho 1
    terceiro -> filho 0
    ...
    */
    for (i = 0; i < n; i++) {

        if (i % 2 == 0) {
            write(parent_to_child[0][1],
                  &vec[i],
                  sizeof(int));
        } else {
            write(parent_to_child[1][1],
                  &vec[i],
                  sizeof(int));
        }
    }

    close(parent_to_child[0][1]);
    close(parent_to_child[1][1]);

    /*
    ENUNCIADO:
    receber a soma parcial de cada filho.
    */
    read(child_to_parent[0][0],
         &soma_0,
         sizeof(int));

    read(child_to_parent[1][0],
         &soma_1,
         sizeof(int));

    close(child_to_parent[0][0]);
    close(child_to_parent[1][0]);

    /*
    ENUNCIADO:
    determinar e retornar a soma total.
    */
    return soma_0 + soma_1;
}

/*
ENUNCIADO:
cada filho:
- recebe os números enviados pelo pai
- calcula soma dos quadrados
- envia a soma parcial
*/
void child_function(int child_id,
                    int parent_to_child[2][2],
                    int child_to_parent[2][2])
{
    int quantidade;
    int numero;
    int soma = 0;

    int i;

    close(parent_to_child[0][1]);
    close(parent_to_child[1][1]);

    close(child_to_parent[0][0]);
    close(child_to_parent[1][0]);

    if (child_id == 0) {
        close(parent_to_child[1][0]);
        close(child_to_parent[1][1]);
    } else {
        close(parent_to_child[0][0]);
        close(child_to_parent[0][1]);
    }

    read(parent_to_child[child_id][0],
         &quantidade,
         sizeof(int));

    for (i = 0; i < quantidade; i++) {

        read(parent_to_child[child_id][0],
             &numero,
             sizeof(int));

        /* quadrado = numero * numero */
        soma = soma + numero * numero;
    }

    write(child_to_parent[child_id][1],
          &soma,
          sizeof(int));

    close(parent_to_child[child_id][0]);
    close(child_to_parent[child_id][1]);
}

/*
O exame pede apenas parent_function() e child_function().
Este main só existe para conseguir executar o programa.
*/
int main(int argc, char *argv[])
{
    int parent_to_child[2][2];
    int child_to_parent[2][2];

    pid_t filhos[2];

    int *vec;
    int n;

    int i;
    int filho;
    int soma_total;

    if (argc < 3) {
        printf("Exemplo: %s 1 2 3 4 5\n", argv[0]);
        return 1;
    }

    n = argc - 1;

    vec = malloc(n * sizeof(int));

    if (vec == NULL)
        return 1;

    for (i = 0; i < n; i++)
        vec[i] = atoi(argv[i + 1]);

    /*
    O exame assume os pipes já inicializados.
    Aqui criamo-los para o ficheiro ser executável.
    */
    for (i = 0; i < 2; i++) {
        pipe(parent_to_child[i]);
        pipe(child_to_parent[i]);
    }

    /*
    O exame assume os filhos já criados.
    Aqui criamo-los apenas para testar.
    */
    for (filho = 0; filho < 2; filho++) {

        filhos[filho] = fork();

        if (filhos[filho] == 0) {
            child_function(filho,
                           parent_to_child,
                           child_to_parent);
            exit(0);
        }
    }

    soma_total =
        parent_function(parent_to_child,
                        child_to_parent,
                        vec,
                        n);

    for (filho = 0; filho < 2; filho++)
        waitpid(filhos[filho], NULL, 0);

    printf("Soma total dos quadrados: %d\n",
           soma_total);

    free(vec);

    return 0;
}
