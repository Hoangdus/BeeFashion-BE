//
//  CreateProductDetail.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent

struct CreateProductDetail: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("product_details")
            .id()
            .field("price", .int, .required)
            .field("quantity", .int, .required)
            .field("product_id", .uuid, .required, .references("products", "id"))
			.field("created_at", .datetime)
			.field("updated_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("product_details").delete()
    }
}
