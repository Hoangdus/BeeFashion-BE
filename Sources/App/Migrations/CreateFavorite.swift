//
//  CreateFavorite.swift
//
//
//  Created by HoangDus on 01/03/2025.
//

import Fluent

struct CreateFavorite: AsyncMigration {
	func prepare(on database: Database) async throws {
		try await database.schema("favorites")
			.id()
			.field("product_id", .uuid, .required, .references("products", "id"))
			.field("customer_id", .uuid, .required, .references("customers", "id"))
			.unique(on: "product_id", "customer_id")
			.field("create_at", .date)
			.field("update_at", .date)
			.create()
	}

	func revert(on database: Database) async throws {
		try await database.schema("favorites").delete()
	}
}
