import dedent from "dedent-js";


export const M_INVALID_CONFIG = dedent`
    The global configuration ended up being invalid:
`;

export const M_COMMAND_NOT_RECOGNIZED = dedent`
    This command is not recognized.
    Please type '-h' or '--help' to get more information about the available commands.

`;

export const M_BENCHMARK_NAME_NOT_PROVIDED = dedent`
    The benchmark name was not provided.
    Please type '-h' or '--help' to get more information about the available benchmarks.
`;

export const M_BENCHMARK_NOT_FOUND = dedent`
    The benchmark you are trying to run does not exist.
    Please type '-h' or '--help' to get more information about the available benchmarks.
`;

export const M_HELP = dedent`

    █▀▀ █▀▀ █░░ █▄▀ ░ ░░█ █▀   ▄▄   █░█ ▄█ ░ █▀█ █▀█
    █▄▄ ██▄ █▄▄ █░█ ▄ █▄█ ▄█   ░░   ▀▄▀ ░█ ▄ █▄█ ▀▀█

    Usage: node dist/main.js [options]

    Options:
        -h, --help          Show this help message.
        -b, --benchmark     Run a benchmark.
            cache           Run the cache benchmark.

`;

export const M_CREDITS = dedent`

    █▀▀ █▀▀ █░░ █▄▀ ░ ░░█ █▀   █▄▄ █▄█
    █▄▄ ██▄ █▄▄ █░█ ▄ █▄█ ▄█   █▄█ ░█░

      █▄█ █▀█ █▀█ ▄▀█ ▀█▀ █▀█ █▄░█ █
      ░█░ █▄█ █▀▄ █▀█ ░█░ █▄█ █░▀█ █

    This project is licensed under the MIT License.

    You can find the repository at:
    https://github.com/cybearl/celk.js

`;