//
//  Product.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Product: Model, @unchecked Sendable{
    static let schema = "products"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "name")
    var name: String

    @OptionalChild(for: \.$product)
    var productDetail: ProductDetail?
    
    @Field(key: "image")
    var image: String
    
    @Parent(key: "category_id")
    var category: Category
    
	@Siblings(through: Favorite.self, from: \.$product, to: \.$customer)
	var customers: [Customer]
	
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
	
	@Timestamp(key: "deleted_at", on: .delete)
	var deletedAt: Date?
    
    init() {
        
    }
    
    init(id: UUID? = nil, name: String, image: String, categoryId: Category.IDValue, createdAt: Date? = nil, updatedAt: Date? = nil, deletedAt: Date? = nil) {
        self.id = id
        self.name = name
        self.image = image
        self.$category.id = categoryId
		self.createdAt = createdAt
		self.updatedAt = updatedAt
		self.deletedAt = deletedAt
    }
    
    func toDTO() -> ProductDTO{
		return ProductDTO(id: self.id, name: self.name, image: self.image, categoryId: self.$category.id, deletedAt: self.deletedAt)
    }
}
