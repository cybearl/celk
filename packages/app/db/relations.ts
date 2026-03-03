import scAccount from "@app/db/schema/account"
import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scRoles from "@app/db/schema/role"
import scSession from "@app/db/schema/session"
import scUser from "@app/db/schema/user"
import scUserOptions from "@app/db/schema/userOptions"
import scUserRoles from "@app/db/schema/userRoles"
import { relations } from "drizzle-orm"

export const usersRelations = relations(scUser, ({ many, one }) => ({
    sessions: many(scSession),
    accounts: many(scAccount),
    userRoles: many(scUserRoles),
    userOptions: one(scUserOptions),
    addressLists: many(scAddressList),
    addresses: many(scAddress),
}))

export const sessionsRelations = relations(scSession, ({ one }) => ({
    user: one(scUser, { fields: [scSession.userId], references: [scUser.id] }),
}))

export const accountsRelations = relations(scAccount, ({ one }) => ({
    user: one(scUser, { fields: [scAccount.userId], references: [scUser.id] }),
}))

export const userOptionsRelations = relations(scUserOptions, ({ one }) => ({
    user: one(scUser, { fields: [scUserOptions.userId], references: [scUser.id] }),
}))

export const rolesRelations = relations(scRoles, ({ many }) => ({
    userRoles: many(scUserRoles),
}))

export const userRolesRelations = relations(scUserRoles, ({ one }) => ({
    user: one(scUser, { fields: [scUserRoles.userId], references: [scUser.id] }),
    role: one(scRoles, { fields: [scUserRoles.roleId], references: [scRoles.id] }),
}))

export const addressListsRelations = relations(scAddressList, ({ one, many }) => ({
    user: one(scUser, { fields: [scAddressList.userId], references: [scUser.id] }),
    members: many(scPvtAddressListMember),
}))

export const addressesRelations = relations(scAddress, ({ one, many }) => ({
    user: one(scUser, { fields: [scAddress.userId], references: [scUser.id] }),
    listMembers: many(scPvtAddressListMember),
}))

export const addressListMembersRelations = relations(scPvtAddressListMember, ({ one }) => ({
    addressList: one(scAddressList, {
        fields: [scPvtAddressListMember.addressListId],
        references: [scAddressList.id],
    }),
    address: one(scAddress, {
        fields: [scPvtAddressListMember.addressId],
        references: [scAddress.id],
    }),
}))
