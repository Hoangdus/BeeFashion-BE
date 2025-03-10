//
//  CreateProductDetailSize.swift
//
//
//  Created by HoangDus on 03/03/2025.
//

import Fluent

struct CreateProductDetailSize: AsyncMigration {
	func prepare(on database: Database) async throws {
		try await database.schema("product_detail+size")
			.id()
			.field("product_detail_id", .uuid, .required, .references("product_details", "id"))
			.field("size_id", .uuid, .required, .references("sizes", "id"))
			.unique(on: "product_detail_id", "size_id")
			.field("created_at", .date)
			.field("updated_at", .date)
			.create()
	}

	func revert(on database: Database) async throws {
		try await database.schema("product_detail+size").delete()
	}
}
