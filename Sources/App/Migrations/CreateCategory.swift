//
//  CreateCategory.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent

struct CreateCategory: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("categories")
            .id()
            .field("name", .string, .required)
            .field("created_at", .date)
            .field("updated_at", .date)
			.field("deleted_at", .date)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("categories").delete()
    }
}

