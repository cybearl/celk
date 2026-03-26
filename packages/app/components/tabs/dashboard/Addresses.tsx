import AddAddressDialog from "@app/components/dialogs/AddAddress"
import AddressesTable from "@app/components/tables/Addresses"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"

type AddressesDashboardTabProps = {
    dynamicConfig: DynamicConfigSelectModel | null
    addresses: AddressSelectModel[] | null
}

export default function AddressesDashboardTab({ dynamicConfig, addresses }: AddressesDashboardTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex justify-end">
                <AddAddressDialog dynamicConfig={dynamicConfig} addresses={addresses} />
            </div>

            <AddressesTable dynamicConfig={dynamicConfig} addresses={addresses} />
        </div>
    )
}
