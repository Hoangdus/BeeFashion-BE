//
//  CreateRole.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//

import Fluent

struct CreateRole: Migration {
    func prepare(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("roles")
            .id()
            .field("role_name", .string, .required)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .field("deleted_at", .datetime)
            .unique(on: "role_name")
            .create()
    }
    
    func revert(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("roles").delete()
    }
}
