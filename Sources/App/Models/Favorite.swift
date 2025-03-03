//
//  Favorite.swift
//
//
//  Created by HoangDus on 28/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Favorite: Model, @unchecked Sendable {
	static let schema = "favorites"
	
	@ID(key: .id)
	var id: UUID?

	@Parent(key: "user_id")
	var customer: Customer
	
	@Parent(key: "product_id")
	var product: Product
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, customerId: Customer.IDValue, productId: Product.IDValue, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.$customer.id = customerId
		self.$product.id = productId
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
	
	func toDTO() -> FavoriteDTO{
		return FavoriteDTO(id: self.id, productId: self.$product.id, customerId: self.$customer.id)
	}
}
