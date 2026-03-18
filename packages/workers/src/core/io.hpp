#pragma once

#include <queue>
#include <string>

/**
 * @brief Initializes the I/O subsystem, enabling auto-flush and starting the stdin reader thread.
 */
void ioInit();

/**
 * @brief A thread-safe stdout writer that adds a newline after each `cin` line and flushes immediately.
 * @param line The line to write to stdout.
 */
void ioWrite(const std::string& line);

/**
 * @brief Drains all pending lines from the queue into `out`.
 * @param output A reference to the string queue where the lines will be drained.
 * @return The number of lines that were drained.
 */
int ioDrain(std::queue<std::string>& output);
