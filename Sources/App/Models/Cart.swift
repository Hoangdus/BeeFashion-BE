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
	
	@Parent(key: "size_id")
	var size: Size
	
	@Field(key: "quantity")
	var quantity: Int
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, customerId: Customer.IDValue, productId: Product.IDValue, sizeID: Size.IDValue, quantity: Int, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.$customer.id = customerId
		self.$product.id = productId
		self.$size.id = sizeID
		self.quantity = quantity
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
	
	func toDTO() -> CartDTO{
		return CartDTO(id: self.id, quantity: self.quantity, sizeID: self.$size.id, productId: self.$product.id, customerId: self.$customer.id)
	}
}
