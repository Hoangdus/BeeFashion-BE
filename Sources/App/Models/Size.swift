//
//  Size.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Size: Model, @unchecked Sendable {
    static let schema = "sizes"
    
    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

	@Siblings(through: ProductDetailSize.self, from: \.$size, to: \.$productDetail)
	var productDetails: [ProductDetail]
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	@Timestamp(key: "deleted_at", on: .delete)
	var deletedAt: Date?
    
    init() {
        
    }
    
    init(id: UUID? = nil, name: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
        self.id = id
        self.name = name
		self.createdAt = createdAt
		self.updatedAt = updatedAt
		self.deletedAt = deletedAt
    }
    
    func toDTO() -> SizeDTO {
		return SizeDTO(id: self.id, name: self.name, deletedAt: self.deletedAt, createdAt: self.createdAt)
    }
}
