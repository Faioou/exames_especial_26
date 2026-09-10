void submit_job(shared_memory_t *shared_memory, int job_id)
{
    /* Esperar até existir pelo menos uma posição vazia */
    sem_wait(&shared_memory->empty);

    /* Obter acesso exclusivo à fila */
    sem_wait(&shared_memory->mutex);

    /* Inserir o trabalho na próxima posição livre */
    shared_memory->jobs[shared_memory->tail] = job_id;

    /* Avançar tail circularmente */
    shared_memory->tail =
        (shared_memory->tail + 1) % BUFFER_SIZE;

    /* Libertar o acesso exclusivo à fila */
    sem_post(&shared_memory->mutex);

    /* Informar que existe mais um trabalho disponível */
    sem_post(&shared_memory->full);
}


int get_job(shared_memory_t *shared_memory)
{
    int job_id;

    /* Esperar até existir pelo menos um trabalho */
    sem_wait(&shared_memory->full);

    /* Obter acesso exclusivo à fila */
    sem_wait(&shared_memory->mutex);

    /* Retirar o trabalho mais antigo */
    job_id = shared_memory->jobs[shared_memory->head];

    /* Avançar head circularmente */
    shared_memory->head =
        (shared_memory->head + 1) % BUFFER_SIZE;

    /* Libertar o acesso exclusivo à fila */
    sem_post(&shared_memory->mutex);

    /* Informar que existe mais uma posição vazia */
    sem_post(&shared_memory->empty);

    return job_id;
}