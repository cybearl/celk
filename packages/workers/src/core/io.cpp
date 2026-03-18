#include "core/io.hpp"
#include <fcntl.h>
#include <io.h>
#include <iostream>
#include <mutex>
#include <thread>

static std::queue<std::string> lineQueue;
static std::mutex queueMutex;
static std::mutex ioMutex;

void ioInit() {
    // Set stdin and stdout to binary mode to prevent any newline translation
    _setmode(_fileno(stdout), _O_BINARY);

    // Enable auto-flush for stdout
    std::cout << std::unitbuf;

    std::thread reader([]() {
        std::string line;

        while (std::getline(std::cin, line)) {
            std::lock_guard<std::mutex> lock(queueMutex);
            lineQueue.push(line);
        }
    });

    reader.detach();
}

void ioWrite(const std::string& line) {
    std::lock_guard<std::mutex> lock(ioMutex);
    std::cout << line << '\n';
}

int ioDrain(std::queue<std::string>& output) {
    std::lock_guard<std::mutex> lock(queueMutex);

    int lineCount { 0 };

    while (!lineQueue.empty()) {
        output.push(lineQueue.front());
        lineQueue.pop();
        ++lineCount;
    }

    return lineCount;
}
