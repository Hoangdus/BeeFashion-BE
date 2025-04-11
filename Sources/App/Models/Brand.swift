//
//  Brand.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Brand: Model, @unchecked Sendable {
    static let schema = "brands"
    
    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	@Timestamp(key: "deleted_at", on: .delete)
	var deletedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, name: String, createdAt: Date? = nil, updatedAt: Date? = nil, deletedAt: Date? = nil) {
		self.id = id
		self.name = name
		self.createdAt = createdAt
		self.updatedAt = updatedAt
		self.deletedAt = deletedAt
	}
    
    func toDTO() -> BrandDTO {
		return BrandDTO(id: self.id, name: self.name, deletedAt: self.deletedAt, createdAt: self.createdAt)
    }
}
