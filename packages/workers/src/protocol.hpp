#pragma once

#include "address.hpp"
#include "utils/json.hpp"
#include <nlohmann/json.hpp>
#include <optional>
#include <string>
#include <variant>

/**
 * Note: Should match the app's protocol entirely.
 */

/**
 * @brief The available types of messages between the main process and the worker.
 */
enum class WorkerMessageType {
    // Manager -> Worker
    Start,
    HeartbeatAck,
    Stop,

    // Worker -> Manager
    Heartbeat,
    Report,
    Match,
    Error
};

NLOHMANN_JSON_SERIALIZE_ENUM(WorkerMessageType,
    { { WorkerMessageType::Start, "start" },
        { WorkerMessageType::HeartbeatAck, "heartbeat-ack" },
        { WorkerMessageType::Stop, "stop" },
        { WorkerMessageType::Heartbeat, "heartbeat" },
        { WorkerMessageType::Report, "report" },
        { WorkerMessageType::Match, "match" },
        { WorkerMessageType::Error, "error" } })

/**
 * The base struct for all messages sent between the main process and the worker.
 */
struct WorkerMessage {
    WorkerMessageType type;
    std::string addressListId;
};

/**
 * @brief The struct for a start message sent from the main process to the worker.
 */
struct StartWorkerMessage : WorkerMessage {
    int reportIntervalMs;
    int heartbeatIntervalMs;
    int heartbeatTimeoutMs;
    bool stopOnFirstMatch;
    std::string addressesDumpFilePath;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(StartWorkerMessage,
    type,
    addressListId,
    reportIntervalMs,
    heartbeatIntervalMs,
    heartbeatTimeoutMs,
    stopOnFirstMatch,
    addressesDumpFilePath)

/**
 * @brief The struct for a heartbeat acknowledgement sent from the main process to the worker,
 * the worker kills itself if it does not receive this within `heartbeatTimeoutMs`.
 */
struct HeartbeatAckWorkerMessage : WorkerMessage { };

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(HeartbeatAckWorkerMessage, type, addressListId)

/**
 * @brief The struct for a stop message sent from the main process to the worker.
 */
struct StopWorkerMessage : WorkerMessage { };

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(StopWorkerMessage, type, addressListId)

/**
 * @brief The struct for a heartbeat message sent from the worker to the main process.
 */
struct WorkerHeartbeatMessage : WorkerMessage { };

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(WorkerHeartbeatMessage, type, addressListId)

/**
 * @brief The struct for a report message sent from the worker to the main process,
 * with the number of attempts being from the last report message sent.
 */
struct WorkerReportMessage : WorkerMessage {
    std::string attempts; // JS BigInt serialized as a string (1234n)
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(WorkerReportMessage, type, addressListId, attempts)

/**
 * @brief The struct for a match message sent from the worker to the main process.
 */
struct WorkerMatchMessage : WorkerMessage {
    std::string address;
    std::string privateKey;
    std::string attempts; // JS BigInt serialized as a string (1234n)
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(WorkerMatchMessage, type, addressListId, address, privateKey, attempts)

/**
 * @brief The struct for an error message sent from the worker to the main process.
 */
struct WorkerErrorMessage : WorkerMessage {
    std::string message;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(WorkerErrorMessage, type, addressListId, message)

/**
 * @brief A discriminated union of all message types the manager can receive from a worker.
 */
using AnyIncomingWorkerMessage
    = std::variant<WorkerHeartbeatMessage, WorkerReportMessage, WorkerMatchMessage, WorkerErrorMessage>;

/**
 * @brief The format of the metadata file for an address list dump.
 */
struct AddressListDumpMetadata {
    std::string id;
    int version;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(AddressListDumpMetadata, id, version)

/**
 * @brief The way that addresses are represented inside the JSON dump files.
 */
struct AddressDump {
    std::string id;
    std::string name;
    AddressNetwork network;
    AddressType type;
    std::string value;
    std::optional<std::string> preEncoding;
    std::optional<std::string> privateKeyRangeStart;
    std::optional<std::string> privateKeyRangeEnd;
    bool isDisabled;
    std::string addressListId;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(AddressDump,
    id,
    name,
    network,
    type,
    value,
    preEncoding,
    privateKeyRangeStart,
    privateKeyRangeEnd,
    isDisabled,
    addressListId)
