//
//  CreateInvoiceItem.swift
//
//
//  Created by HoangDus on 13/03/2025.
//

import Fluent

struct CreateInvoiceItem: AsyncMigration {
	func prepare(on database: Database) async throws {
		try await database.schema("invoice_items")
			.id()
			.field("product_id", .uuid, .required, .references("products", "id"))
			.field("size_id", .uuid, .required, .references("sizes", "id"))
			.field("quantity", .int, .required)
			.field("created_at", .date)
			.field("updated_at", .date)
			.create()
	}

	func revert(on database: Database) async throws {
		try await database.schema("invoice_items").delete()
	}
}

