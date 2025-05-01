//
//  CreateLog.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 29/04/2025.
//

import Fluent

struct CreateLog: Migration {
    func prepare(on database: Database) -> EventLoopFuture<Void> {
        return database.schema("logs")
            .id()
            .field("name", .string, .required)
            .field("content_type", .string)
            .field("content", .string, .required)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .create()
    }
    
    func revert(on database: any Database) -> EventLoopFuture<Void> {
        return database.schema("logs").delete()
    }
}
