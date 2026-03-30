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
    std::string startLine;
    StartWorkerMessage startMessage;

    try {
        std::getline(std::cin, startLine);
        startMessage = deserializeJson(startLine).get<StartWorkerMessage>();
    } catch (const std::exception&) {
        exit(1);
    }

    ioInit();

    /**
     * @brief Helper function to send an error message to the manager.
     * @param errorMessage The error message to send.
     */
    auto sendError = [&](const std::string& errorMessage) {
        WorkerErrorMessage err;
        err.type = WorkerMessageType::Error;
        err.addressListId = startMessage.addressListId;
        err.message = errorMessage;

        ioWrite(serializeJson(nlohmann::json(err)));
    };

    std::vector<AddressDump> addressDumps;
    std::atomic<bool> stopFlag { false };
    std::atomic<uint64_t> attempts { 0 };
    MatchState matchState;

    try {
        addressDumps = loadDumpFile(startMessage.addressesDumpFilePath);
    } catch (const std::exception& e) {
        sendError(e.what());
        return 1;
    }

    // Stub worker thread for now
    std::thread workerThread([&stopFlag, &attempts]() {
        while (!stopFlag.load(std::memory_order_relaxed)) {
            attempts.fetch_add(1, std::memory_order_relaxed);
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        }
    });

    auto initialTime = std::chrono::steady_clock::now();
    auto lastHeartbeat { initialTime };
    auto lastHeartbeatAck { initialTime };
    auto lastReport { initialTime };

    while (true) {
        std::queue<std::string> lines;
        ioDrain(lines);

        while (!lines.empty()) {
            std::string line = lines.front();
            lines.pop();

            try {
                auto message = deserializeJson(line);
                auto messageType = message["type"].get<WorkerMessageType>();

                switch (messageType) {
                    case WorkerMessageType::HeartbeatAck:
                        lastHeartbeatAck = std::chrono::steady_clock::now();
                        break;
                    case WorkerMessageType::Stop:
                        stopFlag.store(true, std::memory_order_relaxed);
                        break;
                    default:
                        break;
                }
            } catch (const std::exception& error) {
                sendError(std::string("Failed to parse message from manager: ") + error.what());
            }
        }

        auto now = std::chrono::steady_clock::now();

        auto elapsedTimeSinceLastHeartbeat
            = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastHeartbeat).count();

        // Send a heartbeat message to the manager
        if (elapsedTimeSinceLastHeartbeat >= startMessage.heartbeatIntervalMs) {
            WorkerHeartbeatMessage message;
            message.type = WorkerMessageType::Heartbeat;
            message.addressListId = startMessage.addressListId;

            std::string line = serializeJson(nlohmann::json(message));
            ioWrite(line);

            lastHeartbeat = now;
        }

        auto elapsedTimeSinceLastHeartbeatAck
            = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastHeartbeatAck).count();

        // Exit if the worker didn't receive the timeout in time
        if (elapsedTimeSinceLastHeartbeatAck >= startMessage.heartbeatTimeoutMs) {
            exit(1);
        }

        auto elapsedTimeSinceLastReport
            = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastReport).count();

        // Send a report message to the manager
        if (elapsedTimeSinceLastReport >= startMessage.reportIntervalMs) {
            uint64_t drainedAttempts = attempts.exchange(0);

            // Use the match state to store the total number of attempts
            std::lock_guard<std::mutex> lock(matchState.stateMutex);
            matchState.totalAttempts += drainedAttempts;

            WorkerReportMessage message;
            message.type = WorkerMessageType::Report;
            message.addressListId = startMessage.addressListId;
            message.attempts = std::to_string(drainedAttempts);

            std::string line = serializeJson(nlohmann::json(message));
            ioWrite(line);

            lastReport = now;
        }

        // Send a match to the manager
        if (matchState.isFound.exchange(false)) {
            std::lock_guard<std::mutex> lock(matchState.stateMutex);

            WorkerMatchMessage message;
            message.type = WorkerMessageType::Match;
            message.addressListId = startMessage.addressListId;
            message.address = "0x1234";
            message.privateKey = "0x1234";
            message.totalAttempts = std::to_string(matchState.totalAttempts);
            message.stopOnFirstMatch = startMessage.stopOnFirstMatch;

            std::string line = serializeJson(nlohmann::json(message));
            ioWrite(line);

            if (startMessage.stopOnFirstMatch) {
                stopFlag.store(true, std::memory_order_relaxed);
            }
        }

        if (stopFlag.load(std::memory_order_relaxed)) {
            break;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    workerThread.join();
}
