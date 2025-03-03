//
//  CartsProduct.swift
//
//
//  Created by HoangDus on 01/03/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Cart: Model, @unchecked Sendable {
	static let schema = "carts"
	
	@ID(key: .id)
	var id: UUID?
	
	@Parent(key: "customer_id")
	var customer: Customer
	
	@Parent(key: "product_id")
	var product: Product
	
	@Field(key: "quantity")
	var quantity: Int
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, customerId: Customer.IDValue, productId: Product.IDValue, quantity: Int, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.$customer.id = customerId
		self.$product.id = productId
		self.quantity = quantity
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
}
