//
//  Category.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Category: Model, @unchecked Sendable{
    static let schema: String = "categories"
    
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
    
    func toDTO() -> CategoryDTO{
		return CategoryDTO(id: self.id, name: self.name, deletedAt: self.deletedAt)
    }
}
