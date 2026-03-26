import AddAddressListDialog from "@app/components/dialogs/AddAddressList"
import AddressListsTable from "@app/components/tables/AddressLists"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"

type AddressListsDashboardTabProps = {
    dynamicConfig: DynamicConfigSelectModel | null
    addresses: AddressSelectModel[] | null
    addressLists: AddressListSelectModel[] | null
}

export default function AddressListsDashboardTab({
    dynamicConfig,
    addresses,
    addressLists,
}: AddressListsDashboardTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex justify-end">
                <AddAddressListDialog dynamicConfig={dynamicConfig} addresses={addresses} addressLists={addressLists} />
            </div>

            <AddressListsTable dynamicConfig={dynamicConfig} addressLists={addressLists} />
        </div>
    )
}
