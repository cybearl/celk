#include "core/engine.hpp"
#include "core/publicKeysDeriver.hpp"
#include "protocol.hpp"
#include "utils/hex.hpp"
#include "utils/maths.hpp"
#include <cstring>
#include <random>
#include <thread>

void Engine::build(const std::vector<AddressDump>& dumps, const UserOptions& userOptions) {
    std::random_device rd;
    const uint64_t pcg64Seed = (static_cast<uint64_t>(rd()) << 32) | rd();

    for (const AddressDump& dump : dumps) {
        TargetAddress targetAddress;
        targetAddress.id = dump.id;
        targetAddress.type = dump.type;
        targetAddress.rawBytes = hexStringToVector(dump.preEncoding.value_or(dump.value));
        targetAddress.value = dump.value;

        if (dump.privateKeyRangeStart.has_value()) {
            targetAddress.startRange = uint256_t(*dump.privateKeyRangeStart, 16);
        }

        if (dump.privateKeyRangeEnd.has_value()) {
            targetAddress.endRange = uint256_t(*dump.privateKeyRangeEnd, 16);
        }

        // Find an existing group matching this dump's generator type
        GeneratorGroup* matchingGroup = nullptr;

        for (GeneratorGroup& generatorGroup : generatorGroups) {
            if (generatorGroup.generator->getType() == dump.privateKeyGenerator) {
                matchingGroup = &generatorGroup;
                break;
            }
        }

        if (matchingGroup) {
            matchingGroup->addTargetAddress(targetAddress);
        } else {
            GeneratorConfig config;

            switch (dump.privateKeyGenerator) {
                case AddressPrivateKeyGenerator::RandBytes:
                    config = RandBytesConfig {};
                    break;
                case AddressPrivateKeyGenerator::PCG64:
                    config = PCG64Config { pcg64Seed, std::nullopt };
                    break;
                case AddressPrivateKeyGenerator::Sequential:
                    config = SequentialConfig { targetAddress.startRange, targetAddress.endRange, std::nullopt };
                    break;
            }

            generatorGroups.emplace_back(config, targetAddress);
        }
    }

    // Collect all target addresses for the "mixGenerators" mode
    std::vector<TargetAddress*> allTargetAddresses;

    if (userOptions.mixGenerators) {
        for (GeneratorGroup& group : generatorGroups) {
            auto groupTargetAddresses = group.getAllTargetAddresses();

            allTargetAddresses.insert(
                allTargetAddresses.end(), groupTargetAddresses.begin(), groupTargetAddresses.end());
        }
    }

    for (GeneratorGroup& group : generatorGroups) {
        const std::vector<TargetAddress*>& targetAddresses
            = userOptions.mixGenerators ? allTargetAddresses : group.getAllTargetAddresses();

        group.initComparator(targetAddresses);
    }
}

void Engine::run(
    std::atomic<bool>& stopFlag, std::atomic<uint64_t>& attempts, MatchState& matchState, bool stopOnFirstMatch) {
    std::vector<std::thread> threads;
    threads.reserve(generatorGroups.size());

    for (GeneratorGroup& group : generatorGroups) {
        threads.emplace_back([&]() {
            PublicKeysDeriver deriver;
            uint8_t rawPrivateKey[32];
            uint8_t effectivePrivateKey[32];

            while (!stopFlag.load(std::memory_order_relaxed)) {
                if (!group.generator->next(rawPrivateKey)) {
                    break; // Sequential generator exhausted its range
                }

                for (RangeSubGroup& subGroup : group.rangeSubGroups) {
                    if (subGroup.rangeStart.has_value()) {
                        clampPrivateKeyToRange(
                            rawPrivateKey, effectivePrivateKey, *subGroup.rangeStart, *subGroup.rangeEnd);
                    } else {
                        std::memcpy(effectivePrivateKey, rawPrivateKey, 32);
                    }

                    deriver.derive(effectivePrivateKey);
                    const TargetAddress* matchingAddress = group.comparator->compare(deriver);

                    if (matchingAddress) {
                        std::lock_guard<std::mutex> lock(matchState.stateMutex);

                        matchState.address = matchingAddress->value;
                        matchState.privateKey
                            = "0x" + vectorToHexString({ effectivePrivateKey, effectivePrivateKey + 32 });
                        matchState.isFound.store(true, std::memory_order_relaxed);

                        if (stopOnFirstMatch) {
                            stopFlag.store(true, std::memory_order_relaxed);
                        }
                    }
                }

                attempts.fetch_add(1, std::memory_order_relaxed);
            }
        });
    }

    for (std::thread& thread : threads) {
        thread.join();
    }

    // Signal the main loop to exit if all generators finished naturally (e.g. Sequential exhausted)
    stopFlag.store(true, std::memory_order_relaxed);
}
