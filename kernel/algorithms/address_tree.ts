class AddressNode {
    //
}

/**
 * The type of the address tree.
 */
export type AddressTreeType = "base-58" | "bech-32" | "hex"

/**
 * The `AddressTree` class ...
 */
export default class AddressTree {
    /**
     * The type of the address tree.
     */
    private _type: AddressTreeType

    /**
     * The depth of the tree.
     */
    private _depth: number

    /**
     * Creates a new `AddressTree` instance.
     * ...
     */
    constructor(type: AddressTreeType, depth: number) {
        this._type = type
        this._depth = depth
    }

    private _getDictionaryFromType(type: AddressTreeType): Uint8Array {
        switch (type) {
            case "base-58":
                return new Uint8Array(58)
            case "bech-32":
                return new Uint8Array(32)
            case "hex":
                return new Uint8Array(16)
        }
    }
}
