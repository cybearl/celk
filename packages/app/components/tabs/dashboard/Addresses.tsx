import AddAddressDialog from "@app/components/dialogs/AddAddress"
import AddressesTable from "@app/components/tables/Addresses"
import type { AddressSelectModel } from "@app/db/schema/address"

type AddressesDashboardTabProps = {
    addresses: AddressSelectModel[] | null
}

export default function AddressesDashboardTab({ addresses }: AddressesDashboardTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex justify-end">
                <AddAddressDialog addresses={addresses} />
            </div>

            <AddressesTable addresses={addresses} />
        </div>
    )
}
