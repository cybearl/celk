#include "core/dump.hpp"
#include "core/io.hpp"
#include "protocol.hpp"
#include "utils/json.hpp"
#include <atomic>
#include <chrono>
#include <iostream>
#include <mutex>
#include <queue>
#include <string>
#include <thread>

struct MatchState {
    std::atomic<bool> isFound { false };

    std::mutex stateMutex;
    std::string address;
    std::string privateKey;
    uint64_t totalAttempts { 0 };
};

int main() {
    std::string rawStartMessage;
    std::getline(std::cin, rawStartMessage);
    auto startMessage = deserializeJson(rawStartMessage).get<StartWorkerMessage>();

    ioInit();

    std::vector<AddressDump> addressDumps = loadDumpFile(startMessage.addressesDumpFilePath);
    std::atomic<bool> stopFlag { false };
    std::atomic<uint64_t> attempts { 0 };

    MatchState matchState;

    // Stub worker thread for now
    std::thread worker([&attempts]() {
        attempts.fetch_add(1, std::memory_order_relaxed);
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    });

    auto now = std::chrono::steady_clock::now();
    auto lastHeartbeat = now;
    auto lastHeartbeatAck = now;
    auto lastProgress = now;

    while (true) {
        std::queue<std::string> rawMessages;

        ioDrain(rawMessages);

        while (!rawMessages.empty()) {
            std::string rawMessage = rawMessages.front();

            auto message = deserializeJson(rawMessage);
            auto messageType = message["type"].get<WorkerMessageType>();

            switch (messageType) { }

            rawMessages.pop();
        }
    }
}
