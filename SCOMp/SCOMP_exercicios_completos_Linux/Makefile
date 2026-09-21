CC = gcc
CFLAGS = -std=c11 -Wall -Wextra -Wpedantic -pthread
LDFLAGS = -pthread

SOURCES := $(wildcard *.c)
TARGETS := $(patsubst %.c,bin/%,$(SOURCES))

.PHONY: all clean

all: $(TARGETS)

bin:
	mkdir -p bin

bin/%: %.c | bin
	$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

clean:
	rm -rf bin
