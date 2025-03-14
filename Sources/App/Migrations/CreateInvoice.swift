//
//  CreateInvoice.swift
//
//
//  Created by HoangDus on 13/03/2025.
//

import Fluent

struct CreateInvoice: AsyncMigration {
	func prepare(on database: Database) async throws {
		let invoiceStatus = try await database.enum("invoice_status")
			.case("pending")
			.case("packing")
			.case("intransit")
			.case("completed")
			.case("returned")
			.case("cancelled")
			.case("pendingcancel")
			.create()
		
		let paymentMethod = try await database.enum("payment_method")
			.case("zalopay")
			.case("cod")
			.create()
		
		try await database.schema("invoices")
			.id()
			.field("customer_id", .uuid, .required, .references("customers", "id"))
			.field("address_id", .uuid, .required, .references("addresses", "id"))
			.field("total", .int)
			.field("paid_status", .bool)
			.field("status", invoiceStatus, .required)
			.field("payment_status", paymentMethod, .required)
			.field("created_at", .date)
			.field("updated_at", .date)
			.create()
	}

	func revert(on database: Database) async throws {
		try await database.schema("invoices").delete()
	}
}
