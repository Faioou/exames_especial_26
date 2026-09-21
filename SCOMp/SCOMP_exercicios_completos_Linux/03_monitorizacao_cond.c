#include <stdio.h>
#include <pthread.h>

#define BUFFER_SIZE 10
#define TOTAL_READINGS 120
#define N_SENSORS 3
#define READINGS_PER_SENSOR 40
#define THRESHOLD 30

typedef struct {
    int sensor_id;
    int read_number;
    int value;
    int urgent_flag;
} reading_t;

typedef struct {
    reading_t buffer[BUFFER_SIZE];
    int head;
    int tail;
    int count;
    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;
} monitor_t;

typedef struct {
    reading_t urgent[TOTAL_READINGS];
    int head;
    int tail;
    int count;
    int registry_finished;
    pthread_mutex_t mutex;
    pthread_cond_t has_alert;
} alert_queue_t;

typedef struct {
    int sensor_id;
    int initial_value;
    monitor_t *monitor;
} sensor_arg_t;

alert_queue_t alerts;

void put_reading(monitor_t *m, reading_t r)
{
    pthread_mutex_lock(&m->mutex);

    while (m->count == BUFFER_SIZE)
        pthread_cond_wait(&m->not_full, &m->mutex);

    m->buffer[m->tail] = r;
    m->tail = (m->tail + 1) % BUFFER_SIZE;
    m->count++;

    pthread_cond_signal(&m->not_empty);
    pthread_mutex_unlock(&m->mutex);
}

reading_t get_reading(monitor_t *m)
{
    reading_t r;

    pthread_mutex_lock(&m->mutex);

    while (m->count == 0)
        pthread_cond_wait(&m->not_empty, &m->mutex);

    r = m->buffer[m->head];
    m->head = (m->head + 1) % BUFFER_SIZE;
    m->count--;

    pthread_cond_signal(&m->not_full);
    pthread_mutex_unlock(&m->mutex);

    return r;
}

void notify_alert(alert_queue_t *a, reading_t r)
{
    pthread_mutex_lock(&a->mutex);

    a->urgent[a->tail] = r;
    a->tail = (a->tail + 1) % TOTAL_READINGS;
    a->count++;

    pthread_cond_signal(&a->has_alert);
    pthread_mutex_unlock(&a->mutex);
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
        r.urgent_flag = (r.value > THRESHOLD);
        put_reading(a->monitor, r);
    }

    return NULL;
}

void *registry_thread(void *arg)
{
    monitor_t *m = (monitor_t *)arg;
    int i;

    for (i = 0; i < TOTAL_READINGS; i++) {
        reading_t r = get_reading(m);
        printf("Leitura %d do Sensor %c: %d\n",
               r.read_number, 'A' + r.sensor_id, r.value);

        if (r.urgent_flag)
            notify_alert(&alerts, r);
    }

    pthread_mutex_lock(&alerts.mutex);
    alerts.registry_finished = 1;
    pthread_cond_signal(&alerts.has_alert);
    pthread_mutex_unlock(&alerts.mutex);

    return NULL;
}

void *alert_thread(void *arg)
{
    int urgent_count[N_SENSORS] = {0, 0, 0};
    int finished = 0;
    (void)arg;

    while (!finished) {
        reading_t r;

        pthread_mutex_lock(&alerts.mutex);

        while (alerts.count == 0 && !alerts.registry_finished)
            pthread_cond_wait(&alerts.has_alert, &alerts.mutex);

        if (alerts.count == 0) {
            finished = 1;
        } else {
            r = alerts.urgent[alerts.head];
            alerts.head = (alerts.head + 1) % TOTAL_READINGS;
            alerts.count--;
        }

        pthread_mutex_unlock(&alerts.mutex);

        if (!finished) {
            urgent_count[r.sensor_id]++;
            printf("ALERTA %d, Sensor %c: leitura %d, valor %d\n",
                   urgent_count[r.sensor_id],
                   'A' + r.sensor_id,
                   r.read_number,
                   r.value);
        }
    }

    return NULL;
}

int main(void)
{
    monitor_t monitor = {0};
    pthread_t sensors[N_SENSORS];
    pthread_t registry;
    pthread_t alert;
    sensor_arg_t args[N_SENSORS];
    int initial_values[N_SENSORS] = {15, 22, 10};
    int i;

    pthread_mutex_init(&monitor.mutex, NULL);
    pthread_cond_init(&monitor.not_full, NULL);
    pthread_cond_init(&monitor.not_empty, NULL);

    alerts.head = 0;
    alerts.tail = 0;
    alerts.count = 0;
    alerts.registry_finished = 0;
    pthread_mutex_init(&alerts.mutex, NULL);
    pthread_cond_init(&alerts.has_alert, NULL);

    pthread_create(&registry, NULL, registry_thread, &monitor);
    pthread_create(&alert, NULL, alert_thread, NULL);

    for (i = 0; i < N_SENSORS; i++) {
        args[i].sensor_id = i;
        args[i].initial_value = initial_values[i];
        args[i].monitor = &monitor;
        pthread_create(&sensors[i], NULL, sensor_thread, &args[i]);
    }

    for (i = 0; i < N_SENSORS; i++)
        pthread_join(sensors[i], NULL);
    pthread_join(registry, NULL);
    pthread_join(alert, NULL);

    pthread_cond_destroy(&alerts.has_alert);
    pthread_mutex_destroy(&alerts.mutex);
    pthread_cond_destroy(&monitor.not_empty);
    pthread_cond_destroy(&monitor.not_full);
    pthread_mutex_destroy(&monitor.mutex);

    return 0;
}
