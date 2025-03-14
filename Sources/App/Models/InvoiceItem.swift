//
//  InvoiceItem.swift
//
//
//  Created by HoangDus on 11/03/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

final class InvoiceItem: Model, @unchecked Sendable {
	static let schema = "invoiceItems"
	
	@ID(key: .id)
	var id: UUID?

	@Parent(key: "product_id")
	var product: Product
	
	@OptionalParent(key: "invoice_id")
	var invoice: Invoice?
	
	@Field(key: "quantity")
	var quantity: Int
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, productID: Product.IDValue, invoiceID: Invoice.IDValue? = nil, quantity: Int, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.$product.id = productID
		self.$invoice.id = invoiceID
		self.quantity = quantity
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
	
	func toDTO() -> InvoiceItemDTO {
		return InvoiceItemDTO(productID: self.$product.id, quantity: self.quantity)
	}
}

