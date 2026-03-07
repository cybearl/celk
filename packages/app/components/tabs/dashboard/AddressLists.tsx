import AddAddressListDialog from "@app/components/dialogs/AddAddressList"
import AddressListsTable from "@app/components/tables/AddressLists"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { ConfigSelectModel } from "@app/db/schema/config"

type AddressListsDashboardTabProps = {
    config: ConfigSelectModel | null
    addresses: AddressSelectModel[] | null
    addressLists: AddressListSelectModel[] | null
}

export default function AddressListsDashboardTab({ config, addresses, addressLists }: AddressListsDashboardTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex justify-end">
                <AddAddressListDialog config={config} addresses={addresses} addressLists={addressLists} />
            </div>

            <AddressListsTable config={config} addressLists={addressLists} />
        </div>
    )
}
