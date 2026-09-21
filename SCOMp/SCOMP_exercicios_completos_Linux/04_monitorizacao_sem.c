#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>

#define BUFFER_SIZE 10
#define TOTAL_READINGS 120
#define N_SENSORS 3
#define READINGS_PER_SENSOR 40
#define THRESHOLD 30

#define SEM_MON_MUTEX  "/scomp_mon_mutex"
#define SEM_MON_EMPTY  "/scomp_mon_empty"
#define SEM_MON_FULL   "/scomp_mon_full"
#define SEM_ALERT_MUTEX "/scomp_alert_mutex"
#define SEM_ALERT_ITEMS "/scomp_alert_items"

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
    sem_t *mutex;
    sem_t *empty;
    sem_t *full;
} monitor_sem_t;

typedef struct {
    int sensor_id;
    int initial_value;
    monitor_sem_t *monitor;
} sensor_sem_arg_t;

typedef struct {
    reading_t urgent[TOTAL_READINGS];
    int head;
    int tail;
    int count;
    int registry_finished;
    sem_t *mutex;
    sem_t *items;
} alert_sem_t;

alert_sem_t alerts_sem;

void put_reading_sem(monitor_sem_t *m, reading_t r)
{
    sem_wait(m->empty);
    sem_wait(m->mutex);
    m->buffer[m->tail] = r;
    m->tail = (m->tail + 1) % BUFFER_SIZE;
    sem_post(m->mutex);
    sem_post(m->full);
}

reading_t get_reading_sem(monitor_sem_t *m)
{
    reading_t r;
    sem_wait(m->full);
    sem_wait(m->mutex);
    r = m->buffer[m->head];
    m->head = (m->head + 1) % BUFFER_SIZE;
    sem_post(m->mutex);
    sem_post(m->empty);
    return r;
}

void notify_alert_sem(alert_sem_t *a, reading_t r)
{
    sem_wait(a->mutex);
    a->urgent[a->tail] = r;
    a->tail = (a->tail + 1) % TOTAL_READINGS;
    a->count++;
    sem_post(a->mutex);
    sem_post(a->items);
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
        r.urgent_flag = (r.value > THRESHOLD);
        put_reading_sem(a->monitor, r);
    }

    return NULL;
}

void *registry_thread_sem(void *arg)
{
    monitor_sem_t *m = (monitor_sem_t *)arg;
    int i;

    for (i = 0; i < TOTAL_READINGS; i++) {
        reading_t r = get_reading_sem(m);
        printf("Leitura %d do Sensor %c: %d\n",
               r.read_number, 'A' + r.sensor_id, r.value);
        if (r.urgent_flag)
            notify_alert_sem(&alerts_sem, r);
    }

    sem_wait(alerts_sem.mutex);
    alerts_sem.registry_finished = 1;
    sem_post(alerts_sem.mutex);
    sem_post(alerts_sem.items); /* acorda a alert_thread para ela poder terminar */

    return NULL;
}

void *alert_thread_sem(void *arg)
{
    int urgent_count[N_SENSORS] = {0, 0, 0};
    int finished = 0;
    (void)arg;

    while (!finished) {
        reading_t r;

        sem_wait(alerts_sem.items);
        sem_wait(alerts_sem.mutex);

        if (alerts_sem.count == 0 && alerts_sem.registry_finished) {
            finished = 1;
        } else {
            r = alerts_sem.urgent[alerts_sem.head];
            alerts_sem.head = (alerts_sem.head + 1) % TOTAL_READINGS;
            alerts_sem.count--;
        }

        sem_post(alerts_sem.mutex);

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
    monitor_sem_t monitor = {0};
    pthread_t sensors[N_SENSORS];
    pthread_t registry;
    pthread_t alert;
    sensor_sem_arg_t args[N_SENSORS];
    int initial_values[N_SENSORS] = {15, 22, 10};
    int i;

    sem_unlink(SEM_MON_MUTEX);
    sem_unlink(SEM_MON_EMPTY);
    sem_unlink(SEM_MON_FULL);
    sem_unlink(SEM_ALERT_MUTEX);
    sem_unlink(SEM_ALERT_ITEMS);

    monitor.mutex = sem_open(SEM_MON_MUTEX, O_CREAT, 0600, 1);
    monitor.empty = sem_open(SEM_MON_EMPTY, O_CREAT, 0600, BUFFER_SIZE);
    monitor.full  = sem_open(SEM_MON_FULL,  O_CREAT, 0600, 0);
    alerts_sem.mutex = sem_open(SEM_ALERT_MUTEX, O_CREAT, 0600, 1);
    alerts_sem.items = sem_open(SEM_ALERT_ITEMS, O_CREAT, 0600, 0);

    if (monitor.mutex == SEM_FAILED || monitor.empty == SEM_FAILED ||
        monitor.full == SEM_FAILED || alerts_sem.mutex == SEM_FAILED ||
        alerts_sem.items == SEM_FAILED) {
        perror("sem_open");
        return 1;
    }

    pthread_create(&registry, NULL, registry_thread_sem, &monitor);
    pthread_create(&alert, NULL, alert_thread_sem, NULL);

    for (i = 0; i < N_SENSORS; i++) {
        args[i].sensor_id = i;
        args[i].initial_value = initial_values[i];
        args[i].monitor = &monitor;
        pthread_create(&sensors[i], NULL, sensor_thread_sem, &args[i]);
    }

    for (i = 0; i < N_SENSORS; i++)
        pthread_join(sensors[i], NULL);
    pthread_join(registry, NULL);
    pthread_join(alert, NULL);

    sem_close(monitor.mutex);
    sem_close(monitor.empty);
    sem_close(monitor.full);
    sem_close(alerts_sem.mutex);
    sem_close(alerts_sem.items);

    sem_unlink(SEM_MON_MUTEX);
    sem_unlink(SEM_MON_EMPTY);
    sem_unlink(SEM_MON_FULL);
    sem_unlink(SEM_ALERT_MUTEX);
    sem_unlink(SEM_ALERT_ITEMS);

    return 0;
}
