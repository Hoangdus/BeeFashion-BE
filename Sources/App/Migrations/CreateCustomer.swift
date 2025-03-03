//
//  CreateCustomer.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 18/02/2025.
//

import Fluent

struct CreateCustomer: Migration {
    func prepare(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("customers")
            .id()
            .field("full_name", .string)
            .field("email", .string, .required)
            .field("phone", .string)
            .field("date_of_birth", .string)
            .field("gender", .string)
            .field("password", .string, .required)
            .field("avatar", .string)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .unique(on: "email")
            .create()
    }
    
    func revert(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("customers").delete()
    }
}

