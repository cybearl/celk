import AddAddressDialog from "@app/components/dialogs/AddAddress"
import AddressesTable from "@app/components/tables/Addresses"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { ConfigSelectModel } from "@app/db/schema/config"

type AddressesDashboardTabProps = {
    config: ConfigSelectModel | null
    addresses: AddressSelectModel[] | null
}

export default function AddressesDashboardTab({ config, addresses }: AddressesDashboardTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex justify-end">
                <AddAddressDialog config={config} addresses={addresses} />
            </div>

            <AddressesTable config={config} addresses={addresses} />
        </div>
    )
}
