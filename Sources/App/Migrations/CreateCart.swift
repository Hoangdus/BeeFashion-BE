//
//  CreateCart.swift
//
//
//  Created by HoangDus on 01/03/2025.
//

import Fluent

struct CreateCart: AsyncMigration {
	func prepare(on database: Database) async throws {
		try await database.schema("carts")
			.id()
			.field("quantity", .int, .required)
			.field("product_id", .uuid, .required, .references("products", "id"))
			.field("customer_id", .uuid, .required, .references("customers", "id"))
			.field("size_id", .uuid, .required, .references("sizes", "id"))
			.field("created_at", .date)
			.field("updated_at", .date)
			.create()
	}

	func revert(on database: Database) async throws {
		try await database.schema("carts").delete()
	}
}

