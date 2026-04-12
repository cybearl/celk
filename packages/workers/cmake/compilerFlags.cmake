# Wraps all compiler flags in a reusable function.
# Usage: apply_compiler_flags(<target>)
function(apply_compiler_flags target)
    if(MSVC)
        target_compile_options(${target} PRIVATE /W4 /WX)
        target_compile_options(${target} PRIVATE $<$<CONFIG:Release>:/O2>)
    else()
        target_compile_options(${target} PRIVATE
            -Wall # Enable all warnings
            -Wextra # Warn about extra issues
            -Wpedantic # Enable all strict ISO C++ compliance warnings
            -Wshadow # Warn about variable shadowing
            -Wnon-virtual-dtor # Warn about non-virtual destructors
            -Wcast-align # Warn about pointer casts that may mis-align the target
            -Wunused # Warn about unused variables
            -Woverloaded-virtual # Warn about overloaded virtual functions
            -Wnull-dereference # Warn about null pointer dereferences
            -Wformat=2 # Enable format string checks
        )
        target_compile_options(${target} PRIVATE $<$<CONFIG:Release>:-O3 -DNDEBUG>)
    endif()
endfunction()
