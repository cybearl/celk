#pragma once

#include <fstream>
#include <sstream>

/**
 * @brief Pours the entire content of a file into a string stream and returns it.
 * @param filePath The path to the file to read.
 * @return The content of the file as a string stream.
 */
std::string readFile(const std::string& filePath);
