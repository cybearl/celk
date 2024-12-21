import Cache from "#kernel/utils/cache"
import { MemorySlot, MemorySlotWithCacheInstance } from "#kernel/utils/instructions"

// TODO

/**
 * The `AddressNode` class ...
 */
class AddressNode {
    /**
     * The parent node of the node.
     */
    readonly parent: AddressNode | null

    /**
     * The value of the node.
     */
    readonly value: number

    /**
     * The children of the node.
     */
    readonly children: AddressNode[]

    /**
     * A flag indicating whether the node is the root node.
     */
    readonly isRoot: boolean

    /**
     * A flag indicating whether the node is a leaf node.
     */
    readonly isLeaf: boolean

    /**
     * Creates a new `AddressNode` instance.
     */
    constructor(parent: AddressNode | null, value: number, children: AddressNode[] = []) {
        this.parent = parent
        this.value = value
        this.children = children

        // Flags
        this.isRoot = parent === null
        this.isLeaf = children.length === 0
    }

    /**
     * Adds a child node to the node.
     * @param value The value of the child node.
     */
    addChild(value: number): AddressNode {
        const child = new AddressNode(this, value)
        this.children.push(child)
        return child
    }

    /**
     * Gets the child node with the specified value using binary search.
     * @param value The value of the child node.
     */
    getChild(value: number): AddressNode | null {
        let left = 0
        let right = this.children.length - 1

        while (left <= right) {
            const middle = Math.floor((left + right) / 2)

            if (this.children[middle].value === value) return this.children[middle]
            if (this.children[middle].value < value) left = middle + 1
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

    /**
     * Gets the path from the node to the root as a string.
     */
    getPathAsString(): string {
        return this.getPath().join("")
    }
}

/**
 * The `AddressTree` class ...
 */
export default class AddressTree {
    /**
     * The depth of the tree.
     */
    private _depth: number

    /**
     * Creates a new `AddressTree` instance.
     * ...
     */
    constructor(depth: number) {
        this._depth = depth
    }

    addAddressFromMemorySlot(inputSlotWithCacheInstance: MemorySlotWithCacheInstance): void {
        //
    }
}
