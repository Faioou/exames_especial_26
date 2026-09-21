#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

/*
ENUNCIADO:
o pai deve:
- dividir o vetor em duas metades
- enviar uma metade para cada filho
- receber o maior valor de cada filho
- devolver o maior global
*/
int parent_function(int parent_to_child[2][2],
                    int child_to_parent[2][2],
                    int *vec,
                    int n)
{
    int metade;
    int i;

    int max_filho_0;
    int max_filho_1;

    metade = n / 2;

    /*
    Pai não precisa de ler de parent_to_child.
    Pai não precisa de escrever em child_to_parent.
    */
    close(parent_to_child[0][0]);
    close(parent_to_child[1][0]);

    close(child_to_parent[0][1]);
    close(child_to_parent[1][1]);

    /*
    Primeiro dizemos a cada filho quantos números vai receber.
    Neste exame n é par, portanto cada um recebe "metade".
    */
    write(parent_to_child[0][1],
          &metade,
          sizeof(int));

    write(parent_to_child[1][1],
          &metade,
          sizeof(int));

    /*
    ENUNCIADO:
    primeira metade -> filho 0
    */
    for (i = 0; i < metade; i++) {
        write(parent_to_child[0][1],
              &vec[i],
              sizeof(int));
    }

    /*
    ENUNCIADO:
    segunda metade -> filho 1
    */
    for (i = metade; i < n; i++) {
        write(parent_to_child[1][1],
              &vec[i],
              sizeof(int));
    }

    close(parent_to_child[0][1]);
    close(parent_to_child[1][1]);

    /*
    ENUNCIADO:
    receber de cada filho o maior valor calculado.
    */
    read(child_to_parent[0][0],
         &max_filho_0,
         sizeof(int));

    read(child_to_parent[1][0],
         &max_filho_1,
         sizeof(int));

    close(child_to_parent[0][0]);
    close(child_to_parent[1][0]);

    /*
    ENUNCIADO:
    determinar o maior valor global.
    */
    if (max_filho_0 > max_filho_1)
        return max_filho_0;

    return max_filho_1;
}

/*
ENUNCIADO:
cada filho:
- recebe números pelo pipe correspondente
- calcula o maior
- envia-o ao pai
*/
void child_function(int child_id,
                    int parent_to_child[2][2],
                    int child_to_parent[2][2])
{
    int quantidade;
    int numero;
    int maior;

    int i;

    /*
    Este filho só usa:
    parent_to_child[child_id][0] para ler
    child_to_parent[child_id][1] para escrever
    */
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

    /*
    Lemos o primeiro número separadamente
    para servir de primeiro "maior".
    */
    read(parent_to_child[child_id][0],
         &maior,
         sizeof(int));

    /*
    Já lemos 1 número, por isso começamos em i = 1.
    */
    for (i = 1; i < quantidade; i++) {

        read(parent_to_child[child_id][0],
             &numero,
             sizeof(int));

        if (numero > maior)
            maior = numero;
    }

    write(child_to_parent[child_id][1],
          &maior,
          sizeof(int));

    close(parent_to_child[child_id][0]);
    close(child_to_parent[child_id][1]);
}

/*
O exame pede apenas parent_function() e child_function().
Este main existe apenas para conseguir compilar e testar o exercício.
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
    int maior_global;

    /*
    O enunciado diz:
    - números vêm da linha de comandos
    - existem pelo menos 2
    - quantidade é par
    */
    if (argc < 3 || (argc - 1) % 2 != 0) {
        printf("Exemplo: %s 4 17 9 21\n", argv[0]);
        return 1;
    }

    n = argc - 1;

    vec = malloc(n * sizeof(int));

    if (vec == NULL)
        return 1;

    for (i = 0; i < n; i++)
        vec[i] = atoi(argv[i + 1]);

    /*
    O enunciado assume estes pipes já criados.
    Criamo-los aqui apenas para tornar o programa completo.
    */
    for (i = 0; i < 2; i++) {
        pipe(parent_to_child[i]);
        pipe(child_to_parent[i]);
    }

    /*
    O enunciado assume os dois filhos já criados.
    Criamo-los aqui apenas para poder testar.
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

    maior_global =
        parent_function(parent_to_child,
                        child_to_parent,
                        vec,
                        n);

    for (filho = 0; filho < 2; filho++)
        waitpid(filhos[filho], NULL, 0);

    printf("Maior valor global: %d\n",
           maior_global);

    free(vec);

    return 0;
}
