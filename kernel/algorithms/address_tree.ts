import Cache from "#kernel/utils/cache"

/**
 * The type of the address tree.
 */
export type AddressTreeType = "base-58" | "bech-32" | "hex"

/**
 * The `AddressNode` class ...
 */
class AddressNode {
    /**
     * The parent node of the node.
     */
    private readonly _parent: AddressNode | null

    /**
     * The value of the node.
     */
    private readonly _value: number

    /**
     * The children of the node.
     */
    private readonly _children: AddressNode[]

    /**
     * Creates a new `AddressNode` instance.
     */
    constructor(parent: AddressNode | null, value: number, children: AddressNode[] = []) {
        this._parent = parent
        this._value = value
        this._children = children
    }

    /**
     * Gets the parent node of the node.
     */
    get parent(): AddressNode | null {
        return this._parent
    }

    /**
     * Gets the value of the node.
     */
    get value(): number {
        return this._value
    }

    /**
     * Gets the children of the node.
     */
    get children(): AddressNode[] {
        return this._children
    }

    /**
     * Adds a child node to the node.
     * @param value The value of the child node.
     */
    addChild(value: number): AddressNode {
        const child = new AddressNode(this, value)
        this._children.push(child)
        return child
    }

    /**
     * Gets the child node with the specified value using binary search.
     * @param value The value of the child node.
     */
    getChild(value: number): AddressNode | null {
        let left = 0
        let right = this._children.length - 1

        while (left <= right) {
            const middle = Math.floor((left + right) / 2)

            if (this._children[middle].value === value) return this._children[middle]
            if (this._children[middle].value < value) left = middle + 1
            else right = middle - 1
        }

        return null
    }

    /**
     * Gets the path from the node to the root.
     */
    getPath(): number[] {
        const path: number[] = []
        let node: AddressNode | null = this

        while (node !== null) {
            path.push(node.value)
            node = node.parent
        }

        return path.reverse()
    }
}

/**
 * The `AddressTree` class ...
 */
export default class AddressTree {
    private readonly _BASE58_CHARSET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    private readonly _BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

    /**
     * The type of the address tree.
     */
    private _type: AddressTreeType

    /**
     * The depth of the tree.
     */
    private _depth: number

    /**
     * The dictionary of the tree.
     */
    private _dictionary: Cache

    /**
     * Creates a new `AddressTree` instance.
     * ...
     */
    constructor(type: AddressTreeType, depth: number) {
        this._type = type
        this._depth = depth
        this._dictionary = this._getDictionaryFromTreeType(type)
    }

    /**
     * Generates a dictionary from the specified tree type.
     * @param type The type of the address tree.
     */
    private _getDictionaryFromTreeType(type: AddressTreeType): Cache {
        switch (type) {
            case "base-58":
                return Cache.fromUtf8String(this._BASE58_CHARSET)
            case "bech-32":
                return Cache.fromUtf8String(this._BECH32_CHARSET)
            case "hex":
                return Cache.fromRange(0, 255)
        }
    }
}
