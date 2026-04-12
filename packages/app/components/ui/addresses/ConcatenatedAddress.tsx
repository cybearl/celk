import CopyToClipboard from "@app/components/ui/CopyToClipboard"
import ADDRESSES_CONFIG from "@app/config/addresses"

type ConcatenatedAddressProps = {
    address: string
    successCopyMessage: string
}

export default function ConcatenatedAddress({ address, successCopyMessage }: ConcatenatedAddressProps) {
    return (
        <div className="flex justify-start items-center gap-1.5">
            <span>
                {address.slice(0, ADDRESSES_CONFIG.concatenationSize)}...
                {address.slice(-ADDRESSES_CONFIG.concatenationSize)}
            </span>
            <CopyToClipboard
                buttonLabel="Copy address"
                text={address}
                successMessage={successCopyMessage}
                variant="icon"
            />
        </div>
    )
}
