#include <unistd.h>

/*
    parent_to_child[i][0] -> leitura pelo filho i
    parent_to_child[i][1] -> escrita pelo pai

    child_to_parent[i][0] -> leitura pelo pai
    child_to_parent[i][1] -> escrita pelo filho i
*/


int parent_function(int parent_to_child[2][2],
                    int child_to_parent[2][2],
                    int *vec, int n)
{
    int i;
    int partial_sum[2];
    int total;


    /*
        O pai apenas ESCREVE em parent_to_child,
        por isso fecha as extremidades de leitura.

        O pai apenas LÊ de child_to_parent,
        por isso fecha as extremidades de escrita.
    */
    for (i = 0; i < 2; i++) {
        close(parent_to_child[i][0]);
        close(child_to_parent[i][1]);
    }


    /*
        "enviar alternadamente cada número para um dos filhos"

        i = 0 -> filho 0
        i = 1 -> filho 1
        i = 2 -> filho 0
        i = 3 -> filho 1
        ...
    */
    for (i = 0; i < n; i++) {

        int child = i % 2;

        write(parent_to_child[child][1],
              &vec[i],
              sizeof(int));
    }


    /*
        Já não existem mais números.

        Fechar a escrita faz com que os filhos
        recebam EOF no read().
    */
    close(parent_to_child[0][1]);
    close(parent_to_child[1][1]);


    /*
        "receber de cada filho a soma parcial dos quadrados"
    */
    read(child_to_parent[0][0],
         &partial_sum[0],
         sizeof(int));

    read(child_to_parent[1][0],
         &partial_sum[1],
         sizeof(int));


    close(child_to_parent[0][0]);
    close(child_to_parent[1][0]);


    /*
        "determinar e retornar a soma total dos quadrados"
    */
    total = partial_sum[0] + partial_sum[1];

    return total;
}



void child_function(int child_id,
                    int parent_to_child[2][2],
                    int child_to_parent[2][2])
{
    int i;
    int value;
    int partial_sum = 0;


    /*
        O filho só precisa de:

        parent_to_child[child_id][0]
            -> receber números do pai

        child_to_parent[child_id][1]
            -> enviar resultado ao pai

        Fecha todos os restantes descritores.
    */
    for (i = 0; i < 2; i++) {

        /* filhos nunca escrevem nestes pipes */
        close(parent_to_child[i][1]);

        /* filhos nunca leem destes pipes */
        close(child_to_parent[i][0]);

        if (i != child_id) {
            close(parent_to_child[i][0]);
            close(child_to_parent[i][1]);
        }
    }


    /*
        "receber através do pipe correspondente
         todos os números enviados pelo pai"

        read() devolve 0 quando o pai fecha o pipe.
    */
    while (read(parent_to_child[child_id][0],
                &value,
                sizeof(int)) > 0) {

        /*
            "calcular a soma dos quadrados
             dos valores recebidos"
        */
        partial_sum += value * value;
    }


    close(parent_to_child[child_id][0]);


    /*
        "enviar a soma parcial ao pai através
         do pipe correspondente"
    */
    write(child_to_parent[child_id][1],
          &partial_sum,
          sizeof(int));


    close(child_to_parent[child_id][1]);
}