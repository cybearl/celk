#include "core/dump.hpp"
#include "core/engine.hpp"
#include "core/io.hpp"
#include "protocol.hpp"
#include "types.hpp"
#include "utils/json.hpp"
#include <atomic>
#include <chrono>
#include <iostream>
#include <mutex>
#include <queue>
#include <string>
#include <thread>

int main() {
    std::string startLine;
    StartWorkerMessage startMessage;

    try {
        std::getline(std::cin, startLine);
        startMessage = deserializeJson(startLine).get<StartWorkerMessage>();
    } catch (const std::exception& e) {
        std::cerr << "Failed to parse start message: " << e.what() << std::endl;
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

    Engine engine;

    try {
        engine.build(addressDumps, startMessage.userOptions);
    } catch (const std::exception& e) {
        sendError(e.what());
        return 1;
    }

    std::thread workerThread([&]() { engine.run(stopFlag, attempts, matchState, startMessage.stopOnFirstMatch); });

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
            std::cerr << "Heartbeat timeout: no ack received within " << startMessage.heartbeatTimeoutMs << "ms."
                      << std::endl;
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

            // Merge closest matches from all subgroups, keeping the best score per target
            for (const GeneratorGroup& group : engine.generatorGroups) {
                for (const auto& [address, closestMatch] : group.comparator->closestMatches) {
                    auto iterator = message.closestMatches.find(address);
                    if (iterator == message.closestMatches.end() || closestMatch.score > iterator->second) {
                        message.closestMatches[address] = closestMatch.score;
                    }
                }
            }

            std::string line = serializeJson(nlohmann::json(message));
            ioWrite(line);

            lastReport = now;
        }

        // Send one match message per pending match (queue prevents overwriting when two matches
        // land in the same poll cycle, e.g. sequential pk=1 and pk=2 both found within 10 ms)
        if (matchState.isFound.exchange(false)) {
            std::lock_guard<std::mutex> lock(matchState.stateMutex);

            // Snapshot of the total attempts accumulated by past reports + pending in the atomic counter
            const uint64_t attemptsSnapshot = matchState.totalAttempts + attempts.load(std::memory_order_relaxed);

            while (!matchState.pendingMatches.empty()) {
                const PendingMatch& pending = matchState.pendingMatches.front();

                WorkerMatchMessage message;
                message.type = WorkerMessageType::Match;
                message.addressListId = startMessage.addressListId;
                message.address = pending.address;
                message.privateKey = pending.privateKey;
                message.totalAttempts = std::to_string(attemptsSnapshot);
                message.stopOnFirstMatch = startMessage.stopOnFirstMatch;

                ioWrite(serializeJson(nlohmann::json(message)));
                matchState.pendingMatches.pop();
            }

            if (startMessage.stopOnFirstMatch) {
                stopFlag.store(true, std::memory_order_relaxed);
            }
        }

        if (stopFlag.load(std::memory_order_relaxed)) {
            // Final report to flush any attempts that accumulated since the last periodic report
            uint64_t drainedAttempts = attempts.exchange(0);

            {
                std::lock_guard<std::mutex> lock(matchState.stateMutex);
                matchState.totalAttempts += drainedAttempts;
            }

            if (drainedAttempts > 0) {
                WorkerReportMessage finalReport;
                finalReport.type = WorkerMessageType::Report;
                finalReport.addressListId = startMessage.addressListId;
                finalReport.attempts = std::to_string(drainedAttempts);

                for (const GeneratorGroup& generatorGroup : engine.generatorGroups) {
                    for (const auto& [address, closestMatch] : generatorGroup.comparator->closestMatches) {
                        auto iterator = finalReport.closestMatches.find(address);

                        // Merge closest matches from all subgroups, keeping the best score per target
                        if (iterator == finalReport.closestMatches.end() || closestMatch.score > iterator->second) {
                            finalReport.closestMatches[address] = closestMatch.score;
                        }
                    }
                }

                ioWrite(serializeJson(nlohmann::json(finalReport)));
            }

            break;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    workerThread.join();
}
