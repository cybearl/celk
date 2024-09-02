export enum AddressType {
    P2TR = "BTC::P2TR", // Pay to Taproot
    P2WPKH = "BTC::P2WPKH", // Pay to Witness Public Key Hash (SegWit)
    P2SH_P2WPKH = "BTC::P2SH_P2WPKH", // Pay to Script Hash (Legacy SegWit)
    P2PKH = "BTC::P2PKH", // Pay to Public Key Hash (Legacy)
    ETH = "ETH::ETH", // Ethereum
}
