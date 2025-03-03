//
//  CreateSize.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent

struct CreateSize: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("sizes")
            .id()
            .field("name", .string, .required)
			.field("created_at", .datetime)
			.field("updated_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("sizes").delete()
    }
}
