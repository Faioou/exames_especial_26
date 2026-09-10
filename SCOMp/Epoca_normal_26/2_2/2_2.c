void submit_job(print_queue_t *queue, int job_id)
{
    pthread_mutex_lock(&queue->mutex);

    while (queue->count == BUFFER_SIZE)
        pthread_cond_wait(&queue->not_full,
                          &queue->mutex);

    queue->jobs[queue->tail] = job_id;
    queue->tail =
        (queue->tail + 1) % BUFFER_SIZE;
    queue->count++;

    pthread_cond_signal(&queue->not_empty);

    pthread_mutex_unlock(&queue->mutex);
}


int get_job(print_queue_t *queue)
{
    int job_id;

    pthread_mutex_lock(&queue->mutex);

    while (queue->count == 0)
        pthread_cond_wait(&queue->not_empty,
                          &queue->mutex);

    job_id = queue->jobs[queue->head];
    queue->head =
        (queue->head + 1) % BUFFER_SIZE;
    queue->count--;

    pthread_cond_signal(&queue->not_full);

    pthread_mutex_unlock(&queue->mutex);

    return job_id;
}