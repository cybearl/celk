// Windows compatibility shim for memset_s (C11 Annex K),
// clang++ on Windows doesn't auto-link the Universal CRT (ucrt.lib) where
// this function lives, so we provide a conforming implementation instead
#ifdef _WIN32

#include <errno.h>
#include <stddef.h>

#ifndef EOVERFLOW
#define EOVERFLOW ERANGE
#endif

extern "C" int memset_s(void* v, size_t smax, int c, size_t n) {
    if (!v) {
        return EINVAL;
    }

    volatile unsigned char* p = static_cast<volatile unsigned char*>(v);

    const size_t count = n < smax ? n : smax;
    for (size_t i = 0; i < count; i++) {
        p[i] = static_cast<unsigned char>(c);
    }

    return n <= smax ? 0 : EOVERFLOW;
}

#endif
