#include <stdio.h>
#include <pthread.h>

#define BUFFER_SIZE 10
#define N_SENSORS 2
#define READINGS_PER_SENSOR 40
#define TOTAL_READINGS 80

typedef struct {
    int sensor_id;
    int read_number;
    int value;
} reading_t;

typedef struct {
    reading_t buffer[BUFFER_SIZE];
    int head;
    int tail;
    int count;
    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;
} sensor_buffer_t;

typedef struct {
    int sensor_id;
    int initial_value;
    sensor_buffer_t *buffer;
} sensor_arg_t;

void put_value(sensor_buffer_t *b, reading_t r)
{
    pthread_mutex_lock(&b->mutex);

    while (b->count == BUFFER_SIZE)
        pthread_cond_wait(&b->not_full, &b->mutex);

    b->buffer[b->tail] = r;
    b->tail = (b->tail + 1) % BUFFER_SIZE;
    b->count++;

    pthread_cond_signal(&b->not_empty);
    pthread_mutex_unlock(&b->mutex);
}

reading_t get_value(sensor_buffer_t *b)
{
    reading_t r;

    pthread_mutex_lock(&b->mutex);

    while (b->count == 0)
        pthread_cond_wait(&b->not_empty, &b->mutex);

    r = b->buffer[b->head];
    b->head = (b->head + 1) % BUFFER_SIZE;
    b->count--;

    pthread_cond_signal(&b->not_full);
    pthread_mutex_unlock(&b->mutex);

    return r;
}

void *sensor_thread(void *arg)
{
    sensor_arg_t *a = (sensor_arg_t *)arg;
    int i;

    for (i = 1; i <= READINGS_PER_SENSOR; i++) {
        reading_t r;
        r.sensor_id = a->sensor_id;
        r.read_number = i;
        r.value = a->initial_value + i - 1;
        put_value(a->buffer, r);
    }

    return NULL;
}

void *registry_thread(void *arg)
{
    sensor_buffer_t *b = (sensor_buffer_t *)arg;
    int i;

    for (i = 0; i < TOTAL_READINGS; i++) {
        reading_t r = get_value(b);
        printf("Leitura %d do Sensor %c: %d\n",
               r.read_number, 'A' + r.sensor_id, r.value);
    }

    return NULL;
}

int main(void)
{
    sensor_buffer_t buffer = {0};
    pthread_t sensors[N_SENSORS];
    pthread_t registry;
    sensor_arg_t args[N_SENSORS];
    int initial_values[N_SENSORS] = {15, 22};
    int i;

    pthread_mutex_init(&buffer.mutex, NULL);
    pthread_cond_init(&buffer.not_full, NULL);
    pthread_cond_init(&buffer.not_empty, NULL);

    pthread_create(&registry, NULL, registry_thread, &buffer);

    for (i = 0; i < N_SENSORS; i++) {
        args[i].sensor_id = i;
        args[i].initial_value = initial_values[i];
        args[i].buffer = &buffer;
        pthread_create(&sensors[i], NULL, sensor_thread, &args[i]);
    }

    for (i = 0; i < N_SENSORS; i++)
        pthread_join(sensors[i], NULL);
    pthread_join(registry, NULL);

    pthread_cond_destroy(&buffer.not_empty);
    pthread_cond_destroy(&buffer.not_full);
    pthread_mutex_destroy(&buffer.mutex);

    return 0;
}
