#pragma once

#include "protocol.hpp"
#include <vector>

/**
 * @brief Loads the addresses from a dump file and returns them as a vector of `AddressDump` objects.
 * @param dumpFilePath The path to the dump file to load.
 * @return The addresses from the dump file as a vector of `AddressDump` objects.
 */
std::vector<AddressDump> loadDumpFile(const std::string& dumpFilePath);
