import { ADDRESS_TYPE } from "@app/db/schema/address"
import type { ReactNode } from "react"

/**
 * Labels for the address types select field.
 */
const AddressTypeLabels: Record<ADDRESS_TYPE, ReactNode> = {
    [ADDRESS_TYPE.ETHEREUM]: (
        <>
            Ethereum <span className="italic text-muted-foreground">(0x..)</span>
        </>
    ),
    [ADDRESS_TYPE.BTC_P2PKH]: (
        <>
            Bitcoin P2PKH <span className="italic text-muted-foreground">(1..)</span>
        </>
    ),
    [ADDRESS_TYPE.BTC_P2WPKH]: (
        <>
            Bitcoin P2WPKH <span className="italic text-muted-foreground">(bc1q..)</span>
        </>
    ),
}

export default AddressTypeLabels
