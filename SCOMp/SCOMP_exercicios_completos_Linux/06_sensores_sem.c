#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>

#define BUFFER_SIZE 10
#define N_SENSORS 2
#define READINGS_PER_SENSOR 40
#define TOTAL_READINGS 80

#define SEM_MUTEX_NAME "/scomp_sensors_mutex"
#define SEM_EMPTY_NAME "/scomp_sensors_empty"
#define SEM_FULL_NAME  "/scomp_sensors_full"

typedef struct {
    int sensor_id;
    int read_number;
    int value;
} reading_t;

typedef struct {
    reading_t buffer[BUFFER_SIZE];
    int head;
    int tail;
    sem_t *mutex;
    sem_t *empty;
    sem_t *full;
} sensor_sem_buffer_t;

typedef struct {
    int sensor_id;
    int initial_value;
    sensor_sem_buffer_t *buffer;
} sensor_sem_arg_t;

void put_value_sem(sensor_sem_buffer_t *b, reading_t r)
{
    sem_wait(b->empty);
    sem_wait(b->mutex);
    b->buffer[b->tail] = r;
    b->tail = (b->tail + 1) % BUFFER_SIZE;
    sem_post(b->mutex);
    sem_post(b->full);
}

reading_t get_value_sem(sensor_sem_buffer_t *b)
{
    reading_t r;
    sem_wait(b->full);
    sem_wait(b->mutex);
    r = b->buffer[b->head];
    b->head = (b->head + 1) % BUFFER_SIZE;
    sem_post(b->mutex);
    sem_post(b->empty);
    return r;
}

void *sensor_thread_sem(void *arg)
{
    sensor_sem_arg_t *a = (sensor_sem_arg_t *)arg;
    int i;

    for (i = 1; i <= READINGS_PER_SENSOR; i++) {
        reading_t r;
        r.sensor_id = a->sensor_id;
        r.read_number = i;
        r.value = a->initial_value + i - 1;
        put_value_sem(a->buffer, r);
    }

    return NULL;
}

void *registry_thread_sem(void *arg)
{
    sensor_sem_buffer_t *b = (sensor_sem_buffer_t *)arg;
    int i;

    for (i = 0; i < TOTAL_READINGS; i++) {
        reading_t r = get_value_sem(b);
        printf("Leitura %d do Sensor %c: %d\n",
               r.read_number, 'A' + r.sensor_id, r.value);
    }

    return NULL;
}

int main(void)
{
    sensor_sem_buffer_t buffer = {0};
    pthread_t sensors[N_SENSORS];
    pthread_t registry;
    sensor_sem_arg_t args[N_SENSORS];
    int initial_values[N_SENSORS] = {15, 22};
    int i;

    sem_unlink(SEM_MUTEX_NAME);
    sem_unlink(SEM_EMPTY_NAME);
    sem_unlink(SEM_FULL_NAME);

    buffer.mutex = sem_open(SEM_MUTEX_NAME, O_CREAT, 0600, 1);
    buffer.empty = sem_open(SEM_EMPTY_NAME, O_CREAT, 0600, BUFFER_SIZE);
    buffer.full  = sem_open(SEM_FULL_NAME,  O_CREAT, 0600, 0);

    if (buffer.mutex == SEM_FAILED || buffer.empty == SEM_FAILED || buffer.full == SEM_FAILED) {
        perror("sem_open");
        return 1;
    }

    pthread_create(&registry, NULL, registry_thread_sem, &buffer);

    for (i = 0; i < N_SENSORS; i++) {
        args[i].sensor_id = i;
        args[i].initial_value = initial_values[i];
        args[i].buffer = &buffer;
        pthread_create(&sensors[i], NULL, sensor_thread_sem, &args[i]);
    }

    for (i = 0; i < N_SENSORS; i++)
        pthread_join(sensors[i], NULL);
    pthread_join(registry, NULL);

    sem_close(buffer.mutex);
    sem_close(buffer.empty);
    sem_close(buffer.full);
    sem_unlink(SEM_MUTEX_NAME);
    sem_unlink(SEM_EMPTY_NAME);
    sem_unlink(SEM_FULL_NAME);

    return 0;
}
