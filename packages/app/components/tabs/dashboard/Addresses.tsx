import AddAddressDialog from "@app/components/dialogs/AddAddress"
import AddressesTable from "@app/components/tables/Addresses"
import type { AddressSelectModel, SerializedAddressSelectModel } from "@app/db/schema/address"
import { useAddresses } from "@app/hooks/api/useAddresses"

type AddressesProps = {
    addresses: SerializedAddressSelectModel[]
}

export default function Addresses({ addresses: initialAddresses }: AddressesProps) {
    const { data: addresses } = useAddresses(initialAddresses as unknown as AddressSelectModel[])

    return (
        <div className="flex flex-col gap-6">
            <div className="w-full flex justify-end">
                <AddAddressDialog />
            </div>

            <AddressesTable addresses={addresses} />
        </div>
    )
}
