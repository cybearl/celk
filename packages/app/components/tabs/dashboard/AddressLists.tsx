import AddAddressListDialog from "@app/components/dialogs/AddAddressList"
import AddressListsTable from "@app/components/tables/AddressLists"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"

type AddressListsDashboardTabProps = {
    addresses: AddressSelectModel[] | null
    addressLists: AddressListSelectModel[] | null
}

export default function AddressListsDashboardTab({ addresses, addressLists }: AddressListsDashboardTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex justify-end">
                <AddAddressListDialog addresses={addresses} addressLists={addressLists} />
            </div>

            <AddressListsTable addressLists={addressLists} />
        </div>
    )
}
