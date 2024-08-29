import Base58Encoder from "#kernel/encoders/base58"

const base58 = new Base58Encoder()

const test = base58.encode("a")
console.log(test)

const test2 = base58.decode(test)
console.log(test2)
