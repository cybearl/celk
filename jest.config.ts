import type { JestConfigWithTsJest } from "ts-jest";


const jestConfig: JestConfigWithTsJest = {
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.[tj]sx?$": [
            "ts-jest",
            {
                useESM: true
            }
        ]
    },
    moduleDirectories: ["node_modules", "src"]
};

export default jestConfig;