//
//  CreateAddress.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 19/02/2025.
//

import Fluent

struct CreateAddress: Migration {
    func prepare(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("addresses")
            .id()
            .field("customer_id", .uuid, .required, .references("customers", "id"))
            .field("province", .string, .required)
            .field("district", .string, .required)
            .field("ward", .string, .required)
            .field("detail", .string, .required)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .create()
    }
    
    func revert(on database: any Database) -> EventLoopFuture<Void> {
        return database.schema("addresses").delete()
    }
}
