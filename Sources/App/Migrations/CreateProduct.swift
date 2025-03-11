//
//  CreateProduct.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent

struct CreateProduct: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("products")
            .id()
            .field("name", .string, .required)
            .field("image", .string, .required)
            .field("category_id", .uuid, .references("categories", "id"))
			.field("created_at", .date)
			.field("updated_at", .date)
			.field("deleted_at", .date)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("products").delete()
    }
}
