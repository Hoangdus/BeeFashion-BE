//
//  CreateManager.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//

import Fluent

struct CreateManager: Migration {
    func prepare(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("managers")
            .id()
            .field("role_id", .uuid, .required, .references("roles", "id"))
            .field("name", .string)
            .field("phone", .string)
            .field("email", .string, .required)
            .field("password", .string, .required)
            .field("create_at", .datetime)
            .field("updated_at", .datetime)
            .unique(on: "email")
            .create()
    }
    
    func revert(on database: Database) -> EventLoopFuture<Void> {
        return database.schema( "managers" ).delete()
    }
}
